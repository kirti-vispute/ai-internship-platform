const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { normalizeSkillList } = require("../../../shared/utils/skill-normalizer");
const { computeSkillMatch } = require("../../../shared/utils/compute-skill-match");

/**
 * Explainable 0-100 job-fit scoring for the AI Job Agent.
 *
 * Reuses the existing, battle-tested computeSkillMatch() (also used for
 * internal internship recommendations) as the skills dimension, then adds
 * three more dimensions that internships-only matching never needed:
 * experience signal, basic eligibility (profile completeness), and the
 * candidate's own saved Job Agent preferences (role/location/work-mode/
 * salary). Weights for all five dimensions are configurable via
 * PLATFORM_CONFIG.jobAgent.matchWeights (env-overridable).
 *
 * Deliberately conservative: every dimension that can't be verified from
 * the data on hand degrades to a neutral score with an explicit, visible
 * "eligibility concern" string rather than silently scoring the candidate
 * down or claiming eligibility it can't support. Mandatory requirements
 * (required skills) are always kept separate from preferences in the
 * returned shape so the caller/UI never conflates the two.
 */

const SENIOR_KEYWORDS = /\b(senior|lead|staff|principal|architect|\d\+?\s*-?\s*\d*\+?\s*years?)\b/i;
const ENTRY_KEYWORDS = /\b(intern(ship)?|entry[\s-]?level|fresher|graduate|junior|trainee)\b/i;
const INTERNSHIP_KEYWORDS = /\b(intern(ship)?)\b/i;

// ---------------------------------------------------------------------
// Role relevance (fixes: a job in a completely unrelated profession, with
// no listed/extracted skills to fail against, was scoring ~80% purely
// because an empty skill list is vacuously "100% matched" -- see
// compute-skill-match.js's documented vacuous-truth rule, which is correct
// for genuine internal listings that simply didn't type out a skill list,
// but was never meant to paper over a fundamentally wrong profession).
//
// Each group below is a cluster of titles that mean essentially the same
// software/tech role -- used to recognize synonyms and adjacent roles a
// candidate's own saved "desired role" text wouldn't literally contain
// (e.g. desired "Full Stack Developer" should still read "Backend
// Developer" as adjacent, not unrelated).
// ---------------------------------------------------------------------
const SOFTWARE_ROLE_SYNONYM_GROUPS = [
  ["full stack developer", "full stack engineer", "fullstack developer", "fullstack engineer", "full-stack developer", "full-stack engineer"],
  ["software engineer", "software developer", "swe", "sde", "programmer", "application developer"],
  ["frontend developer", "front-end developer", "front end developer", "frontend engineer", "ui developer", "react developer", "angular developer", "vue developer"],
  ["backend developer", "back-end developer", "back end developer", "backend engineer", "api developer", "node developer", "node.js developer", "django developer", "java developer", "python developer"],
  ["web developer", "website developer"],
  ["mobile developer", "android developer", "ios developer", "app developer", "react native developer", "flutter developer"],
  ["devops engineer", "site reliability engineer", "sre", "cloud engineer", "platform engineer", "infrastructure engineer"],
  ["data engineer", "data scientist", "machine learning engineer", "ml engineer", "ai engineer", "nlp engineer"],
  ["qa engineer", "test engineer", "sdet", "quality assurance engineer", "automation engineer"],
  ["game developer", "unity developer", "unreal developer"],
  ["security engineer", "application security engineer", "cybersecurity engineer"]
];

// A generic "this reads as software/tech work" signal for titles that
// aren't a literal synonym-group hit (e.g. a company's own invented title)
// but clearly belong to the same domain. Deliberately does NOT match a
// bare "engineer" -- only compound forms that are unambiguously software
// (so "Sales Engineer"/"Mechanical Engineer" don't false-positive; see
// NON_SOFTWARE_ENGINEER_QUALIFIER below for the explicit exclusion too).
const SOFTWARE_DOMAIN_SIGNAL = /\b(software|developer|full[\s-]?stack|front[\s-]?end|back[\s-]?end|web\s*dev|app\s*dev|mobile\s*dev|devops|\bsde\b|\bsre\b|programmer|coder|data\s*scien|machine\s*learning|\bml\s*engineer\b)\b/i;
const NON_SOFTWARE_ENGINEER_QUALIFIER = /\b(sales|mechanical|civil|chemical|electrical|industrial|petroleum|structural|environmental|biomedical|aerospace|marine|mining|agricultural|field|process|manufacturing|hvac|automotive)\s+engineer/i;

