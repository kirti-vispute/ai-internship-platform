const InternProfile = require("../../../models/InternProfile");
const JobAgentPreference = require("../models/JobAgentPreference");
const JobAgentApplication = require("../models/JobAgentApplication");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const AppError = require("../../../shared/utils/AppError");
const { sendSuccess, sendPaginated } = require("../../../shared/utils/api-response");
const { resolvePagination } = require("../../../shared/utils/pagination");
const { getUnifiedJobFeed } = require("../services/job-feed.service");
const { generateApplicationMaterials } = require("../services/application-assistant.service");
const { getInternSkills } = require("../services/job-matching.service");
const { computeSkillMatch } = require("../../../shared/utils/compute-skill-match");
const { JOB_AGENT_STATUS } = require("../models/JobAgentApplication");
const { WORK_MODES, EXPERIENCE_LEVELS } = require("../models/JobAgentPreference");
const JobProviderHealth = require("../models/JobProviderHealth");
const { sanitizeHttpUrl } = require("../../../shared/utils/url-validator");

// Providers with no legitimate self-serve public API today (see each
// provider file's own doc comment for the investigation). Surfaced here so
// the dashboard can report them honestly as "requires partnership", not
// just silently omit them -- matches PLATFORM_CONFIG.jobAgent.providers'
// own naukri/linkedin/indeed/wellfound entries.
const NO_PUBLIC_API_SOURCES = ["naukri", "linkedin", "indeed", "wellfound"];

const NOTIFICATION_FREQUENCIES = ["realtime", "daily", "weekly"];

async function requireInternProfile(userId) {
  const profile = await InternProfile.findOne({ user: userId });
  if (!profile) {
    throw new AppError(
      "Complete your CareerSetu profile before using the AI Job Agent.",
      400,
      null,
      { code: "PROFILE_REQUIRED" }
    );
  }
  return profile;
}

function computeProfileCompleteness(profile) {
  const checks = [
    { key: "resume", label: "Upload a resume", ok: Boolean(profile?.resume?.filePath || profile?.resume?.text) },
    { key: "skills", label: "Add your skills", ok: Boolean((profile?.skills || []).length || (profile?.resume?.parsed?.skills || []).length) },
    {
      key: "education",
      label: "Add your education",
      ok: Boolean((profile?.education || []).length || (profile?.profileSections?.education || []).length)
    },
    { key: "contact", label: "Add contact details", ok: Boolean(profile?.email && profile?.mobile) }
  ];
  const completedCount = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((completedCount / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label)
  };
}

const getPreferences = asyncHandler(async (req, res) => {
  const preference = await JobAgentPreference.findOne({ user: req.user._id }).lean();
  if (!preference) {
    return sendSuccess(res, {
      message: "Job Agent has not been configured yet.",
      data: { preference: null, configured: false }
    });
  }
  return sendSuccess(res, { data: { preference, configured: true } });
});

