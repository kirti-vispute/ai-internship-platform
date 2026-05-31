const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const authRoutes = require("./routes/auth.routes");
const internRoutes = require("./routes/intern.routes");
const companyRoutes = require("./routes/company.routes");
const internshipRoutes = require("./routes/internship.routes");
const applicationRoutes = require("./routes/application.routes");
const aiRoutes = require("./routes/ai.routes");
const adminRoutes = require("./routes/admin.routes");
const candidateRoutes = require("./routes/candidate.routes");
const skillRoutes = require("./routes/skill.routes");

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
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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

app.get("/health", (req, res) => sendSuccess(res, { data: { status: "ok", service: "ai-internship-platform-api" } }));

function mountApi(prefix) {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/intern`, internRoutes);
  app.use(`${prefix}/company`, companyRoutes);
  app.use(`${prefix}/internships`, internshipRoutes);
  app.use(`${prefix}/applications`, applicationRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/candidates`, candidateRoutes);
  app.use(`${prefix}/skills`, skillRoutes);
}

mountApi("/api");
mountApi("/api/v1");

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

