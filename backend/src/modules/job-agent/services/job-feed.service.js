const Internship = require("../../../models/Internship");
const ExternalJobListing = require("../../../models/ExternalJobListing");
const { buildJobFitScore, looksSeniorListing, classifyExperienceLevel } = require("./job-matching.service");

/**
 * Builds the unified AI Job Agent feed: internal CareerSetu internships
 * (queried live -- never duplicated into a second store) merged with the
 * external listing cache populated by job-discovery.service.js, each
 * mapped to one normalized shape, scored with the shared explainable
 * fit-score engine, deduplicated, and ranked most-relevant-first.
 */

function toInternalJobShape(internship) {
  return {
    id: String(internship._id),
    source: "internal",
    sourceId: String(internship._id),
    isInternal: true,
    title: internship.role || "",
    companyName: internship.company?.companyName || internship.company?.name || "",
    location: internship.location || "",
    workMode: internship.mode || "",
    jobType: internship.internshipType || "internship",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    stipendText: internship.stipend || "",
    category: internship.department || "",
    description: internship.description || "",
    applyUrl: "",
    postedAt: internship.createdAt || null,
    skillsRequired: internship.skillsRequired || [],
    prioritySkills: internship.prioritySkills || [],
    // Company-authored eligibility text, shown verbatim rather than
    // algorithmically parsed into a pass/fail -- CGPA cutoffs and degree
    // preferences are free text and guessing at a threshold would risk a
    // false "ineligible"/"eligible" verdict the data doesn't support.
    rawEligibilityText: [
      internship.eligibilityCriteria,
      internship.educationQualification && `Education: ${internship.educationQualification}`,
      internship.degreePreferences && `Preferred degrees: ${internship.degreePreferences}`,
      internship.minimumCgpa && `Minimum CGPA: ${internship.minimumCgpa}`,
      internship.experienceRequirement && `Experience: ${internship.experienceRequirement}`
    ].filter(Boolean).join(" | ")
  };
}

function toExternalJobShape(listing) {
  return {
    id: String(listing._id),
    source: listing.source,
    sourceId: listing.sourceId,
    isInternal: false,
    title: listing.title || "",
    companyName: listing.companyName || "",
    location: listing.location || "",
    workMode: listing.workMode || "",
    jobType: listing.jobType || "",
    salaryMin: listing.salaryMin,
    salaryMax: listing.salaryMax,
    salaryCurrency: listing.salaryCurrency || "",
    stipendText: "",
    category: listing.category || "",
    description: listing.description || "",
    applyUrl: listing.applyUrl,
    postedAt: listing.postedAt,
    skillsRequired: listing.extractedSkills || [],
    prioritySkills: [],
    rawEligibilityText: "",
    requiresAttribution: Boolean(listing.raw?.requiresAttribution)
  };
}

/**
 * Normalizes an apply URL to a stable canonical form for cross-source
 * dedup: lowercase, scheme-agnostic, strips a trailing slash and any query
 * string/fragment (most ATS/aggregator URLs append tracking params like
 * ?utm_source=... that vary per source even for the identical listing).
 */
function canonicalizeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return String(url).trim().toLowerCase().replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}

/**
 * Dedupes across every configured source using normalized title + company
 * + location as the primary key, and canonical apply URL as a second,
 * independent key -- the same underlying job can reach two providers
 * (e.g. a company's own Lever board and an aggregator that also indexed
 * it) with slightly different title casing/whitespace but an identical
 * canonical URL, or vice versa (same company name typed differently, but
 * the URL confirms it's the same posting). A job is dropped as a duplicate
 * if EITHER key was already seen -- the first-seen instance wins.
 */
