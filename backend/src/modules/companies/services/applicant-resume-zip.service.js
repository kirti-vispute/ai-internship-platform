const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Mirrors the resume-path resolution used by
// modules/applications/controllers/application.controller.js. Kept local
// (rather than imported) because that version lives one module over and
// isn't exported for reuse; duplicating a handful of lines here avoids
// touching code outside this feature's blast radius.
function normalizeResumePath(filePath = "") {
  let normalized = String(filePath || "").replace(/\\/g, "/").trim();
  if (!normalized) return "";
  normalized = normalized.replace(/^\/+/, "");
  if (normalized.startsWith("backend/")) normalized = normalized.slice("backend/".length);
  const uploadsIdx = normalized.indexOf("uploads/");
  if (uploadsIdx >= 0) return normalized.slice(uploadsIdx);
  return normalized;
}

function resolveAbsoluteResumePath(filePath = "") {
  const normalized = normalizeResumePath(filePath);
  if (!normalized) return "";
  // This file lives at modules/companies/services/, the same depth below
  // backend/src as modules/applications/controllers/, so the same ../../
  // join lands on backend/src/modules/uploads/... as it does there.
  const absolute = path.join(__dirname, "../..", normalized);
  if (!fs.existsSync(absolute)) return "";
  return absolute;
}

function isRemoteUrl(value = "") {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function sanitizeFilenameSegment(value = "", fallback = "candidate") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .replace(/\s+/g, "_");
  return cleaned || fallback;
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/**
 * Builds a zip archive of resumes for a list of (lean, populated) Application
 * documents, plus an applicants.csv manifest so the download is useful even
 * without opening every file. Local resumes are streamed from disk; resumes
 * stored remotely (e.g. Cloudinary, when STORAGE_PROVIDER=cloudinary) are
 * fetched and appended. Applications with no resolvable resume are skipped
 * from the archive but still listed in the manifest with "No" so nothing
 * silently disappears from the count.
 *
 * Returns the archiver instance (not yet finalized) and a usedNames Set is
 * tracked internally to avoid collisions when two applicants share a name.
 */
function buildApplicantResumeZipArchive(applications = []) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const usedNames = new Set();
  const manifestRows = [
    ["Candidate Name", "Email", "Mobile", "Role", "Status", "Applied At", "Match Score", "Resume Included"]
  ];

  const pendingRemoteFetches = [];

  for (const application of applications) {
    const intern = application.intern || {};
    const internship = application.internship || {};
    const candidateName = intern.fullName || "Candidate";
    const baseName = sanitizeFilenameSegment(candidateName);
    const resumePath = application.attachedResumePath || intern?.resume?.filePath || "";

    let entryName = "";
    let included = false;

    const absolutePath = resolveAbsoluteResumePath(resumePath);
    if (absolutePath) {
      let ext = path.extname(absolutePath) || "";
      entryName = uniqueEntryName(usedNames, baseName, ext);
      archive.file(absolutePath, { name: entryName });
      included = true;
    } else if (isRemoteUrl(resumePath)) {
      let ext = path.extname(new URL(resumePath).pathname) || "";
      entryName = uniqueEntryName(usedNames, baseName, ext);
      pendingRemoteFetches.push({ url: resumePath, entryName });
      included = true;
    }

    manifestRows.push([
      candidateName,
      intern.email || "",
      intern.mobile || "",
      internship.role || "",
      application.status || "",
      formatDate(application.appliedAt || application.createdAt),
      application.relevanceScore ?? application.matchScore ?? "",
      included ? "Yes" : "No"
    ]);
  }

  const manifestCsv = manifestRows.map((row) => row.map(csvEscape).join(",")).join("\n");
  archive.append(manifestCsv, { name: "applicants.csv" });

  // Remote (e.g. Cloudinary) resumes are fetched lazily and appended before
  // archive.finalize() is called by the controller. Exposed on the archive
  // instance so the controller can await it without this service needing to
  // know about Express.
  archive.pendingRemoteFetches = (async () => {
    for (const { url, entryName } of pendingRemoteFetches) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: entryName });
      } catch {
        // Skip resumes that fail to fetch rather than failing the whole zip.
      }
    }
  })();

  return archive;
}

function uniqueEntryName(usedNames, baseName, ext) {
  let candidate = `${baseName}${ext}`;
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${baseName}_${suffix}${ext}`;
    suffix += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

module.exports = { buildApplicantResumeZipArchive };
