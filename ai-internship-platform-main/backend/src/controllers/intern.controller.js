const path = require("path");

const ReportedCompany = require("../models/ReportedCompany");
const InternProfile = require("../models/InternProfile");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const CompanyProfile = require("../models/CompanyProfile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { getSkillGap, recommendInternships } = require("../services/ai.service");
const { computeApplicationRelevance } = require("../services/application-relevance.service");
const { computeResumeScore } = require("../services/scorer.service");
const { parseResumeFile } = require("../services/resume-parser.service");
const { structuredResumeParse } = require("../services/resume-structured-parser.service");
const { normalizeSkillList, toDisplaySkillList } = require("../utils/skill-normalizer");
const { logActivity } = require("../services/activity-log.service");
const { sendNotificationEmail } = require("../services/notification.service");
const { buildRoadmap } = require("../services/roadmap.service");

function toProfilePayload(profileDoc) {
  const profile = profileDoc.toObject ? profileDoc.toObject() : profileDoc;
  const resumeUploaded = Boolean(profile?.resume?.filePath || profile?.resume?.text);
  return { ...profile, resumeUploaded };
}

async function getInternProfileByUserId(userId) {
  const profile = await InternProfile.findOne({ user: userId });
  if (!profile) {
    throw new AppError("Intern profile not found", 404);
  }
  return profile;
}

async function refreshProfileScore(profile, resumeTextOverride = "") {
  const result = await computeResumeScore({
    profile,
    resumeText: resumeTextOverride || profile.resume?.text || ""
  });

  profile.resume.score = result.resumeScore;
  profile.resume.scoreSource = result.scoreSource;
  profile.resume.predictedCategory = result.predictedCategory || "";
  profile.resume.confidence = typeof result.confidence === "number" ? result.confidence : null;
  profile.resume.analysis = result.analysis || null;
}

function getParsedResumeSkills(profile) {
  const parsedSkills = profile?.resume?.parsed?.skills;
  return normalizeSkillList(Array.isArray(parsedSkills) ? parsedSkills : []);
}

function normalizeResumePublicPath(filePath = "") {
  const normalized = String(filePath || "").replace(/\\/g, "/").trim();
  if (!normalized) return "";

  const uploadsIdx = normalized.indexOf("/uploads/");
  if (uploadsIdx >= 0) return normalized.slice(uploadsIdx + 1);
  if (normalized.startsWith("uploads/")) return normalized;
  if (normalized.includes("uploads/")) return normalized.slice(normalized.indexOf("uploads/"));
  return normalized;
}

function isValidLinkedInUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(String(url).startsWith("http") ? String(url) : `https://${String(url)}`);
    return parsed.hostname.includes("linkedin.com");
  } catch {
    return false;
  }
}

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);
  res.json({ profile: toProfilePayload(profile) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  const allowed = [
    "fullName",
    "mobile",
    "skills",
    "education",
    "projects",
    "certifications",
    "experience",
    "achievements",
    "links",
    "summary",
    "interests",
    "completedCourses",
    "linkedinUrl",
    "profileSections"
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "skills") {
        profile.skills = toDisplaySkillList(normalizeSkillList(req.body.skills));
      } else if (field === "linkedinUrl") {
        if (!isValidLinkedInUrl(req.body.linkedinUrl)) {
          throw new AppError("linkedinUrl must be a valid LinkedIn URL", 400);
        }
        profile.linkedinUrl = String(req.body.linkedinUrl || "").trim();
      } else if (field === "profileSections" && req.body.profileSections && typeof req.body.profileSections === "object") {
        profile.profileSections = { ...(profile.profileSections || {}), ...req.body.profileSections };
      } else {
        profile[field] = req.body[field];
      }
    }
  });

  if (profile.linkedinUrl) {
    const links = new Set(profile.links || []);
    links.add(profile.linkedinUrl);
    profile.links = Array.from(links);
  }

  if (profile.resume?.text) {
    await refreshProfileScore(profile);
  }

  await profile.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "intern_profile",
    entityId: profile._id,
    action: "profile_updated",
    metadata: { fields: Object.keys(req.body || {}) },
    ipAddress: req.ip
  });

  res.json({ message: "Profile updated", profile: toProfilePayload(profile) });
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Resume file is required", 400);
  }

  const profile = await getInternProfileByUserId(req.user._id);

  let resumeText = await parseResumeFile(req.file);
  if (!resumeText) {
    throw new AppError("Could not extract text from resume. Please upload a clear PDF/DOCX/TXT file.", 400);
  }

  const parsed = structuredResumeParse(resumeText);

  profile.resume.filePath = normalizeResumePublicPath(path.relative(path.join(__dirname, "../.."), req.file.path));
  profile.resume.text = resumeText;
  profile.resume.parsed = parsed;
  profile.skills = toDisplaySkillList(
    normalizeSkillList([...(profile.skills || []), ...(parsed.skills || [])])
  );
  profile.education = [...new Set([...(profile.education || []), ...((parsed.education || []).map((item) => item.raw || "").filter(Boolean))])];
  profile.projects = [...new Set([...(profile.projects || []), ...((parsed.projects || []).map((item) => item.title || item.description || "").filter(Boolean))])];
  profile.certifications = [...new Set([...(profile.certifications || []), ...((parsed.certifications || []).map((item) => item.name || item.raw || "").filter(Boolean))])];
  profile.experience = [...new Set([...(profile.experience || []), ...((parsed.experience || []).map((item) => item.description || item.role || "").filter(Boolean))])];
  profile.achievements = [...new Set([...(profile.achievements || []), ...(parsed.achievements || [])])];
  profile.links = [...new Set([...(profile.links || []), ...(parsed.links || [])])];
  if (!profile.summary && parsed.summary) {
    profile.summary = parsed.summary;
  }
  if (!profile.linkedinUrl) {
    const linkedIn = (parsed.links || []).find((link) => String(link).toLowerCase().includes("linkedin.com"));
    if (linkedIn) profile.linkedinUrl = linkedIn;
  }

  await refreshProfileScore(profile, resumeText);
  await profile.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "intern_profile",
    entityId: profile._id,
    action: "resume_uploaded",
    metadata: { filePath: profile.resume.filePath },
    ipAddress: req.ip
  });

  res.json({
    message: "Resume uploaded and parsed",
    resumeUploaded: true,
    profile: toProfilePayload(profile),
    parsed
  });
});

