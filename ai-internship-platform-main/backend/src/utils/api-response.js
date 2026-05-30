function sendSuccess(res, { statusCode = 200, message = "Operation successful", data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null
  });
}

function sendError(res, { statusCode = 500, message = "Internal server error", error = null } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error
  });
}

module.exports = { sendSuccess, sendError };