// Curated, intentionally non-exhaustive list of professions clearly outside
// software/tech -- used only to positively flag a KNOWN unrelated
// profession (optician, sales, freelance writing, admin, etc., per the
// reported bug and spec examples), never to penalize a title this list
// simply doesn't recognize (that falls through to "unknown", not
// "unrelated" -- see classifyRoleRelevance).
const NON_SOFTWARE_PROFESSION_SIGNAL = /\b(optician|opticien(?:ne)?|optometrist|dentist|pharmacist|nurse|physician|surgeon|veterinarian|chef|cook|waiter|waitress|bartender|barista|driver|courier|delivery\s*(rider|driver)|sales\s*(?:\w+\s+){0,2}(representative|executive|associate|manager|agent|contractor)|\bsdr\b|account\s*executive|business\s*development\s*(executive|representative)|retail\s*(associate|sales|merchandiser)|merchandiser|cashier|receptionist|administrative\s*assistant|office\s*assistant|data\s*entry\s*clerk|hr\s*(executive|manager|generalist)|recruiter|talent\s*acquisition|marketing\s*(executive|manager|coordinator)|writer|copywriter|journalist|photographer|videographer|graphic\s*designer|interior\s*designer|fashion\s*designer|teacher|tutor|professor|lawyer|attorney|paralegal|accountant|auditor|bookkeeper|banker|insurance\s*agent|real\s*estate\s*agent|security\s*guard|electrician|plumber|carpenter|mechanic|warehouse\s*(associate|worker)|logistics\s*coordinator|customer\s*service\s*representative|call\s*center\s*agent|flight\s*attendant|translator|interpreter|fitness\s*trainer|personal\s*trainer|hairdresser|beautician|massage\s*therapist|handelsvertreter|vertriebsmitarbeiter|vertriebler|vertriebsrepr(?:ä|ae)sentant(?:in)?|verk(?:ä|ae)ufer(?:in)?)\b/i;

function roleTextIsSoftwareDomain(text) {
  return SOFTWARE_DOMAIN_SIGNAL.test(text) && !NON_SOFTWARE_ENGINEER_QUALIFIER.test(text);
}

/**
 * Classifies how relevant a job is to the candidate's saved desired
 * role(s). Only the software/tech taxonomy above is built out -- if the
 * candidate's own desired roles don't read as software/tech, this
 * classifier has nothing confident to say about other professions and
 * returns "not_applicable" (neutral) rather than inventing a verdict.
 * Deliberately returns a {tag, score, reason} triple instead of a bare
 * number so buildJobFitScore can both weight it AND hard-cap the overall
 * score for a clear "unrelated" verdict (see buildJobFitScore) -- a
 * weighted dimension alone can still be washed out by several vacuously
 * "100%" dimensions (missing skills, missing experience signal, etc.)
 * stacking on top of it, which is exactly the bug being fixed here.
 */
