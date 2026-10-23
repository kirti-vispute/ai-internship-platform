const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { stripHtml, fetchJsonWithRetry } = require("./shared/provider-http");

/**
 * The Muse (https://www.themuse.com/developers/api/v2) -- free, keyless
 * public API at reasonable volumes (The Muse asks heavy/commercial users to
 * request a key, which this provider does not require for the Job Agent's
 * own sweep volume). Included specifically because it exposes a `levels`
 * facet (e.g. "Internship", "Entry Level") that none of the other providers
 * offer -- real, provider-stated seniority rather than a keyword guess.
 *
 * Docs: https://www.themuse.com/developers/api/v2
 */

const SOURCE = "themuse";

function mapJobType(levelNames) {
  const levels = levelNames.map((l) => l.toLowerCase());
  if (levels.some((l) => l.includes("internship"))) return "internship";
  if (levels.some((l) => l.includes("entry"))) return "full_time";
  return "";
}

function normalizeJob(job) {
  if (!job || job.id == null || !job.name) return null;
  const applyUrl = job.refs?.landing_page;
  if (!applyUrl) return null;

  const levelNames = Array.isArray(job.levels) ? job.levels.map((l) => l.name || "").filter(Boolean) : [];
  const locationNames = Array.isArray(job.locations) ? job.locations.map((l) => l.name || "").filter(Boolean) : [];
  const categoryNames = Array.isArray(job.categories) ? job.categories.map((c) => c.name || "").filter(Boolean) : [];

  return {
    source: SOURCE,
    sourceId: String(job.id),
    title: String(job.name).trim(),
    companyName: String(job.company?.name || "").trim(),
    location: locationNames.join(", "),
    workMode: locationNames.some((l) => /remote/i.test(l)) ? "remote" : "",
    jobType: mapJobType(levelNames),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: categoryNames.join(", "),
    description: stripHtml(job.contents).slice(0, 8000),
    applyUrl: String(applyUrl).trim(),
    postedAt: job.publication_date ? new Date(job.publication_date) : null,
    // The Muse's own stated seniority level -- surfaced verbatim (not a
    // keyword guess) so the matching engine's fresher/internship
    // classification can prefer provider-stated data when it's available.
    raw: { levels: levelNames }
  };
}

/**
 * Fetches current The Muse listings. `levelFilter` (e.g. "Internship")
 * maps straight to the API's own `level` query param. Never throws.
 */
async function fetchJobs({ page, levelFilter, limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.themuse;
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "disabled", jobs: [] };
  }

  const params = new URLSearchParams();
  params.set("page", String(page || 0));
  if (levelFilter) params.set("level", levelFilter);

  const result = await fetchJsonWithRetry(`${config.baseUrl}?${params.toString()}`);
  if (!result.ok) {
    return {
      ok: false,
      skipped: false,
      reason: result.httpStatus ? `themuse_http_${result.httpStatus}` : `themuse_${result.error}`,
      jobs: []
    };
  }

  const rawJobs = Array.isArray(result.data?.results) ? result.data.results : [];
  const jobs = rawJobs
    .map(normalizeJob)
    .filter(Boolean)
    .slice(0, limit || 100);

  return { ok: true, skipped: false, jobs };
}

module.exports = { fetchJobs, SOURCE };
