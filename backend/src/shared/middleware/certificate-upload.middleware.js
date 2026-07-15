const createUploadMiddleware = require("./create-upload-middleware");
const { UPLOAD_DIRECTORIES } = require("../../services/file-upload.service");

const certificateUpload = createUploadMiddleware({
  directory: UPLOAD_DIRECTORIES.CERTIFICATES,
  allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/jpg"],
  allowedExtensions: [".pdf", ".png", ".jpg", ".jpeg"],
  maxSizeBytes: 10 * 1024 * 1024,
  formatErrorMessage: "Unsupported file format. Upload PDF, PNG, JPG, or JPEG only."
});

module.exports = certificateUpload;
