const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");

/**
 * Adzuna (https://developer.adzuna.com) -- free-tier job search API that
 * requires registration (app_id + app_key). Fully optional: this provider
 * activates itself only once both credentials are present in the
 * environment, and is a silent no-op otherwise (never throws, never blocks
 * the rest of the Job Agent). See backend/.env.example for exact signup
 * steps and the free tier's non-commercial-use terms.
 */

const SOURCE = "adzuna";

function mapWorkMode(job) {
  const text = `${job?.title || ""} ${job?.description || ""}`.toLowerCase();
  if (/\bremote\b/.test(text)) return "remote";
  if (/\bhybrid\b/.test(text)) return "hybrid";
  return "";
}

// Mirrors remotive.provider.js's stripHtml -- Adzuna descriptions can carry
// raw markup, and stored listing text should never retain it, regardless
// of how a future UI chooses to render it.
function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isCredentialed(config) {
  return Boolean(config.enabled && config.appId && config.appKey);
}

function normalizeJob(job) {
  if (!job || !job.id || !job.redirect_url || !job.title) return null;

  return {
    source: SOURCE,
    sourceId: String(job.id),
    title: String(job.title).trim(),
    companyName: String(job.company?.display_name || "").trim(),
    location: String(job.location?.display_name || "").trim(),
    workMode: mapWorkMode(job),
    jobType: String(job.contract_time || job.contract_type || "").trim(),
    salaryMin: typeof job.salary_min === "number" ? job.salary_min : null,
    salaryMax: typeof job.salary_max === "number" ? job.salary_max : null,
    salaryCurrency: job.salary_min != null || job.salary_max != null ? "INR" : "",
    category: String(job.category?.label || "").trim(),
    description: stripHtml(job.description).slice(0, 8000),
    applyUrl: String(job.redirect_url).trim(),
    postedAt: job.created ? new Date(job.created) : null,
    raw: {
      // Adzuna requires a visible, linked attribution logo (>=116x23px) on
      // every page that displays results sourced from it -- the frontend
      // reads this flag to know which listings need that attribution.
      requiresAttribution: true
    }
  };
}

/**
 * Fetches current Adzuna listings for the configured country. Returns a
 * clean "not configured" result (not an error) when credentials are
 * missing, so callers can distinguish "no credentials yet" from "the
 * provider failed" and the rest of the Job Agent keeps working either way.
 */
async function fetchJobs({ what, where, page, resultsPerPage } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.adzuna;

  if (!isCredentialed(config)) {
    return {
      ok: true,
      skipped: true,
      reason: "missing_credentials",
      jobs: []
    };
  }

  const country = config.country || "in";
  const pageNum = page || 1;
  const params = new URLSearchParams({
    app_id: config.appId,
    app_key: config.appKey,
    "content-type": "application/json",
    results_per_page: String(resultsPerPage || 30)
  });
  if (what) params.set("what", what);
  if (where) params.set("where", where);

  const url = `${config.baseUrl}/${country}/search/${pageNum}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return {
        ok: false,
        skipped: false,
        reason: `adzuna_http_${response.status}`,
        jobs: []
      };
    }

    const data = await response.json();
    const rawJobs = Array.isArray(data?.results) ? data.results : [];
    const jobs = rawJobs.map(normalizeJob).filter(Boolean);

    return { ok: true, skipped: false, jobs };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error?.name === "TimeoutError" ? "adzuna_timeout" : "adzuna_fetch_error",
      error: error?.message || String(error),
      jobs: []
    };
  }
}

module.exports = { fetchJobs, SOURCE, isCredentialed };