exports.getResumeScore = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  await refreshProfileScore(profile);
  await profile.save();

  res.json({
    score: profile.resume.score,
    scoreSource: profile.resume.scoreSource,
    predictedCategory: profile.resume.predictedCategory,
    confidence: profile.resume.confidence,
    analysis: profile.resume.analysis
  });
});

exports.getSkillGap = asyncHandler(async (req, res) => {
  const { internshipId } = req.body;
  if (!internshipId) {
    throw new AppError("internshipId is required", 400);
  }

  const profile = await getInternProfileByUserId(req.user._id);
  const internship = await Internship.findById(internshipId);
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const internSkills = getParsedResumeSkills(profile);
  const analysis = getSkillGap(internSkills, internship.skillsRequired || []);
  res.json({ internshipId, analysis });
});

exports.getCareerRoadmap = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);
  const targetRole = String(req.body?.targetRole || "full_stack_developer");
  const roadmap = buildRoadmap({
    targetRole,
    currentSkills: profile?.resume?.parsed?.skills || profile?.skills || []
  });
  res.json({ roadmap });
});

exports.getActiveInternships = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const query = { isActive: true, isDeleted: false };
  const [internships, total] = await Promise.all([
    Internship.find(query)
    .populate("company")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit),
    Internship.countDocuments(query)
  ]);

  res.json({ internships, page, limit, total });
});