function classifyRoleRelevance(desiredRoles, job) {
  const roles = (desiredRoles || []).map((r) => String(r).toLowerCase().trim()).filter(Boolean);
  if (!roles.length) {
    return { tag: "no_preference", score: 100, reason: "" };
  }

  const desiredReadsAsSoftwareRole = roles.some(
    (r) => roleTextIsSoftwareDomain(r) || SOFTWARE_ROLE_SYNONYM_GROUPS.some((group) => group.some((syn) => r.includes(syn) || syn.includes(r)))
  );
  if (!desiredReadsAsSoftwareRole) {
    return { tag: "not_applicable", score: 100, reason: "" };
  }

  const title = String(job?.title || "").toLowerCase();
  const fullText = `${job?.title || ""} ${job?.description || ""}`.toLowerCase();

  const exactGroup = SOFTWARE_ROLE_SYNONYM_GROUPS.find(
    (group) => group.some((syn) => title.includes(syn)) && roles.some((r) => group.some((syn) => r.includes(syn) || syn.includes(r)))
  );
  if (exactGroup) {
    return { tag: "relevant", score: 100, reason: "" };
  }

  // A specific non-software profession signal in the title (e.g. a German
  // sales-rep title that happens to mention "Software" as the product it
  // sells) must win over the generic domain-word check below -- otherwise
  // any non-software title that merely contains the word "software"
  // short-circuits to "adjacent" before this more specific, more reliable
  // signal is ever consulted.
  if (NON_SOFTWARE_PROFESSION_SIGNAL.test(title) || NON_SOFTWARE_ENGINEER_QUALIFIER.test(title)) {
    return {
      tag: "unrelated",
      score: 5,
      reason: `This listing's title reads as a role outside software/tech, not your saved desired role(s) (${desiredRoles.join(", ")}).`
    };
  }
  if (roleTextIsSoftwareDomain(title)) {
    return { tag: "adjacent", score: 70, reason: "" };
  }

  // Title alone was ambiguous (e.g. a generic "Associate") -- fall back to
  // the full description, but ONLY to confirm a non-software profession,
  // never to promote to "adjacent"/relevant. A real-data sweep during
  // development found long descriptions for plainly non-software roles
  // (e.g. "Head of Operations") that mention "software" exactly once in
  // passing ("...the software, and our clients") -- promoting on a single
  // incidental word match misclassified them as a real software-adjacent
  // role. A specific non-software profession phrase (e.g. "sales
  // representative") appearing anywhere in the text is a much more
  // reliable signal than a single generic tech word, so that check stays.
  if (NON_SOFTWARE_PROFESSION_SIGNAL.test(fullText)) {
    return {
      tag: "unrelated",
      score: 10,
      reason: `This listing's description reads as a role outside software/tech, not your saved desired role(s) (${desiredRoles.join(", ")}).`
    };
  }

  // No positive software/tech signal AND no recognized non-software
  // profession either -- genuinely unknown, not a confirmed match. Scored
  // low rather than neutral: requirement 2 is explicit that missing
  // information must not be treated as positive evidence, and for a
  // ranking/recommendation signal specifically (unlike an eligibility
  // check, where an unknown must never count against the candidate), the
  // burden is on the listing to show relevance to the candidate's stated
  // role, not the other way around. A real-data sweep during development
  // caught dozens of plainly unrelated titles this classifier's curated
  // keyword list doesn't recognize (German-language titles, "Key Account
  // Manager", "CRM Manager", "Legal Counsel", etc.) scoring 82-88% while
  // tagged merely "unknown" at the old neutral default of 60 -- this low
  // score plus the second-tier cap in buildJobFitScore closes that gap
  // without requiring an ever-growing, never-complete blocklist.
  return {
    tag: "unknown",
    score: 35,
    reason: "Couldn't confidently tell whether this listing's role matches your saved desired role(s) from its title/description -- role relevance is unknown, not confirmed."
  };
}

// Non-exhaustive set of language-requirement phrasings this product has no
// data to check a candidate against (InternProfile records no language
// list) -- flagged as an informational concern only, never scored, per
// "unknown data must be labeled unknown, not assumed eligible/ineligible".
const LANGUAGE_REQUIREMENT_LANGUAGES = ["french", "german", "spanish", "italian", "portuguese", "dutch", "mandarin", "chinese", "japanese", "korean", "arabic", "russian"];

function detectLanguageRequirementConcern(job) {
  const text = `${job?.title || ""} ${job?.description || ""}`;
  for (const lang of LANGUAGE_REQUIREMENT_LANGUAGES) {
    const re = new RegExp(`\\b(fluent in|fluency in|native speaker of|must speak)\\s+${lang}\\b|\\b${lang}[\\s-]speaking\\b`, "i");
    if (re.test(text)) {
      const label = lang.charAt(0).toUpperCase() + lang.slice(1);
      return [`This listing appears to require ${label} language ability. Your profile doesn't record language skills, so this is unknown, not confirmed either way.`];
    }
  }
  return [];
}

function getInternSkills(internProfile) {
  const parsedSkills = internProfile?.resume?.parsed?.skills;
  const profileSkills = Array.isArray(internProfile?.skills)
    ? internProfile.skills.map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : [];
  const resumeSkills = Array.isArray(parsedSkills) ? parsedSkills : [];
  return normalizeSkillList([...profileSkills, ...resumeSkills]);
}