const upsertPreferences = asyncHandler(async (req, res) => {
  const profile = await requireInternProfile(req.user._id);

  const {
    desiredRoles,
    locations,
    workMode,
    minSalary,
    salaryCurrency,
    experienceLevel,
    notificationFrequency,
    enabled
  } = req.body || {};

  if (workMode !== undefined && !WORK_MODES.includes(workMode)) {
    throw new AppError(`workMode must be one of: ${WORK_MODES.join(", ")}`, 400, null, { code: "INVALID_WORK_MODE" });
  }
  if (experienceLevel !== undefined && !EXPERIENCE_LEVELS.includes(experienceLevel)) {
    throw new AppError(`experienceLevel must be one of: ${EXPERIENCE_LEVELS.join(", ")}`, 400, null, { code: "INVALID_EXPERIENCE_LEVEL" });
  }
  if (notificationFrequency !== undefined && !NOTIFICATION_FREQUENCIES.includes(notificationFrequency)) {
    throw new AppError(`notificationFrequency must be one of: ${NOTIFICATION_FREQUENCIES.join(", ")}`, 400, null, { code: "INVALID_NOTIFICATION_FREQUENCY" });
  }
  if (minSalary !== undefined && minSalary !== null && (typeof minSalary !== "number" || minSalary < 0)) {
    throw new AppError("minSalary must be a non-negative number", 400, null, { code: "INVALID_MIN_SALARY" });
  }

  const update = { internProfile: profile._id };
  if (desiredRoles !== undefined) {
    update.desiredRoles = Array.isArray(desiredRoles)
      ? desiredRoles.slice(0, 50).map((r) => String(r).trim().slice(0, 100)).filter(Boolean)
      : [];
  }
  if (locations !== undefined) {
    update.locations = Array.isArray(locations)
      ? locations.slice(0, 50).map((l) => String(l).trim().slice(0, 100)).filter(Boolean)
      : [];
  }
  if (workMode !== undefined) update.workMode = workMode;
  if (minSalary !== undefined) update.minSalary = minSalary;
  if (salaryCurrency !== undefined) update.salaryCurrency = String(salaryCurrency || "").slice(0, 10);
  if (experienceLevel !== undefined) update.experienceLevel = experienceLevel;
  if (notificationFrequency !== undefined) update.notificationFrequency = notificationFrequency;
  if (enabled !== undefined) update.enabled = Boolean(enabled);

  const preference = await JobAgentPreference.findOneAndUpdate(
    { user: req.user._id },
    { $set: update, $setOnInsert: { user: req.user._id } },
    { upsert: true, new: true, runValidators: true }
  );

  return sendSuccess(res, { message: "Job Agent preferences saved.", data: { preference } });
});

const pauseAgent = asyncHandler(async (req, res) => {
  const preference = await JobAgentPreference.findOneAndUpdate(
    { user: req.user._id },
    { $set: { enabled: false, pausedAt: new Date(), pausedReason: String(req.body?.reason || "").slice(0, 500) } },
    { new: true }
  );
  if (!preference) {
    throw new AppError("Job Agent has not been configured yet.", 400, null, { code: "PROFILE_REQUIRED" });
  }
  return sendSuccess(res, { message: "Job Agent paused.", data: { preference } });
});

const resumeAgent = asyncHandler(async (req, res) => {
  const preference = await JobAgentPreference.findOneAndUpdate(
    { user: req.user._id },
    { $set: { enabled: true, pausedAt: null, pausedReason: "" } },
    { new: true }
  );
  if (!preference) {
    throw new AppError("Set up your Job Agent preferences before enabling it.", 400, null, { code: "PROFILE_REQUIRED" });
  }
  return sendSuccess(res, { message: "Job Agent enabled.", data: { preference } });
});

const getStatus = asyncHandler(async (req, res) => {
  const [profile, preference, trackedCount] = await Promise.all([
    InternProfile.findOne({ user: req.user._id }).lean(),
    JobAgentPreference.findOne({ user: req.user._id }).lean(),
    JobAgentApplication.countDocuments({ user: req.user._id })
  ]);

  const completeness = computeProfileCompleteness(profile);

  return sendSuccess(res, {
    data: {
      configured: Boolean(preference),
      enabled: Boolean(preference?.enabled),
      pausedAt: preference?.pausedAt || null,
      lastSweepAt: preference?.lastSweepAt || null,
      lastSweepMatchCount: preference?.lastSweepMatchCount || 0,
      profileCompleteness: completeness,
      trackedApplicationCount: trackedCount
    }
  });
});

