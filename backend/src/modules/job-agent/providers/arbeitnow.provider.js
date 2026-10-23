const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { stripHtml, fetchJsonWithRetry } = require("./shared/provider-http");

/**
 * Arbeitnow (https://www.arbeitnow.com/api/job-board-api) -- free, fully
 * keyless, public JSON API explicitly published for third-party job boards
 * and aggregators. No account or credentials needed, so (like Remotive)
 * this provider is always available unless disabled.
 *
 * Docs: https://documenter.getpostman.com/view/18545278/UVsFz9xC
 */

const SOURCE = "arbeitnow";

function mapWorkMode(job) {
  if (job?.remote) return "remote";
  return "";
}

function mapJobType(jobTypes) {
  const types = Array.isArray(jobTypes) ? jobTypes.map((t) => String(t).toLowerCase()) : [];
  if (types.some((t) => t.includes("intern"))) return "internship";
  if (types.some((t) => t.includes("contract") || t.includes("freelance"))) return "contract";
  if (types.some((t) => t.includes("part"))) return "part_time";
  if (types.some((t) => t.includes("full"))) return "full_time";
  return "";
}

function normalizeJob(job) {
  if (!job || !job.slug || !job.url || !job.title) return null;

  return {
    source: SOURCE,
    sourceId: String(job.slug),
    title: String(job.title).trim(),
    companyName: String(job.company_name || "").trim(),
    location: String(job.location || "").trim(),
    workMode: mapWorkMode(job),
    jobType: mapJobType(job.job_types),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: Array.isArray(job.tags) ? job.tags.slice(0, 3).join(", ") : "",
    description: stripHtml(job.description).slice(0, 8000),
    applyUrl: String(job.url).trim(),
    // Arbeitnow's created_at is Unix seconds, not an ISO string.
    postedAt: job.created_at ? new Date(job.created_at * 1000) : null,
    raw: { tags: job.tags || [] }
  };
}

/**
 * Fetches current Arbeitnow listings. Never throws -- a bad network call,
 * non-200 response, or malformed JSON all resolve to an empty array so one
 * flaky source never crashes a sweep.
 */
async function fetchJobs({ limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.arbeitnow;
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "disabled", jobs: [] };
  }

  const result = await fetchJsonWithRetry(config.baseUrl);
  if (!result.ok) {
    return {
      ok: false,
      skipped: false,
      reason: result.httpStatus ? `arbeitnow_http_${result.httpStatus}` : `arbeitnow_${result.error}`,
      jobs: []
    };
  }

  const rawJobs = Array.isArray(result.data?.data) ? result.data.data : [];
  const jobs = rawJobs
    .map(normalizeJob)
    .filter(Boolean)
    .slice(0, limit || 100);

  return { ok: true, skipped: false, jobs };
}

module.exports = { fetchJobs, SOURCE };
