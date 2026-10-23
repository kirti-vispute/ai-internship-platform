/**
 * LinkedIn Jobs -- NOT INTEGRATED. Provider-adapter stub; see
 * naukri.provider.js for why this file exists.
 *
 * Investigated during development (2026-10-23):
 *  - LinkedIn's Talent Solutions / Jobs APIs are partner-program products
 *    (LinkedIn Marketing Developer Platform / Talent Partner programs).
 *    Access requires LinkedIn's formal approval of the integrating company,
 *    not a self-serve signup -- there is no API key a developer can simply
 *    request for job-search aggregation.
 *  - LinkedIn's robots.txt and Member Agreement explicitly restrict
 *    automated scraping of job-search/job-posting pages, and most job
 *    detail is only visible to a signed-in session. Bypassing that (login
 *    automation, headless scraping) is exactly what the task forbids.
 *
 * Legitimate integration path: apply to LinkedIn's Talent/Marketing
 * partner program and configure the resulting partner credentials through
 * this same provider file once (and if) approved.
 */

const SOURCE = "linkedin";

async function fetchJobs() {
  return { ok: true, skipped: true, reason: "no_legitimate_public_api", jobs: [] };
}

module.exports = { fetchJobs, SOURCE };
