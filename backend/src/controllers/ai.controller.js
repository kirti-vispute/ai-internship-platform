const InternProfile = require("../models/InternProfile");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { normalizeSkillList } = require("../utils/skill-normalizer");
const { buildRoadmap } = require("../services/roadmap.service");
const aiGateway = require("../services/ai-gateway.service");
const { recordAnalyticsEvent } = require("../infrastructure/db/postgres.client");

function getParsedResumeSkills(profile) {
  const parsedSkills = profile?.resume?.parsed?.skills;
  return normalizeSkillList(Array.isArray(parsedSkills) ? parsedSkills : []);
}

async function trackAiEvent(req, eventName, payload = {}) {
  try {
    await recordAnalyticsEvent({
      eventName,
      userId: req.user?._id ? String(req.user._id) : null,
      role: req.user?.role || null,
      payload
    });
  } catch {
    // Analytics must never block primary AI flows.
  }
}

exports.parseResume = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    throw new AppError("text is required", 400);
  }

  const userId = req.user?._id ? String(req.user._id) : req.ip;
  const result = await aiGateway.parseResumeEnhanced({ text, userId });
  await trackAiEvent(req, "ai.parse_resume", { cacheHit: result.meta?.cacheHit });
  res.json({ parsed: result.parsed, meta: result.meta });
});

exports.computeResumeScore = asyncHandler(async (req, res) => {
  const { internId } = req.body;
  let profile;

  if (internId) {
    profile = await InternProfile.findById(internId);
  } else if (req.user?.role === "intern") {
    profile = await InternProfile.findOne({ user: req.user._id });
  }

  if (!profile) {
    throw new AppError("Intern profile not found", 404);
  }

  const userId = req.user?._id ? String(req.user._id) : req.ip;
  const score = await aiGateway.computeResumeScoreCached(profile, userId);
  await trackAiEvent(req, "ai.resume_score", { cacheHit: score.cacheHit });
  res.json({ score });
});

exports.computeSkillGap = asyncHandler(async (req, res) => {
  const { internSkills, internshipId } = req.body;

  if (!internshipId) {
    throw new AppError("internshipId is required", 400);
  }

  const internship = await Internship.findById(internshipId);
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const userId = req.user?._id ? String(req.user._id) : req.ip;
  const analysis = await aiGateway.computeSkillGapCached(
    internSkills || [],
    internship.skillsRequired || [],
    userId
  );
  await trackAiEvent(req, "ai.skill_gap", { cacheHit: analysis.cacheHit });
  res.json({ analysis });
});

exports.recommend = asyncHandler(async (req, res) => {
  const { internId } = req.body;
  const profile = internId
    ? await InternProfile.findById(internId)
    : await InternProfile.findOne({ user: req.user._id });

  if (!profile) {
    throw new AppError("Intern profile not found", 404);
  }

  const parsedSkills = getParsedResumeSkills(profile);
  if (parsedSkills.length === 0) {
    return res.json({
      recommendations: [],
      reason: "missing_resume_skills",
      message: "Upload a resume to get accurate AI recommendations."
    });
  }

  const internships = await Internship.find({ isActive: true, isDeleted: false })
    .select("role skillsRequired location mode stipend description company isActive")
    .populate("company", "companyName verificationStatus")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const userId = req.user?._id ? String(req.user._id) : req.ip;
  const recommendations = await aiGateway.recommendInternshipsCached(profile, internships, { internSkills: parsedSkills }, userId);
  await trackAiEvent(req, "ai.recommendations", { count: recommendations?.length || 0 });
  res.json({ recommendations });
});

exports.matchCandidates = asyncHandler(async (req, res) => {
  const { internshipId } = req.body;
  if (!internshipId) {
    throw new AppError("internshipId is required", 400);
  }

  const internship = await Internship.findById(internshipId);
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const applications = await Application.find({ internshipId: internship._id })
    .populate(
      "intern",
      "fullName email skills resume.score resume.parsed education projects summary user"
    )
    .limit(200)
    .lean();

  const profiles = applications.map((entry) => entry.intern).filter(Boolean);
  const userId = req.user?._id ? String(req.user._id) : req.ip;
  const ranked = await aiGateway.rankApplicantsCached(internship, profiles, userId);
  await trackAiEvent(req, "ai.match_candidates", { count: ranked?.length || 0 });
  res.json({ matches: ranked });
});

exports.generateRoadmap = asyncHandler(async (req, res) => {
  const { targetRole, currentSkills } = req.body || {};
  let skills = currentSkills;
  if (!Array.isArray(skills) && req.user?.role === "intern") {
    const profile = await InternProfile.findOne({ user: req.user._id });
    skills = profile?.resume?.parsed?.skills || profile?.skills || [];
  }
  const roadmap = buildRoadmap({ targetRole, currentSkills: skills || [] });
  res.json({ roadmap });
});
