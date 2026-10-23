/**
 * Wellfound (formerly AngelList Talent) -- NOT INTEGRATED. Provider-adapter
 * stub; see naukri.provider.js for why this file exists.
 *
 * Investigated during development (2026-10-23):
 *  - Wellfound's public jobs API (the old AngelList Talent API) was
 *    deprecated; there is no current self-serve, keyless or key-signup API
 *    for pulling its job listings.
 *  - Its search/listing pages require a session for full results and are
 *    not published as a structured feed, so reading them would mean
 *    scraping behind sign-in/anti-bot controls, which the task forbids.
 *
 * Legitimate integration path: watch for Wellfound to reopen a public API,
 * or pursue a direct data-partnership; configure any resulting credentials
 * through this same provider file.
 */

const SOURCE = "wellfound";

async function fetchJobs() {
  return { ok: true, skipped: true, reason: "no_legitimate_public_api", jobs: [] };
}

module.exports = { fetchJobs, SOURCE };
