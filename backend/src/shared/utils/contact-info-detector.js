/**
 * Shared "is this text actually just contact info?" detector, used by both
 * the resume parser (so a contact-info line is never classified as a
 * project/experience entry in the first place) and the Application
 * Assistant generator (as a second, independent safety net for any contact
 * block that slips through anyway -- e.g. one typed directly into a
 * profile field rather than parsed from a resume). One definition shared
 * by both call sites instead of two regex sets that could silently drift
 * apart.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d[\d\s-]{7,13}\d/;
const URL_REGEX = /https?:\/\/[^\s)]+|www\.[^\s)]+|(?:linkedin\.com|github\.com)\/[^\s)]+|\b[\w-]+\.[a-z]{2,}\/[^\s)]*/gi;

/**
 * True when `text` is essentially nothing but contact tokens (email,
 * phone, and/or a linkedin/github/portfolio URL) with little to no other
 * content -- i.e. a contact-info line, not a real project/experience/
 * summary entry. Requires at least two distinct contact signals AND almost
 * nothing left over once they're stripped out, so a genuine sentence that
 * merely happens to mention one email or one link (e.g. "Deployed to
 * example.com") is never misclassified.
 */
function looksLikeContactInfoBlock(text) {
  const raw = String(text || "").trim();
  if (!raw) return false;

  const hasEmail = EMAIL_REGEX.test(raw);
  const hasPhone = PHONE_REGEX.test(raw);
  const hasUrl = /\b(github\.com|linkedin\.com|[\w-]+\.[a-z]{2,}\/)/i.test(raw);
  const signalCount = [hasEmail, hasPhone, hasUrl].filter(Boolean).length;
  if (signalCount < 2) return false;

  const stripped = raw
    .replace(new RegExp(EMAIL_REGEX.source, "gi"), "")
    .replace(new RegExp(PHONE_REGEX.source, "g"), "")
    .replace(new RegExp(URL_REGEX.source, "gi"), "")
    .replace(/[|,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped.length < 15;
}

module.exports = { looksLikeContactInfoBlock, EMAIL_REGEX, PHONE_REGEX, URL_REGEX };
