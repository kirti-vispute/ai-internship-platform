const multer = require("multer");
const path = require("path");
const { resolveUploadDirectory, buildStoredFilename, UPLOAD_DIRECTORIES } = require("../../services/file-upload.service");

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".txt"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resolveUploadDirectory(UPLOAD_DIRECTORIES.RESUMES));
  },
  filename: (req, file, cb) => {
    cb(null, buildStoredFilename(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase();
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.has(ext);
    if (!mimeOk || !extOk) {
      return cb(new Error("Unsupported file format. Upload PDF, DOC, DOCX, or TXT only."));
    }
    cb(null, true);
  }
});

module.exports = upload;