const getFeed = asyncHandler(async (req, res) => {
  const profile = await requireInternProfile(req.user._id);
  const preference = await JobAgentPreference.findOne({ user: req.user._id }).lean();
  const { page, limit } = resolvePagination(req.query, { defaultLimit: 20, maxLimit: 50 });

  const parsedMinSalary = req.query.minSalary !== undefined ? Number(req.query.minSalary) : undefined;
  if (parsedMinSalary !== undefined && (!Number.isFinite(parsedMinSalary) || parsedMinSalary < 0)) {
    throw new AppError("minSalary must be a non-negative number", 400, null, { code: "INVALID_MIN_SALARY" });
  }

  const filters = {
    role: req.query.role,
    workMode: req.query.workMode,
    location: req.query.location,
    source: req.query.source,
    // Fresher/internship/full-time category filter (spec requirement 4),
    // matched against the same classifyExperienceLevel() tag returned on
    // every job -- "internship" | "fresher_entry" | "mid_senior" |
    // "unspecified_full_time" | "unspecified".
    category: req.query.category,
    skills: typeof req.query.skills === "string" ? req.query.skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    minSalary: parsedMinSalary,
    entryLevelOnly: req.query.entryLevelOnly === "true"
  };

  const { jobs, total } = await getUnifiedJobFeed({ internProfile: profile, preference, filters, page, limit });

  return sendPaginated(res, { items: jobs, itemsKey: "jobs", page, limit, total });
});

/**
 * Source attribution + provider health for the dashboard's "source filters
 * / provider health / last-successful-sync" panel (spec requirement 4/5).
 * Merges the live JobProviderHealth collection (updated by every discovery
 * sweep) with the static list of sources that have no legitimate public
 * API today, so the dashboard can render an honest status for every named
 * source instead of only the ones that happen to have a health record yet.
 */
const getProviderHealth = asyncHandler(async (req, res) => {
  const records = await JobProviderHealth.find({}).lean();
  const bySource = new Map(records.map((r) => [r.source, r]));

  for (const source of NO_PUBLIC_API_SOURCES) {
    if (!bySource.has(source)) {
      bySource.set(source, { source, status: "no_legitimate_api", reason: "no_legitimate_public_api", jobsFetched: 0, lastRunAt: null, lastSuccessAt: null });
    }
  }

  return sendSuccess(res, { data: { providers: Array.from(bySource.values()) } });
});

const listApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = resolvePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const query = { user: req.user._id };
  if (req.query.status) {
    if (!JOB_AGENT_STATUS.includes(req.query.status)) {
      throw new AppError(`status must be one of: ${JOB_AGENT_STATUS.join(", ")}`, 400, null, { code: "INVALID_STATUS" });
    }
    query.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    JobAgentApplication.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    JobAgentApplication.countDocuments(query)
  ]);

  return sendPaginated(res, { items, itemsKey: "applications", page, limit, total });
});

const trackJob = asyncHandler(async (req, res) => {
  const profile = await requireInternProfile(req.user._id);
  const { jobSource, jobRef, internshipId, externalJobId, snapshot, fitScore, status } = req.body || {};

  // jobSource/jobRef feed directly into a Mongo query filter below (the
  // dedup lookup) as well as document creation, so they must be plain,
  // non-empty strings -- rejecting objects here closes off any chance of a
  // Mongo query-operator payload (e.g. { "$ne": null }) reaching findOne(),
  // even though the user-scoped filter already confines any such query to
  // the caller's own documents.
  if (typeof jobSource !== "string" || !jobSource.trim() || typeof jobRef !== "string" || !jobRef.trim()) {
    throw new AppError("jobSource and jobRef are required and must be strings.", 400, null, { code: "MISSING_JOB_REF" });
  }
  if (status !== undefined && !JOB_AGENT_STATUS.includes(status)) {
    throw new AppError(`status must be one of: ${JOB_AGENT_STATUS.join(", ")}`, 400, null, { code: "INVALID_STATUS" });
  }

  const existing = await JobAgentApplication.findOne({ user: req.user._id, jobSource, jobRef });
  if (existing) {
    return sendSuccess(res, { message: "This job is already tracked.", data: { application: existing } });
  }

  const cleanSnapshot = snapshot && typeof snapshot === "object" ? { ...snapshot } : {};
  if (cleanSnapshot.applyUrl) {
    cleanSnapshot.applyUrl = sanitizeHttpUrl(cleanSnapshot.applyUrl);
  }

  const application = await JobAgentApplication.create({
    user: req.user._id,
    internProfile: profile._id,
    jobSource,
    jobRef,
    internshipId: internshipId || null,
    externalJobId: externalJobId || null,
    snapshot: cleanSnapshot,
    fitScore: typeof fitScore === "number" ? fitScore : null,
    status: status || "saved"
  });

  return sendSuccess(res, { statusCode: 201, message: "Job saved to your tracker.", data: { application } });
});

