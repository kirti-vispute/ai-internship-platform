const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { stripHtml, fetchJsonWithRetry } = require("./shared/provider-http");

/**
 * Remote OK (https://remoteok.com/api) -- free, keyless public JSON feed.
 * Remote OK's own published API terms ask every consumer to link back to
 * the original listing on remoteok.com and credit "Remote OK" as the
 * source; this provider's listings are marked `requiresAttribution` (same
 * convention as the Adzuna provider) so the frontend can render that
 * credit, and `applyUrl` is always Remote OK's own listing page, never
 * rewritten.
 *
 * Docs: https://remoteok.com/api (terms described in the feed's own first
 * element, which this provider skips -- see below).
 */

const SOURCE = "remoteok";

function normalizeJob(job) {
  // The feed's first array element is Remote OK's own terms-of-service
  // notice, not a job (it has a `legal` field and no `id`/`url`) -- every
  // other element is a real listing.
  if (!job || !job.id || !job.url || !(job.position || job.title)) return null;

  const salaryMin = typeof job.salary_min === "number" ? job.salary_min : null;
  const salaryMax = typeof job.salary_max === "number" ? job.salary_max : null;

  return {
    source: SOURCE,
    sourceId: String(job.id),
    title: String(job.position || job.title).trim(),
    companyName: String(job.company || "").trim(),
    location: String(job.location || "").trim(),
    // Remote OK is a remote-only board end to end, same as Remotive.
    workMode: "remote",
    jobType: "",
    salaryMin,
    salaryMax,
    salaryCurrency: salaryMin != null || salaryMax != null ? "USD" : "",
    category: Array.isArray(job.tags) ? job.tags.slice(0, 5).join(", ") : "",
    description: stripHtml(job.description).slice(0, 8000),
    applyUrl: String(job.url).trim(),
    postedAt: job.date ? new Date(job.date) : null,
    raw: { tags: job.tags || [], requiresAttribution: true }
  };
}

/**
 * Fetches current Remote OK listings. Never throws.
 */
async function fetchJobs({ limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.remoteok;
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "disabled", jobs: [] };
  }

  const result = await fetchJsonWithRetry(config.baseUrl);
  if (!result.ok) {
    return {
      ok: false,
      skipped: false,
      reason: result.httpStatus ? `remoteok_http_${result.httpStatus}` : `remoteok_${result.error}`,
      jobs: []
    };
  }

  const rawJobs = Array.isArray(result.data) ? result.data : [];
  const jobs = rawJobs
    .map(normalizeJob)
    .filter(Boolean)
    .slice(0, limit || 100);

  return { ok: true, skipped: false, jobs };
}

module.exports = { fetchJobs, SOURCE };