function scorePreferenceMatch(preference, job) {
  const concerns = [];
  const matched = {};
  const applicable = [];

  if (!preference) {
    return { score: 100, matched, concerns };
  }

  // Role relevance has its own dedicated dimension now (classifyRoleRelevance,
  // weighted + hard-capped separately in buildJobFitScore) -- scoring it here
  // too would double-count it and risk a second, less precise "role doesn't
  // match" concern contradicting the first.

  // Work mode
  if (preference.workMode && preference.workMode !== "any") {
    if (!job.workMode) {
      matched.workMode = null;
      applicable.push(0.5);
      concerns.push("This listing doesn't state a work mode (remote/hybrid/on-site), so it couldn't be checked against your preference.");
    } else {
      const ok = job.workMode === preference.workMode;
      matched.workMode = ok;
      applicable.push(ok ? 1 : 0);
      if (!ok) {
        concerns.push(`Work mode is "${job.workMode}", not your preferred "${preference.workMode}".`);
      }
    }
  }

  // Location (skip if the job is remote and candidate's work-mode preference allows remote)
  const locations = (preference.locations || []).map((l) => String(l).toLowerCase().trim()).filter(Boolean);
  const remoteSatisfiesLocation = job.workMode === "remote" && (preference.workMode === "remote" || preference.workMode === "any" || !preference.workMode);
  if (locations.length && !remoteSatisfiesLocation) {
    if (!job.location) {
      matched.location = null;
      applicable.push(0.5);
      concerns.push("This listing doesn't state a location, so it couldn't be checked against your preferred locations.");
    } else {
      const jobLocation = String(job.location).toLowerCase();
      const ok = locations.some((loc) => jobLocation.includes(loc));
      matched.location = ok;
      applicable.push(ok ? 1 : 0);
      if (!ok) {
        concerns.push(`Location "${job.location}" doesn't match your saved locations (${preference.locations.join(", ")}).`);
      }
    }
  }

  // Salary
  if (preference.minSalary) {
    const jobSalary = job.salaryMax ?? job.salaryMin;
    if (jobSalary == null) {
      matched.salary = null;
      applicable.push(0.5);
      concerns.push("This listing doesn't state a salary, so it couldn't be checked against your minimum.");
    } else {
      const ok = jobSalary >= preference.minSalary;
      matched.salary = ok;
      applicable.push(ok ? 1 : 0);
      if (!ok) {
        concerns.push(`Listed salary is below your saved minimum of ${preference.minSalary} ${preference.salaryCurrency || ""}.`.trim());
      }
    }
  }

  const score = applicable.length === 0 ? 100 : Math.round((applicable.reduce((a, b) => a + b, 0) / applicable.length) * 100);

  return { score, matched, concerns };
}

/**
 * Whether a job's title/description reads as targeting more experienced
 * candidates (senior/lead/X+ years) without also reading as entry-level
 * (internship/fresher/junior/etc, which usually wins when both appear, e.g.
 * "Junior Software Engineer (3+ years preferred)"). Exported so the feed's
 * optional "entry-level only" filter can reuse the exact same heuristic
 * the fit-score explanation already uses, instead of a second definition
 * that could silently drift out of sync with it.
 */
function looksSeniorListing(job) {
  const text = `${job?.title || ""} ${job?.description || ""}`;
  return SENIOR_KEYWORDS.test(text) && !ENTRY_KEYWORDS.test(text);
}

/**
 * Classifies a job into one category bucket for the dashboard's
 * fresher/internship/full-time filter (spec requirement 4). Prefers a
 * provider-stated signal over a keyword guess when one exists (The Muse's
 * `levels` facet, surfaced as job.jobType === "internship" by its
 * provider's own normalizer) -- a real "the provider told us so" beats an
 * inferred one, but never the other way around. Falls back to "unspecified"
 * rather than guessing when neither the stated jobType nor the title/
 * description text gives a confident signal, consistent with "missing
 * information must remain unknown instead of being invented".
 */
function classifyExperienceLevel(job) {
  const text = `${job?.title || ""} ${job?.description || ""}`;
  if (job?.jobType === "internship" || INTERNSHIP_KEYWORDS.test(text)) return "internship";
  if (looksSeniorListing(job)) return "mid_senior";
  if (ENTRY_KEYWORDS.test(text)) return "fresher_entry";
  if (job?.jobType === "full_time") return "unspecified_full_time";
  return "unspecified";
}

