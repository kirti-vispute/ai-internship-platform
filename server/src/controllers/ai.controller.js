const InternProfile = require("../models/InternProfile");
const Internship = require("../models/Internship");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { parseResumeText, calculateResumeScore, getSkillGap, recommendInternships, rankApplicantsForInternship } = require("../services/ai.service");

exports.parseResume = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    throw new AppError("text is required", 400);
  }

  const parsed = parseResumeText(text);
  res.json({ parsed });
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

  const score = calculateResumeScore(profile);
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

  const analysis = getSkillGap(internSkills || [], internship.skillsRequired || []);
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

  const internships = await Internship.find({ isActive: true }).populate("company");
  const recommendations = recommendInternships(profile, internships);

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

  const profiles = await InternProfile.find({});
  const ranked = rankApplicantsForInternship(internship, profiles);

  res.json({ matches: ranked });
});
