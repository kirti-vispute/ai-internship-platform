const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const { mountModularApi, getModuleManifest } = require("./modules");
const { bootstrapPlatformServices } = require("./infrastructure/bootstrap");
const { getCacheBackendLabel } = require("./infrastructure/cache/redis.client");
const { isPostgresEnabled } = require("./infrastructure/db/postgres.client");
const { isCloudinaryEnabled } = require("./infrastructure/storage/storage.adapter");
const { PLATFORM_CONFIG } = require("./config/platform.config");

const { notFoundMiddleware, errorMiddleware } = require("./middleware/error.middleware");
const { sendSuccess } = require("./utils/api-response");

const app = express();

const configuredClientUrls = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const allowVercelPreview = String(process.env.ALLOW_VERCEL_PREVIEW || "false").toLowerCase() === "true";
const allowedOrigins = [
  ...configuredClientUrls,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001"
].filter(Boolean);

app.use(compression({ threshold: 1024 }));
app.use(helmet());
app.use(mongoSanitize());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (allowVercelPreview) {
        try {
          const hostname = new URL(origin).hostname;
          if (hostname.endsWith(".vercel.app")) return callback(null, true);
        } catch {
          // Ignore malformed origins and continue to deny.
        }
      }
      return callback(new Error("CORS origin denied"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), { maxAge: "7d", immutable: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false
  })
);

let platformStatus = {
  bootstrapped: false,
  cache: "memory",
  postgres: false,
  storage: PLATFORM_CONFIG.storage.provider
};

bootstrapPlatformServices()
  .then((status) => {
    platformStatus = { bootstrapped: true, ...status };
  })
  .catch(() => {
    platformStatus = {
      bootstrapped: false,
      cache: getCacheBackendLabel(),
      postgres: isPostgresEnabled(),
      storage: isCloudinaryEnabled() ? "cloudinary" : "local"
    };
  });

app.get("/health", (req, res) => {
  res.set("Cache-Control", "no-cache");
  return sendSuccess(res, {
    data: {
      status: "ok",
      service: "ai-internship-platform-api",
      bootstrapped: platformStatus.bootstrapped
    }
  });
});

app.get("/health/detailed", (req, res) =>
  sendSuccess(res, {
    data: {
      status: "ok",
      service: "ai-internship-platform-api",
      architecture: "serverless-modular-single-deploy",
      modules: getModuleManifest(),
      platform: platformStatus,
      freeTier: {
        frontend: "vercel",
        backend: PLATFORM_CONFIG.deployment.target,
        cache: platformStatus.cache || getCacheBackendLabel(),
        database: "mongodb-atlas-free + optional-neon-postgres",
        storage: isCloudinaryEnabled() ? "cloudinary" : "local",
        realtime: "webrtc-p2p + socket-signaling"
      }
    }
  })
);

mountModularApi(app, "/api");
mountModularApi(app, "/api/v1");

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
