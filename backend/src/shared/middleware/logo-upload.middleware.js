const createUploadMiddleware = require("./create-upload-middleware");
const { UPLOAD_DIRECTORIES } = require("../../services/file-upload.service");

const logoUpload = createUploadMiddleware({
  directory: UPLOAD_DIRECTORIES.COMPANY_LOGOS,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"],
  allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".svg"],
  maxSizeBytes: 2 * 1024 * 1024,
  formatErrorMessage: "Unsupported file format. Upload PNG, JPG, JPEG, WEBP, or SVG only."
});

module.exports = logoUpload;
