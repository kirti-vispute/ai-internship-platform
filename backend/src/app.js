const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const internRoutes = require("./routes/intern.routes");
const companyRoutes = require("./routes/company.routes");
const internshipRoutes = require("./routes/internship.routes");
const applicationRoutes = require("./routes/application.routes");
const aiRoutes = require("./routes/ai.routes");
const adminRoutes = require("./routes/admin.routes");

const { notFoundMiddleware, errorMiddleware } = require("./middleware/error.middleware");

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

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ai-internship-platform-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/intern", internRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
