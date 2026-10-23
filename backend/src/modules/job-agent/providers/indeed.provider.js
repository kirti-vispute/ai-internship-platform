/**
 * Indeed -- NOT INTEGRATED. Provider-adapter stub; see naukri.provider.js
 * for why this file exists.
 *
 * Investigated during development (2026-10-23):
 *  - Indeed's old Publisher API (XML job feed, used by many aggregators
 *    historically) stopped issuing new publisher accounts years ago and is
 *    not available to new integrators. Indeed's current API surface
 *    (Indeed Apply, employer sponsorship APIs) is for employers/ATS
 *    vendors posting jobs TO Indeed, not for pulling search results FROM
 *    it -- the opposite direction this feature needs.
 *  - Indeed's search pages actively rate-limit and challenge automated
 *    traffic; scraping them would mean bypassing anti-bot protection, which
 *    the task explicitly forbids.
 *
 * Legitimate integration path: apply for Indeed's employer/ATS partner
 * program (a different relationship than "read search results") or wait
 * for Indeed to reopen publisher-style access; configure any resulting
 * credentials through this same provider file.
 */

const SOURCE = "indeed";

async function fetchJobs() {
  return { ok: true, skipped: true, reason: "no_legitimate_public_api", jobs: [] };
}

module.exports = { fetchJobs, SOURCE };
