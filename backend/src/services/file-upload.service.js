const fs = require("fs");
const path = require("path");

const UPLOAD_DIRECTORIES = Object.freeze({
  RESUMES: "resumes",
  CERTIFICATES: "certificates",
  COMPANY_PROOFS: "company-proofs",
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
  const safeName = String(originalName || "file").replace(/\s+/g, "_");
  return `${Date.now()}_${safeName}`;
}

module.exports = { UPLOAD_DIRECTORIES, resolveUploadDirectory, buildStoredFilename };