/**
 * Flags a soft eligibility concern when a listing reads as an internship
 * but the candidate's own profile suggests they've already graduated.
 * Deliberately a concern string, never a filter/exclusion -- a passing
 * year is a weak, self-reported signal (and some "fresher" internships are
 * explicitly open to recent graduates), so it informs the explanation
 * instead of silently hiding the listing or scoring it down.
 */
function scoreGraduationEligibility(internProfile, job, now = new Date()) {
  if (classifyExperienceLevel(job) !== "internship") return { concerns: [] };

  const passingYears = [
    ...(Array.isArray(internProfile?.educationDetails) ? internProfile.educationDetails : []).map((e) => e?.passingYear),
    ...(Array.isArray(internProfile?.profileSections?.education) ? internProfile.profileSections.education : []).map((e) => e?.endYear)
  ]
    .map((y) => parseInt(y, 10))
    .filter((y) => Number.isFinite(y));

  if (!passingYears.length) return { concerns: [] };

  const mostRecentPassingYear = Math.max(...passingYears);
  const currentYear = now.getFullYear();
  if (mostRecentPassingYear < currentYear) {
    return {
      concerns: [
        `This listing reads as an internship, and your profile's most recent graduation year (${mostRecentPassingYear}) has already passed -- some internships are open to recent graduates, but confirm eligibility with the employer before applying.`
      ]
    };
  }
  return { concerns: [] };
}

function scoreExperienceFit(internProfile, job) {
  const concerns = [];
  const looksSenior = looksSeniorListing(job);

  if (!looksSenior) {
    // Default assumption for a student/early-career platform: a listing
    // that doesn't explicitly signal a senior requirement is treated as
    // open to the candidate, consistent with missing data never being
    // used to prove ineligibility.
    return { score: 100, concerns };
  }

  const experienceEntries = [
    ...(Array.isArray(internProfile?.experience) ? internProfile.experience : []),
    ...(Array.isArray(internProfile?.profileSections?.experience) ? internProfile.profileSections.experience : [])
  ];

  if (experienceEntries.length === 0) {
    concerns.push("This listing's wording suggests it may target more experienced candidates, and your profile doesn't yet list any work experience.");
    return { score: 40, concerns };
  }

  return { score: 85, concerns };
}

function scoreEligibility(internProfile) {
  const concerns = [];
  const hasEducation = Array.isArray(internProfile?.education) && internProfile.education.length > 0;

  if (!hasEducation) {
    concerns.push("Your profile doesn't include education details yet, so degree/branch eligibility couldn't be checked for this listing.");
    return { score: 70, concerns };
  }

  return { score: 100, concerns };
}

function buildExplanation({ skillMatch, prefResult, roleResult, isExternal }) {
  const parts = [];

  // Role relevance is the dominant signal, so when it's a clear mismatch it
  // leads the explanation -- stating "doesn't specify required skills"
  // first (which reads as neutral-to-positive) immediately above a low
  // score would otherwise look contradictory.
  if (roleResult.tag === "unrelated") {
    parts.push(roleResult.reason);
  } else if (roleResult.tag === "adjacent") {
    parts.push("This listing's role looks related to, but not an exact match for, your saved desired role(s).");
  } else if (roleResult.tag === "unknown") {
    parts.push(roleResult.reason);
  }

  if (skillMatch.normalizedRequiredSkills.length === 0) {
    parts.push("This listing doesn't specify required skills, so the skill match couldn't be scored strictly.");
  } else if (skillMatch.missingRequiredSkills.length === 0) {
    parts.push(`Matches all ${skillMatch.normalizedRequiredSkills.length} required skills (${skillMatch.matchedRequiredSkills.join(", ")}).`);
  } else {
    parts.push(
      `Matches ${skillMatch.matchedRequiredSkills.length} of ${skillMatch.normalizedRequiredSkills.length} required skills (${skillMatch.matchedRequiredSkills.join(", ") || "none"}). Missing: ${skillMatch.missingRequiredSkills.join(", ")}.`
    );
  }

  const prefNotes = Object.entries(prefResult.matched)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  if (prefNotes.length) {
    parts.push(`Matches your saved ${prefNotes.join(", ")} preference${prefNotes.length > 1 ? "s" : ""}.`);
  }

  if (isExternal) {
    parts.push("Skills for this external listing were inferred from the posting text and are approximate, not independently verified.");
  }

  return parts.join(" ");
}