exports.getRecommendations = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  if (profile.resume?.text) {
    await refreshProfileScore(profile);
    await profile.save();
  }

  const parsedSkills = getParsedResumeSkills(profile);
  if (parsedSkills.length === 0) {
    return res.json({
      recommendations: [],
      reason: "missing_resume_skills",
      message: "Upload your resume to get accurate AI internship recommendations."
    });
  }

  const internships = await Internship.find({ isActive: true, isDeleted: false }).populate("company");
  const ranked = recommendInternships(profile, internships, { internSkills: parsedSkills });

  res.json({
    source: "parsed_resume_skills",
    recommendations: ranked.map((item) => ({
      internship: item.internship,
      requiredSkillMatchPercent: item.requiredSkillMatchPercent,
      preferredSkillMatchPercent: item.preferredSkillMatchPercent,
      overallRecommendationScore: item.overallRecommendationScore,
      recommendationScore: item.recommendationScore,
      skillMatchPercent: item.skillMatchPercent,
      matchedRequiredSkills: item.matchedRequiredSkills,
      missingRequiredSkills: item.missingRequiredSkills,
      matchedPreferredSkills: item.matchedPreferredSkills,
      missingPreferredSkills: item.missingPreferredSkills,
      skillGap: item.skillGap
    }))
  });
});

exports.applyToInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const { availabilityStatus, joiningDate } = req.body || {};

  const profile = await getInternProfileByUserId(req.user._id);
  const internship = await Internship.findById(internshipId).populate("company");

  if (!internship || !internship.isActive) {
    throw new AppError("Internship not found or inactive", 404);
  }

  const company = await CompanyProfile.findById(internship.company);
  if (!company) {
    throw new AppError("Internship company not found", 404);
  }

  const existingApplication = await Application.findOne({ internId: profile._id, internshipId: internship._id });
  if (existingApplication) {
    throw new AppError("You have already applied to this internship", 409);
  }

  const resumePath = normalizeResumePublicPath(profile?.resume?.filePath || "");
  if (!resumePath) {
    throw new AppError("Please upload your resume in profile before applying.", 400);
  }

  if (!["yes", "no"].includes(String(availabilityStatus || "").toLowerCase())) {
    throw new AppError("availabilityStatus must be either 'yes' or 'no'", 400);
  }

  const normalizedAvailability = String(availabilityStatus).toLowerCase();
  let parsedJoiningDate = null;
  if (normalizedAvailability === "no") {
    if (!joiningDate) {
      throw new AppError("When can you join? is required when availability is No", 400);
    }
    parsedJoiningDate = new Date(joiningDate);
    if (Number.isNaN(parsedJoiningDate.getTime())) {
      throw new AppError("Invalid joining date", 400);
    }
  }

  const relevance = computeApplicationRelevance(profile, internship);

  if (process.env.RECOMMENDATION_DEBUG === "true") {
    // eslint-disable-next-line no-console
    console.log("[application-relevance-debug]", JSON.stringify({
      internshipId: internship._id,
      internId: profile._id,
      normalizedInternSkills: relevance.debug.normalizedInternSkills,
      normalizedRequiredSkills: relevance.debug.normalizedRequiredSkills,
      matchedRequiredSkills: relevance.matchedRequiredSkills,
      missingRequiredSkills: relevance.missingRequiredSkills,
      requiredSkillMatchPercent: relevance.requiredSkillMatchPercent,
      relevanceScore: relevance.relevanceScore
    }));
  }

  let application;
  try {
    application = await Application.create({
      internId: profile._id,
      internshipId: internship._id,
      companyId: company._id,
      intern: profile._id,
      internship: internship._id,
      company: company._id,
      status: "applied",
      appliedAt: new Date(),
      attachedResumePath: resumePath,
      assignedRecruiter: internship.assignedRecruiter || null,
      availabilityStatus: normalizedAvailability,
      joiningDate: parsedJoiningDate,
      relevanceScore: relevance.relevanceScore,
      matchScore: relevance.relevanceScore,
      relevanceBreakdown: {
        requiredSkillMatchPercent: relevance.requiredSkillMatchPercent,
        preferredSkillMatchPercent: relevance.preferredSkillMatchPercent,
        overallSkillScore: relevance.overallSkillScore,
        matchedRequiredSkills: relevance.matchedRequiredSkills,
        missingRequiredSkills: relevance.missingRequiredSkills,
        weightedComponents: relevance.weightedComponents
      },
      stageHistory: [{ stage: "applied", note: "Application submitted" }]
    });
  } catch (error) {
    if (error && error.code === 11000) {
      throw new AppError("You have already applied to this internship", 409);
    }
    throw error;
  }

  res.status(201).json({
    message: "Application submitted",
    application,
    relevance: {
      relevanceScore: relevance.relevanceScore,
      requiredSkillMatchPercent: relevance.requiredSkillMatchPercent,
      preferredSkillMatchPercent: relevance.preferredSkillMatchPercent,
      missingRequiredSkills: relevance.missingRequiredSkills
    }
  });
  sendNotificationEmail({
    to: profile.email,
    subject: "Application Submitted",
    text: `You have successfully applied for ${internship.role}.`,
    type: "application_submitted"
  });
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const query = { $or: [{ internId: profile._id }, { intern: profile._id }] };
  const applications = await Application.find(query)
    .populate({
      path: "internship",
      populate: { path: "company" }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  await Promise.all(
    applications.map(async (application) => {
      const relevance = computeApplicationRelevance(profile || {}, application.internship || {});
      const nextScore = relevance.relevanceScore;
      if ((application.relevanceScore ?? application.matchScore ?? -1) !== nextScore) {
        application.relevanceScore = nextScore;
        application.matchScore = nextScore;
        await application.save();
      }
    })
  );

  const total = await Application.countDocuments(query);
  res.json({ applications, page, limit, total });
});

