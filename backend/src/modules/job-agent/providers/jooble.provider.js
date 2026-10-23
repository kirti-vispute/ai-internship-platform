const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { stripHtml } = require("./shared/provider-http");

/**
 * Jooble (https://jooble.org/api/about) -- free-tier job-search aggregator
 * API that requires registration (a single API key, no OAuth). Same
 * optional/no-op-until-configured pattern as adzuna.provider.js: this
 * provider activates itself only once JOOBLE_API_KEY is present, and is a
 * silent no-op otherwise. Jooble's API is POST-based with the key in the
 * URL path, unlike every other provider here, so it can't reuse
 * fetchJsonWithRetry's GET assumption -- the retry/timeout contract is
 * duplicated deliberately rather than bent to fit.
 */

const SOURCE = "jooble";

function isCredentialed(config) {
  return Boolean(config.enabled && config.apiKey);
}

function normalizeJob(job) {
  if (!job || !job.id || !job.link || !job.title) return null;

  return {
    source: SOURCE,
    sourceId: String(job.id),
    title: String(job.title).trim(),
    companyName: String(job.company || "").trim(),
    location: String(job.location || "").trim(),
    workMode: /remote/i.test(`${job.title} ${job.location}`) ? "remote" : "",
    jobType: String(job.type || "").trim(),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: "",
    description: stripHtml(job.snippet).slice(0, 8000),
    applyUrl: String(job.link).trim(),
    postedAt: job.updated ? new Date(job.updated) : null,
    raw: { salary: job.salary || "" }
  };
}

/**
 * Fetches current Jooble listings for `keywords`/`location`. Returns a
 * clean "not configured" result (not an error) when no API key is set.
 * Never throws.
 */
async function fetchJobs({ keywords, location, limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.jooble;

  if (!isCredentialed(config)) {
    return { ok: true, skipped: true, reason: "missing_credentials", jobs: [] };
  }

  const url = `${config.baseUrl}/${config.apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ keywords: keywords || "", location: location || "" }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { ok: false, skipped: false, reason: `jooble_http_${response.status}`, jobs: [] };
    }

    const data = await response.json();
    const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];
    const jobs = rawJobs.map(normalizeJob).filter(Boolean).slice(0, limit || 100);

    return { ok: true, skipped: false, jobs };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error?.name === "TimeoutError" ? "jooble_timeout" : "jooble_fetch_error",
      error: error?.message || String(error),
      jobs: []
    };
  }
}

module.exports = { fetchJobs, SOURCE, isCredentialed };
