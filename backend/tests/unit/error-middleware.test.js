const { errorMiddleware } = require("../../src/shared/middleware/error.middleware");
const AppError = require("../../src/shared/utils/AppError");

function mockRes() {
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
  return res;
}

describe("errorMiddleware hardening", () => {
  const req = { method: "GET", originalUrl: "/api/test", requestId: "req-1" };
  const next = jest.fn();

  test("translates Mongoose CastError to 400 Bad Request with path info", () => {
    const castErr = new Error("Cast to ObjectId failed");
    castErr.name = "CastError";
    castErr.path = "applicationId";

    const res = mockRes();
    errorMiddleware(castErr, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toContain("applicationId");
  });

  test("translates Mongoose ValidationError to 400 Bad Request", () => {
    const valErr = new Error("Validation failed: status is required");
    valErr.name = "ValidationError";

    const res = mockRes();
    errorMiddleware(valErr, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toContain("Validation failed");
  });

  test("masks non-operational 500 error messages in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const dbErr = new Error("MongoNetworkError: failed to connect to server [10.0.0.5:27017]");
      const res = mockRes();

      errorMiddleware(dbErr, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.payload.message).toBe("Internal server error");
      expect(res.payload.message).not.toContain("10.0.0.5");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test("preserves operational AppError message even in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const appErr = new AppError("Tracked application not found.", 404, null, { code: "APPLICATION_NOT_FOUND" });
      const res = mockRes();

      errorMiddleware(appErr, req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.payload.message).toBe("Tracked application not found.");
      expect(res.payload.code).toBe("APPLICATION_NOT_FOUND");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
