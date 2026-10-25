/**
 * URL validation and sanitization utility.
 * Guarantees that any external URL passed to or stored by the platform
 * uses a safe, strictly-allowed protocol (http: or https:).
 * Rejects javascript:, data:, vbscript:, and malformed strings to prevent XSS.
 */

function isSafeHttpUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeHttpUrl(url, fallback = "") {
  return isSafeHttpUrl(url) ? url.trim() : fallback;
}

module.exports = {
  isSafeHttpUrl,
  sanitizeHttpUrl
};
