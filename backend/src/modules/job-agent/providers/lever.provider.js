const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { stripHtml, fetchJsonWithRetry } = require("./shared/provider-http");

/**
 * Lever Postings API (https://github.com/lever/postings-api) -- the Lever
 * equivalent of greenhouse.provider.js: companies that use Lever as their
 * ATS publish a public, keyless JSON API for their own open roles (the same
 * data their /careers page renders), explicitly documented by Lever for
 * third-party consumption. One company ("site") per configured slug;
 * coverage is exactly the configured slug list
 * (JOB_PROVIDER_LEVER_COMPANY_SLUGS). Verified live against the real public
 * "spotify" posting feed during development (see the implementation report).
 */

const SOURCE = "lever";

function normalizeJob(job, companySlug) {
  if (!job || !job.id || !job.hostedUrl || !job.text) return null;

  return {
    source: SOURCE,
    sourceId: `${companySlug}:${job.id}`,
    title: String(job.text).trim(),
    companyName: companySlug,
    location: String(job.categories?.location || "").trim(),
    workMode: /remote/i.test(job.categories?.location || "") ? "remote" : "",
    jobType: String(job.categories?.commitment || "").toLowerCase().includes("intern") ? "internship" : "",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: String(job.categories?.team || "").trim(),
    description: stripHtml(job.descriptionPlain || job.description).slice(0, 8000),
    applyUrl: String(job.hostedUrl).trim(),
    postedAt: job.createdAt ? new Date(job.createdAt) : null,
    raw: { companySlug }
  };
}

async function fetchCompany(companySlug, baseUrl) {
  const url = `${baseUrl}/${encodeURIComponent(companySlug)}?mode=json`;
  const result = await fetchJsonWithRetry(url);
  if (!result.ok) {
    return { ok: false, reason: result.httpStatus ? `lever_http_${result.httpStatus}` : `lever_${result.error}`, jobs: [] };
  }
  const rawJobs = Array.isArray(result.data) ? result.data : [];
  return { ok: true, jobs: rawJobs.map((j) => normalizeJob(j, companySlug)).filter(Boolean) };
}

/**
 * Fetches current listings from every configured Lever company slug. Same
 * per-company failure isolation as the Greenhouse provider. Never throws.
 */
async function fetchJobs({ limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.lever;
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "disabled", jobs: [] };
  }
  if (!config.companySlugs.length) {
    return { ok: true, skipped: true, reason: "no_company_slugs_configured", jobs: [] };
  }

  const companyResults = await Promise.all(
    config.companySlugs.map((slug) => fetchCompany(slug, config.baseUrl))
  );

  const failedCompanies = companyResults.filter((r) => !r.ok);
  const jobs = companyResults.flatMap((r) => r.jobs).slice(0, limit || 200);

  if (jobs.length === 0 && failedCompanies.length === companyResults.length) {
    return { ok: false, skipped: false, reason: failedCompanies[0]?.reason || "lever_all_companies_failed", jobs: [] };
  }

  return {
    ok: true,
    skipped: false,
    jobs,
    partialFailures: failedCompanies.map((r) => r.reason)
  };
}

module.exports = { fetchJobs, SOURCE };