/**
 * Computes an explainable 0-100 fit score for one job against one
 * candidate. `job` must be normalized to { title, description, workMode,
 * location, salaryMin, salaryMax, skillsRequired, prioritySkills } --
 * ExternalJobListing docs map extractedSkills -> skillsRequired (see
 * job-feed.service.js), internal Internship docs already have this shape.
 *
 * `isExternal` controls only the explanation text (the approximate-skills
 * disclaimer); it never changes the arithmetic, so external and internal
 * listings are scored on a genuinely comparable scale.
 */
function buildJobFitScore({ internProfile, preference, job, isExternal = false }) {
  const internSkills = getInternSkills(internProfile);
  const skillMatch = computeSkillMatch(internSkills, job.skillsRequired || [], job.prioritySkills || []);
  const prefResult = scorePreferenceMatch(preference, job);
  const expResult = scoreExperienceFit(internProfile, job);
  const eligResult = scoreEligibility(internProfile);
  const gradResult = scoreGraduationEligibility(internProfile, job);
  const roleResult = classifyRoleRelevance(preference?.desiredRoles, job);
  const languageConcerns = detectLanguageRequirementConcern(job);
  const experienceLevelTag = classifyExperienceLevel(job);

  const weights = PLATFORM_CONFIG.jobAgent.matchWeights;
  const requiredScore = skillMatch.requiredMatchPercent;
  const preferredScore = skillMatch.preferredMatchPercent ?? requiredScore;

  const weighted =
    roleResult.score * weights.roleRelevance +
    requiredScore * weights.requiredSkills +
    preferredScore * weights.preferredSkills +
    expResult.score * weights.experience +
    eligResult.score * weights.eligibility +
    prefResult.score * weights.preferences;

  let fitScore = Math.max(0, Math.min(100, Math.round(weighted)));

  // Belt-and-suspenders guarantee for requirement 2: a weighted dimension
  // alone can still be washed out when every OTHER dimension lands at its
  // own vacuous/neutral "100" (no listed skills, no stated experience
  // requirement, no saved preferences to check) -- exactly the scenario
  // that let the reported optician listing reach 80%. A confirmed
  // "unrelated" role verdict hard-caps the overall score so it can never
  // read as a strong match, regardless of how every other dimension lands.
  if (roleResult.tag === "unrelated") {
    fitScore = Math.min(fitScore, 30);
  } else if (roleResult.tag === "unknown") {
    // Second-tier cap, deliberately looser than "unrelated"'s: genuine
    // ambiguity must score below a real (adjacent=70+) or confirmed
    // (relevant=100) match, but above a confirmed mismatch -- otherwise a
    // listing this classifier's keyword lists simply don't recognize could
    // still read as a strong match for the same reason the original bug
    // did (every other dimension vacuously "100").
    fitScore = Math.min(fitScore, 45);
  }

  const eligibilityConcerns = [
    ...eligResult.concerns,
    ...expResult.concerns,
    ...prefResult.concerns,
    ...gradResult.concerns,
    ...(roleResult.tag === "unknown" ? [roleResult.reason] : []),
    ...languageConcerns
  ];

  return {
    fitScore,
    experienceLevelTag,
    roleRelevance: { tag: roleResult.tag, score: roleResult.score },
    matchedRequiredSkills: skillMatch.matchedRequiredSkills,
    missingRequiredSkills: skillMatch.missingRequiredSkills,
    matchedPreferredSkills: skillMatch.matchedPreferredSkills,
    missingPreferredSkills: skillMatch.missingPreferredSkills,
    preferenceMatch: prefResult.matched,
    eligibilityConcerns,
    explanation: buildExplanation({ skillMatch, prefResult, roleResult, isExternal }),
    breakdown: {
      roleRelevanceScore: roleResult.score,
      requiredScore,
      preferredScore,
      experienceScore: expResult.score,
      eligibilityScore: eligResult.score,
      preferenceScore: prefResult.score,
      weights
    }
  };
}

module.exports = { buildJobFitScore, getInternSkills, looksSeniorListing, classifyExperienceLevel, classifyRoleRelevance };
