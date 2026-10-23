const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { stripHtml, fetchJsonWithRetry } = require("./shared/provider-http");

/**
 * Greenhouse Job Board API (https://developers.greenhouse.io/job-board.html)
 * -- this is how "company career pages" are integrated legitimately: most
 * companies that use Greenhouse as their ATS publish a fully public, keyless
 * JSON API for their own career site (the same data their /careers page
 * renders), explicitly meant to be read by third parties. This is not
 * scraping -- there is no HTML parsing, no login wall, and no robots.txt to
 * respect because the endpoint is a documented public API, not a page.
 *
 * Each company is its own "board" identified by a token (visible in that
 * company's own career-page URL, e.g. boards.greenhouse.io/<token>). This
 * provider fetches one board per configured token -- there is no
 * cross-company search endpoint, so "company career pages" coverage is
 * exactly as wide as the configured token list
 * (JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS). Verified live against the real
 * public "stripe" board token during development (see the implementation
 * report for the exact command/response).
 */

const SOURCE = "greenhouse";

function normalizeJob(job, boardToken) {
  if (!job || !job.id || !job.absolute_url || !job.title) return null;

  return {
    source: SOURCE,
    sourceId: `${boardToken}:${job.id}`,
    title: String(job.title).trim(),
    // Greenhouse's job-board API has no separate "company name" field for a
    // single-tenant board -- the board token itself is the company.
    companyName: boardToken,
    location: String(job.location?.name || "").trim(),
    workMode: /remote/i.test(job.location?.name || "") ? "remote" : "",
    jobType: "",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: Array.isArray(job.departments) ? job.departments.map((d) => d.name).join(", ") : "",
    description: stripHtml(job.content).slice(0, 8000),
    applyUrl: String(job.absolute_url).trim(),
    postedAt: job.updated_at ? new Date(job.updated_at) : null,
    raw: { boardToken }
  };
}

async function fetchBoard(boardToken, baseUrl) {
  const url = `${baseUrl}/${encodeURIComponent(boardToken)}/jobs?content=true`;
  const result = await fetchJsonWithRetry(url);
  if (!result.ok) {
    return { ok: false, reason: result.httpStatus ? `greenhouse_http_${result.httpStatus}` : `greenhouse_${result.error}`, jobs: [] };
  }
  const rawJobs = Array.isArray(result.data?.jobs) ? result.data.jobs : [];
  return { ok: true, jobs: rawJobs.map((j) => normalizeJob(j, boardToken)).filter(Boolean) };
}

/**
 * Fetches current listings from every configured Greenhouse board token.
 * A single bad/unknown token never blocks the others -- its failure is
 * folded into `reason` on the aggregate result but every other board's
 * jobs still come back. Never throws.
 */
async function fetchJobs({ limit } = {}) {
  const config = PLATFORM_CONFIG.jobAgent.providers.greenhouse;
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "disabled", jobs: [] };
  }
  if (!config.boardTokens.length) {
    return { ok: true, skipped: true, reason: "no_board_tokens_configured", jobs: [] };
  }

  const boardResults = await Promise.all(
    config.boardTokens.map((token) => fetchBoard(token, config.baseUrl))
  );

  const failedBoards = boardResults.filter((r) => !r.ok);
  const jobs = boardResults.flatMap((r) => r.jobs).slice(0, limit || 200);

  if (jobs.length === 0 && failedBoards.length === boardResults.length) {
    return { ok: false, skipped: false, reason: failedBoards[0]?.reason || "greenhouse_all_boards_failed", jobs: [] };
  }

  return {
    ok: true,
    skipped: false,
    jobs,
    // Surfaced (not swallowed) so a sweep that half-succeeds is reported
    // honestly instead of looking identical to one where every board worked.
    partialFailures: failedBoards.map((r) => r.reason)
  };
}

module.exports = { fetchJobs, SOURCE };