exports.getSavedInternships = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);
  await profile.populate({
    path: "savedInternships",
    match: { isActive: true },
    populate: { path: "company" }
  });
  res.json({ internships: profile.savedInternships || [] });
});

exports.saveInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const profile = await getInternProfileByUserId(req.user._id);
  const internship = await Internship.findOne({ _id: internshipId, isActive: true });
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const existing = (profile.savedInternships || []).some((item) => String(item) === String(internshipId));
  if (existing) {
    return res.json({ message: "Internship already saved" });
  }

  profile.savedInternships = [...(profile.savedInternships || []), internship._id];
  await profile.save();
  res.status(201).json({ message: "Internship saved" });
});

exports.unsaveInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const profile = await getInternProfileByUserId(req.user._id);
  profile.savedInternships = (profile.savedInternships || []).filter((item) => String(item) !== String(internshipId));
  await profile.save();
  res.json({ message: "Internship removed from saved list" });
});

exports.getMyFeedback = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  const applications = await Application.find({ $or: [{ internId: profile._id }, { intern: profile._id }] })
    .populate("internship")
    .select("internship hrFeedback status updatedAt");

  const feedback = applications
    .filter((item) => (item.hrFeedback || []).length > 0)
    .map((item) => ({
      internship: item.internship,
      status: item.status,
      feedback: item.hrFeedback
    }));

  res.json({ feedback });
});

exports.reportCompany = asyncHandler(async (req, res) => {
  const { companyId, reason, details = "", reportType = "other", evidenceUrls = [], internshipId = null, hrUserId = null } = req.body || {};

  if (!companyId || !reason) {
    throw new AppError("companyId and reason are required", 400);
  }

  const report = await ReportedCompany.create({
    company: companyId,
    reason,
    details,
    reportType,
    evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls.filter(Boolean) : [],
    internship: internshipId,
    hrUser: hrUserId,
    reportedBy: req.user._id
  });

  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "company_report",
    entityId: report._id,
    action: "report_created",
    metadata: { companyId },
    ipAddress: req.ip
  });

  res.status(201).json({ message: "Company reported", report });
});
