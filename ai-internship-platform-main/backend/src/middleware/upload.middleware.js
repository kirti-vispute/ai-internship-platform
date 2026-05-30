const multer = require("multer");
const { resolveUploadDirectory, buildStoredFilename, UPLOAD_DIRECTORIES } = require("../services/file-upload.service");

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
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

module.exports = upload;
