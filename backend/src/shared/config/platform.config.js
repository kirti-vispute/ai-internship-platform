function toBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const PLATFORM_CONFIG = Object.freeze({
  env: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 5000),
  clientUrl: String(process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim(),

  database: {
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internai",
    // Optional Neon Postgres for analytics/read-models (Phase 2). Primary app data stays on MongoDB Atlas Free (M0).
    postgresUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || ""
  },

  redis: {
    enabled: toBool(process.env.REDIS_ENABLED, Boolean(process.env.UPSTASH_REDIS_REST_URL)),
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    defaultTtlSeconds: toInt(process.env.REDIS_DEFAULT_TTL_SECONDS, 3600)
  },

  ai: {
    enabled: toBool(process.env.ENABLE_AI, true),
    groqApiKey: process.env.GROQ_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || "",
    huggingFaceModel: process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2",
    cacheTtlSeconds: toInt(process.env.AI_CACHE_TTL_SECONDS, 86400),
    requestsPerMinute: toInt(process.env.AI_REQUESTS_PER_MINUTE, 10),
    batchSize: toInt(process.env.AI_BATCH_SIZE, 5),
    preferLocalHeuristics: toBool(process.env.AI_PREFER_LOCAL_HEURISTICS, true)
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || "local",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
    cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "internai"
  },

  realtime: {
    chatEnabled: toBool(process.env.ENABLE_CHAT, true),
    interviewRoomsEnabled: toBool(process.env.ENABLE_INTERVIEW_ROOMS, true),
    maxConcurrentSockets: toInt(process.env.MAX_CONCURRENT_SOCKETS, 500)
  },

  jobAgent: {
    enabled: toBool(process.env.ENABLE_JOB_AGENT, true),
    sweepIntervalMs: toInt(process.env.JOB_AGENT_SWEEP_INTERVAL_MS, 60 * 60 * 1000),
    maxJobsPerSweep: toInt(process.env.JOB_AGENT_MAX_JOBS_PER_SWEEP, 200),
    minFitScoreForAlert: toInt(process.env.JOB_AGENT_MIN_FIT_SCORE_FOR_ALERT, 60),
    // Configurable weights for the explainable 0-100 job-fit score (see
    // job-matching.service.js). Must sum to 1 for the score to stay on a
    // 0-100 scale; left un-enforced here deliberately so an operator can
    // intentionally under/over-weight a dimension without a hard crash.
    // roleRelevance tied with requiredSkills as the two dominant
    // dimensions -- a listing in a plainly unrelated profession (and thus
    // with nothing tech-related to list as "required skills") must not be
    // able to out-score a role mismatch just because the skills dimension
    // is vacuously 100% (see classifyRoleRelevance's own doc comment).
    matchWeights: {
      roleRelevance: toInt(process.env.JOB_AGENT_WEIGHT_ROLE_RELEVANCE, 0.3),
      requiredSkills: toInt(process.env.JOB_AGENT_WEIGHT_REQUIRED_SKILLS, 0.3),
      preferredSkills: toInt(process.env.JOB_AGENT_WEIGHT_PREFERRED_SKILLS, 0.1),
      experience: toInt(process.env.JOB_AGENT_WEIGHT_EXPERIENCE, 0.1),
      eligibility: toInt(process.env.JOB_AGENT_WEIGHT_ELIGIBILITY, 0.05),
      preferences: toInt(process.env.JOB_AGENT_WEIGHT_PREFERENCES, 0.15)
    },
    providers: {
      remotive: {
        enabled: toBool(process.env.JOB_PROVIDER_REMOTIVE_ENABLED, true),
        baseUrl: process.env.REMOTIVE_API_BASE_URL || "https://remotive.com/api/remote-jobs"
      },
      adzuna: {
        enabled: toBool(process.env.JOB_PROVIDER_ADZUNA_ENABLED, true),
        appId: process.env.ADZUNA_APP_ID || "",
        appKey: process.env.ADZUNA_APP_KEY || "",
        country: process.env.ADZUNA_COUNTRY || "in",
        baseUrl: process.env.ADZUNA_API_BASE_URL || "https://api.adzuna.com/v1/api/jobs"
      },
      // Free, keyless public APIs -- active by default, same as Remotive.
      arbeitnow: {
        enabled: toBool(process.env.JOB_PROVIDER_ARBEITNOW_ENABLED, true),
        baseUrl: process.env.ARBEITNOW_API_BASE_URL || "https://www.arbeitnow.com/api/job-board-api"
      },
      themuse: {
        enabled: toBool(process.env.JOB_PROVIDER_THEMUSE_ENABLED, true),
        baseUrl: process.env.THEMUSE_API_BASE_URL || "https://www.themuse.com/api/public/jobs"
      },
      remoteok: {
        enabled: toBool(process.env.JOB_PROVIDER_REMOTEOK_ENABLED, true),
        baseUrl: process.env.REMOTEOK_API_BASE_URL || "https://remoteok.com/api"
      },
      // "Company career pages", done legitimately: these two ATS platforms
      // publish a public JSON API per company for the exact data their own
      // /careers page renders. A no-op (skipped) until at least one board
      // token / company slug is configured -- same optional pattern as
      // Adzuna/Jooble, just keyless instead of credential-gated.
      greenhouse: {
        enabled: toBool(process.env.JOB_PROVIDER_GREENHOUSE_ENABLED, true),
        baseUrl: process.env.GREENHOUSE_API_BASE_URL || "https://boards-api.greenhouse.io/v1/boards",
        boardTokens: String(process.env.JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      },
      lever: {
        enabled: toBool(process.env.JOB_PROVIDER_LEVER_ENABLED, true),
        baseUrl: process.env.LEVER_API_BASE_URL || "https://api.lever.co/v0/postings",
        companySlugs: String(process.env.JOB_PROVIDER_LEVER_COMPANY_SLUGS || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      },
      // Free-tier aggregator requiring a registered API key -- optional,
      // same pattern as Adzuna.
      jooble: {
        enabled: toBool(process.env.JOB_PROVIDER_JOOBLE_ENABLED, true),
        apiKey: process.env.JOOBLE_API_KEY || "",
        baseUrl: process.env.JOOBLE_API_BASE_URL || "https://jooble.org/api"
      },
      // No legitimate public API exists for these today -- see each
      // provider file's own doc comment. Kept as config entries (rather
      // than omitted) so the dashboard's provider-health panel can report
      // them as "requires partnership/credentials" instead of silently
      // pretending they don't exist.
      naukri: { enabled: true },
      linkedin: { enabled: true },
      indeed: { enabled: true },
      wellfound: { enabled: true }
    }
  },

  deployment: {
    target: process.env.DEPLOY_TARGET || "render",
    region: process.env.DEPLOY_REGION || "auto"
  }
});

module.exports = { PLATFORM_CONFIG };
