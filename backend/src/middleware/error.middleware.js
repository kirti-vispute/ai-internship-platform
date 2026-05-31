const { sendError } = require("../utils/api-response");

function notFoundMiddleware(req, res, next) {
  return sendError(res, { statusCode: 404, message: "Route not found" });
}

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

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
