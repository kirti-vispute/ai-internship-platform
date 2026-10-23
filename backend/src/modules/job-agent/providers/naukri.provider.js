/**
 * Naukri.com -- NOT INTEGRATED. This file exists only to satisfy the
 * provider-adapter interface (so the discovery pipeline, dashboard
 * "provider health" panel, and feed filters can list Naukri as a known,
 * honestly-reported source) and to document why.
 *
 * Investigated during development (2026-10-23):
 *  - Naukri publishes no public, self-serve job-search API for third-party
 *    aggregators. Its only documented API surface is the Naukri RMS
 *    (recruiter) product, which requires a commercial partnership and
 *    credentials Naukri issues directly to employers/ATS vendors -- not
 *    something obtainable by registering for a key, the way Adzuna/Jooble
 *    work.
 *  - Naukri's own job-search pages are not meant to be machine-read by
 *    outside parties: there is no public JobPosting structured-data feed
 *    equivalent to Greenhouse/Lever's APIs, and its search results require
 *    a session. Scraping them would mean bypassing anti-bot/session
 *    controls, which the task explicitly forbids.
 *
 * Legitimate integration path: becoming a Naukri RMS/API partner (contact
 * Naukri's business team) and configuring the resulting partner credentials
 * through this same provider file once issued -- do not scrape in the
 * meantime.
 */

const SOURCE = "naukri";

async function fetchJobs() {
  return { ok: true, skipped: true, reason: "no_legitimate_public_api", jobs: [] };
}

module.exports = { fetchJobs, SOURCE };
