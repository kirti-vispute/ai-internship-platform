const multer = require("multer");
const path = require("path");
const { resolveUploadDirectory, buildStoredFilename, UPLOAD_DIRECTORIES } = require("../../services/file-upload.service");

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg"
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resolveUploadDirectory(UPLOAD_DIRECTORIES.CERTIFICATES));
  },
  filename: (req, file, cb) => {
    cb(null, buildStoredFilename(file.originalname));
  }
});

const certificateUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase();
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.has(ext);
    if (!mimeOk || !extOk) {
      return cb(new Error("Unsupported file format. Upload PDF, PNG, JPG, or JPEG only."));
    }
    cb(null, true);
  }
});

module.exports = certificateUpload;