function dedupeAcrossSources(jobs) {
  const seenCompositeKeys = new Set();
  const seenUrlKeys = new Set();
  const result = [];

  for (const job of jobs) {
    // Internal listings are never considered duplicates of anything --
    // they're CareerSetu's own, authoritative postings.
    if (job.isInternal) {
      result.push(job);
      continue;
    }

    const compositeKey = `${job.title.toLowerCase().trim()}::${job.companyName.toLowerCase().trim()}::${(job.location || "").toLowerCase().trim()}`;
    const urlKey = canonicalizeUrl(job.applyUrl);

    const isDuplicate =
      (compositeKey !== "::" && seenCompositeKeys.has(compositeKey)) ||
      (urlKey && seenUrlKeys.has(urlKey));
    if (isDuplicate) continue;

    if (compositeKey !== "::") seenCompositeKeys.add(compositeKey);
    if (urlKey) seenUrlKeys.add(urlKey);
    result.push(job);
  }
  return result;
}

function matchesFilters(job, filters = {}) {
  if (filters.workMode && filters.workMode !== "any" && job.workMode && job.workMode !== filters.workMode) {
    return false;
  }
  if (filters.role) {
    const role = String(filters.role).toLowerCase();
    if (!job.title.toLowerCase().includes(role)) return false;
  }
  if (filters.location) {
    const loc = String(filters.location).toLowerCase();
    if (job.location && !job.location.toLowerCase().includes(loc) && job.workMode !== "remote") {
      return false;
    }
  }
  if (filters.source && filters.source !== "all") {
    // "internal" means CareerSetu's own listings; any other value must match
    // the job's own source exactly (e.g. "remotive" must exclude "adzuna"),
    // not just "is/isn't internal" -- that looser check previously let every
    // external job through regardless of which specific provider was asked for.
    if (filters.source === "internal") {
      if (!job.isInternal) return false;
    } else if (job.source !== filters.source) {
      return false;
    }
  }
  if (Array.isArray(filters.skills) && filters.skills.length) {
    const jobSkillSet = new Set((job.skillsRequired || []).map((s) => String(s).toLowerCase()));
    const hasAny = filters.skills.some((s) => jobSkillSet.has(String(s).toLowerCase()));
    if (!hasAny) return false;
  }
  if (filters.minSalary) {
    // Only excludes a listing that explicitly states a salary below the
    // threshold -- a listing with no salary info is never filtered out on
    // this basis, consistent with "missing data must not prove ineligibility".
    const jobSalary = job.salaryMax ?? job.salaryMin;
    if (jobSalary != null && jobSalary < filters.minSalary) return false;
  }
  if (filters.entryLevelOnly && looksSeniorListing(job)) {
    return false;
  }
  if (filters.category && filters.category !== "all") {
    if (classifyExperienceLevel(job) !== filters.category) return false;
  }
  return true;
}

/**
 * Fetches, scores, dedupes and ranks the unified job feed for one intern.
 * `filters` are applied as a best-effort pre-filter (never throws on an
 * unrecognized field); final relevance ordering always comes from the
 * fit-score engine, not the filters.
 */
async function getUnifiedJobFeed({ internProfile, preference, filters = {}, page = 1, limit = 20 } = {}) {
  const internshipQuery = { isDeleted: false, isActive: true };
  if (filters.workMode && filters.workMode !== "any") {
    internshipQuery.mode = filters.workMode;
  }

  const [internships, externalListings] = await Promise.all([
    Internship.find(internshipQuery).populate("company", "companyName").limit(500).lean(),
    ExternalJobListing.find({ isActive: true }).sort({ fetchedAt: -1 }).limit(500).lean()
  ]);

  let jobs = [
    ...internships.map(toInternalJobShape),
    ...externalListings.map(toExternalJobShape)
  ];

  jobs = dedupeAcrossSources(jobs);
  jobs = jobs.filter((job) => matchesFilters(job, filters));

  const scored = jobs.map((job) => {
    const fit = buildJobFitScore({ internProfile, preference, job });
    return { ...job, ...fit };
  });

  scored.sort((a, b) => {
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
    const aDate = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const bDate = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return bDate - aDate;
  });

  const total = scored.length;
  const start = (Math.max(1, page) - 1) * limit;
  const pageItems = scored.slice(start, start + limit);

  return { jobs: pageItems, total, page: Math.max(1, page), limit };
}

module.exports = { getUnifiedJobFeed, toInternalJobShape, toExternalJobShape, dedupeAcrossSources, canonicalizeUrl, matchesFilters };
