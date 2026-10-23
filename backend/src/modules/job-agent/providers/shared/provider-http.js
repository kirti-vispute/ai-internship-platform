/**
 * Shared HTTP/text helpers for job-data providers. Every provider in this
 * module follows the same contract (fetchJobs() never throws, resolves to
 * {ok, skipped, reason, jobs}), so the request plumbing -- timeout, one
 * retry on a network-level failure (never on a 4xx/5xx response, so a
 * misconfigured credential or rate limit is reported immediately instead of
 * hammered), and HTML stripping -- is centralized here instead of
 * copy-pasted into each provider file.
 */

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches JSON from `url`. Returns a tagged result instead of throwing:
 * { ok: true, data } | { ok: false, httpStatus } | { ok: false, error }.
 * Retries once on a network-level failure (DNS, connection reset, timeout)
 * -- never on a non-2xx HTTP response, which is a provider-reported outcome
 * (bad credentials, rate limit, etc.), not a transient fault worth retrying.
 */
async function fetchJsonWithRetry(url, { headers = {}, timeoutMs = 15000, retries = 1 } = {}) {
  const requestHeaders = {
    Accept: "application/json",
    // Several public job-board APIs (e.g. The Muse, Remote OK) return 403
    // to requests with no User-Agent at all, treating them as bots -- this
    // is a normal browser-like identification, not anti-bot evasion.
    "User-Agent": "Mozilla/5.0 (compatible; CareerSetuJobAgent/1.0; +https://careersetu.example)",
    ...headers
  };

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: requestHeaders,
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        return { ok: false, httpStatus: response.status };
      }

      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      lastError = error;
      if (attempt < retries) continue;
    }
  }

  return {
    ok: false,
    error: lastError?.name === "TimeoutError" ? "timeout" : (lastError?.message || String(lastError))
  };
}

module.exports = { stripHtml, fetchJsonWithRetry };
