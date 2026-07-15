const fs = require("fs");
const path = require("path");

const UPLOAD_DIRECTORIES = Object.freeze({
  RESUMES: "resumes",
  CERTIFICATES: "certificates",
  COMPANY_PROOFS: "company-proofs",
  COMPANY_LOGOS: "company-logos",
  PROFILE_PHOTOS: "profile-photos",
  INTERVIEW_RECORDINGS: "interview-recordings",
  SCREENSHOTS: "screenshots"
});

function resolveUploadDirectory(type = UPLOAD_DIRECTORIES.RESUMES) {
  const safeType = Object.values(UPLOAD_DIRECTORIES).includes(type) ? type : UPLOAD_DIRECTORIES.RESUMES;
  const uploadDir = path.join(__dirname, "../../uploads", safeType);
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

function buildStoredFilename(originalName = "") {
  const baseName = path.basename(String(originalName || "file"));
  const ext = path.extname(baseName).slice(0, 20).replace(/[^a-zA-Z0-9.]/g, "");
  const stem = path
    .basename(baseName, path.extname(baseName))
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100) || "file";
  return `${Date.now()}_${stem}${ext}`;
}

module.exports = { UPLOAD_DIRECTORIES, resolveUploadDirectory, buildStoredFilename };
