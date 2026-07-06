// Centralized cache-key builders and TTLs.
//
// Keeping keys in one place avoids hardcoded strings scattered across modules
// and keeps read paths and their invalidation in sync. Keys are namespaced by
// domain; every student key is scoped by studentId (the user _id) so a single
// student's cache can be invalidated without touching others.
//
// NOTE: builders return the *logical* key. The global `internai:` prefix is
// applied by the cache helper, so do not add it here.

const CacheKeys = Object.freeze({
  // Student dashboard read models (scoped by studentId = user _id).
  studentProfile: (studentId) => `student:${studentId}:profile`,
  studentResume: (studentId) => `student:${studentId}:resume-score`,
  // ATS score is the resume score view in this codebase; kept as a distinct
  // alias so callers/docs stay explicit and future divergence is cheap.
  studentATS: (studentId) => `student:${studentId}:ats-score`,
  studentRecommendation: (studentId) => `student:${studentId}:recommendation`,
  studentSkillGap: (studentId, internshipId) =>
    `student:${studentId}:skill-gap:${internshipId}`,
  studentApplications: (studentId, page = 1, limit = 10) =>
    `student:${studentId}:applications:p${page}:l${limit}`,
  studentCalendar: (studentId, from = "all", to = "all") =>
    `student:${studentId}:calendar:${from}:${to}`,

  // Namespace prefixes for pattern-based invalidation (all pages/ranges/gaps).
  studentSkillGapPrefix: (studentId) => `student:${studentId}:skill-gap`,
  studentApplicationsPrefix: (studentId) => `student:${studentId}:applications`,
  studentCalendarPrefix: (studentId) => `student:${studentId}:calendar`
});

// TTLs in seconds, matching the dashboard performance spec.
const CacheTTL = Object.freeze({
  profile: 10 * 60, // 10 minutes
  resumeScore: 30 * 60, // 30 minutes
  atsScore: 30 * 60, // 30 minutes
  recommendation: 30 * 60, // 30 minutes
  skillGap: 30 * 60, // 30 minutes
  applications: 5 * 60, // 5 minutes
  calendar: 5 * 60 // 5 minutes
});

module.exports = { CacheKeys, CacheTTL };