async function findOwnedApplication(req) {
  const application = await JobAgentApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) {
    throw new AppError("Tracked application not found.", 404, null, { code: "APPLICATION_NOT_FOUND" });
  }
  return application;
}

const updateApplication = asyncHandler(async (req, res) => {
  const application = await findOwnedApplication(req);
  const { status, notes } = req.body || {};

  if (status !== undefined) {
    if (!JOB_AGENT_STATUS.includes(status)) {
      throw new AppError(`status must be one of: ${JOB_AGENT_STATUS.join(", ")}`, 400, null, { code: "INVALID_STATUS" });
    }
    application.status = status;
  }
  if (notes !== undefined) {
    application.notes = String(notes).slice(0, 2000);
  }

  await application.save();
  return sendSuccess(res, { message: "Application updated.", data: { application } });
});

const deleteApplication = asyncHandler(async (req, res) => {
  const application = await findOwnedApplication(req);
  await application.deleteOne();
  return sendSuccess(res, { message: "Removed from your tracker." });
});

const generateMaterials = asyncHandler(async (req, res) => {
  const profile = await requireInternProfile(req.user._id);
  const application = await findOwnedApplication(req);

  const job = {
    title: application.snapshot?.title || "",
    companyName: application.snapshot?.companyName || "",
    skillsRequired: application.snapshot?.skillsRequired || [],
    prioritySkills: application.snapshot?.prioritySkills || []
  };

  // Real skill overlap between the candidate and THIS job, not a hardcoded
  // empty array -- without this, the cover letter's "my experience with
  // ___ lines up with this role" sentence fell back to an arbitrary first-3
  // of the candidate's whole skill list instead of the skills this specific
  // job actually asked for.
  const skillMatch = computeSkillMatch(getInternSkills(profile), job.skillsRequired, job.prioritySkills);

  const materials = await generateApplicationMaterials({
    internProfile: profile,
    job,
    fit: { matchedRequiredSkills: skillMatch.matchedRequiredSkills },
    userId: req.user._id
  });

  application.tailoredResume = materials.tailoredResume;
  application.coverLetter = materials.coverLetter;
  await application.save();

  return sendSuccess(res, { message: "Application materials generated. Review and edit before using them.", data: { application } });
});

const updateMaterials = asyncHandler(async (req, res) => {
  const application = await findOwnedApplication(req);
  const { tailoredResumeContent, coverLetterContent } = req.body || {};

  if (typeof tailoredResumeContent === "string") {
    application.tailoredResume = {
      content: tailoredResumeContent.slice(0, 50000),
      source: "user-edited",
      generatedAt: application.tailoredResume?.generatedAt || new Date()
    };
  }
  if (typeof coverLetterContent === "string") {
    application.coverLetter = {
      content: coverLetterContent.slice(0, 50000),
      source: "user-edited",
      generatedAt: application.coverLetter?.generatedAt || new Date()
    };
  }

  await application.save();
  return sendSuccess(res, { message: "Saved your edits.", data: { application } });
});

module.exports = {
  getPreferences,
  upsertPreferences,
  pauseAgent,
  resumeAgent,
  getStatus,
  getFeed,
  getProviderHealth,
  listApplications,
  trackJob,
  updateApplication,
  deleteApplication,
  generateMaterials,
  updateMaterials
};
