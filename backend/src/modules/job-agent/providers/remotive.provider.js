const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");

/**
 * Remotive (https://remotive.com/api/remote-jobs) -- free, fully keyless,
 * public API. No account or credentials needed, so this provider is always
 * available regardless of environment configuration (only the enabled flag
 * can turn it off). Per Remotive's published usage terms we fetch no more
 * than a handful of times a day; the scheduler's sweep interval (default
 * 1 hour) stays well under that ceiling on its own.
 *
 * Docs: https://github.com/remotive-com/remote-jobs-api
 */

const SOURCE = "remotive";

function mapJobType(rawType) {
  const value = String(rawType || "").toLowerCase();
  if (value.includes("intern")) return "internship";
  if (value.includes("contract")) return "contract";
  if (value.includes("freelance")) return "freelance";
  if (value.includes("part")) return "part_time";
  if (value.includes("full")) return "full_time";
  return "";
}

function mapWorkMode() {
  // Remotive is a remote-jobs board end to end -- every listing on it is
  // remote by definition, so we never guess "hybrid"/"on-site" from text.
  return "remote";
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeJob(job) {
  if (!job || job.id == null || !job.url || !job.title) return null;

  return {
    source: SOURCE,
    sourceId: String(job.id),
    title: String(job.title).trim(),
    companyName: String(job.company_name || "").trim(),
    location: String(job.candidate_required_location || "").trim(),
    workMode: mapWorkMode(),
    jobType: mapJobType(job.job_type),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: String(job.category || "").trim(),
    description: stripHtml(job.description).slice(0, 8000),
    applyUrl: String(job.url).trim(),
    postedAt: job.publication_date ? new Date(job.publication_date) : null,
    raw: {
      salary: job.salary || "",
      tags: job.tags || []
    }
  };
}

/**
 * Fetches current Remotive listings. Never throws on a provider-side
 * failure -- a bad network call, a non-200 response or malformed JSON all
 * resolve to an empty array so one flaky source can never crash a sweep or
 * be mistaken for "no matching jobs". The caller is responsible for logging.
 */
async function fetchJobs({ category, search, limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.remotive;
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "disabled", jobs: [] };
  }

  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  if (limit) params.set("limit", String(limit));

  const url = `${config.baseUrl}${params.toString() ? `?${params.toString()}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return {
        ok: false,
        skipped: false,
        reason: `remotive_http_${response.status}`,
        jobs: []
      };
    }

    const data = await response.json();
    const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];
    const jobs = rawJobs.map(normalizeJob).filter(Boolean);

    return { ok: true, skipped: false, jobs };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error?.name === "TimeoutError" ? "remotive_timeout" : "remotive_fetch_error",
      error: error?.message || String(error),
      jobs: []
    };
  }
}

module.exports = { fetchJobs, SOURCE };
