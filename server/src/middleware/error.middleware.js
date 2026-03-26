function notFoundMiddleware(req, res, next) {
  res.status(404).json({ message: "Route not found" });
}

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}

module.exports = { notFoundMiddleware, errorMiddleware };
