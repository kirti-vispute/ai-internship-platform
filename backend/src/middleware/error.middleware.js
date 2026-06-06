const { sendError } = require("../utils/api-response");

function notFoundMiddleware(req, res, next) {
  return sendError(res, { statusCode: 404, message: "Route not found" });
}

function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Certificate file exceeds maximum allowed size." : err.message;
  } else if (String(message).toLowerCase().includes("unsupported file format")) {
    statusCode = 400;
  }

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return sendError(res, {
    statusCode,
    message,
    error: process.env.NODE_ENV === "development" ? { stack: err.stack } : null
  });
}

module.exports = { notFoundMiddleware, errorMiddleware };
