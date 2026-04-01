const path = require("path");

const ReportedCompany = require("../models/ReportedCompany");
const InternProfile = require("../models/InternProfile");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const CompanyProfile = require("../models/CompanyProfile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { getSkillGap, recommendInternships } = require("../services/ai.service");
const { computeResumeScore } = require("../services/scorer.service");
const { parseResumeFile } = require("../services/resume-parser.service");
const { structuredResumeParse } = require("../services/resume-structured-parser.service");
const { normalizeSkillList, toDisplaySkillList } = require("../utils/skill-normalizer");

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

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);
  res.json({ profile: toProfilePayload(profile) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  const allowed = ["fullName", "mobile", "skills", "education", "projects", "certifications", "experience", "achievements", "links", "summary", "interests", "completedCourses"];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "skills") {
        profile.skills = toDisplaySkillList(normalizeSkillList(req.body.skills));
      } else {
        profile[field] = req.body[field];
      }
    }
  });

  if (profile.resume?.text) {
    await refreshProfileScore(profile);
  }

  await profile.save();

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

  profile.resume.filePath = path.relative(path.join(__dirname, "../.."), req.file.path);
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

  await refreshProfileScore(profile, resumeText);
  await profile.save();

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

exports.getActiveInternships = asyncHandler(async (req, res) => {
  const internships = await Internship.find({ isActive: true })
    .populate("company")
    .sort({ createdAt: -1 });

  res.json({ internships });
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

  const internships = await Internship.find({ isActive: true }).populate("company");
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

  const profile = await getInternProfileByUserId(req.user._id);
  const internship = await Internship.findById(internshipId).populate("company");

  if (!internship || !internship.isActive) {
    throw new AppError("Internship not found or inactive", 404);
  }

  const company = await CompanyProfile.findById(internship.company);
  if (!company) {
    throw new AppError("Internship company not found", 404);
  }

  const existingApplication = await Application.findOne({ intern: profile._id, internship: internship._id });
  if (existingApplication) {
    throw new AppError("You have already applied to this internship", 409);
  }

  const internSkills = getParsedResumeSkills(profile);
  const analysis = getSkillGap(internSkills, internship.skillsRequired || []);

  const application = await Application.create({
    intern: profile._id,
    internship: internship._id,
    matchScore: analysis.matchPercent,
    stageHistory: [{ stage: "applied", note: "Application submitted" }]
  });

  res.status(201).json({ message: "Application submitted", application });
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  const applications = await Application.find({ intern: profile._id })
    .populate({
      path: "internship",
      populate: { path: "company" }
    })
    .sort({ createdAt: -1 });

  res.json({ applications });
});

exports.getMyFeedback = asyncHandler(async (req, res) => {
  const profile = await getInternProfileByUserId(req.user._id);

  const applications = await Application.find({ intern: profile._id })
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
  const { companyId, reason } = req.body;

  if (!companyId || !reason) {
    throw new AppError("companyId and reason are required", 400);
  }

  const report = await ReportedCompany.create({
    company: companyId,
    reason,
    reportedBy: req.user._id
  });

  res.status(201).json({ message: "Company reported", report });
});
