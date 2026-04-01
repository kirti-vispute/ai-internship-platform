const CompanyProfile = require("../models/CompanyProfile");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const InternProfile = require("../models/InternProfile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { rankApplicantsForInternship } = require("../services/ai.service");
const { normalizeSkillList, toDisplaySkillList } = require("../utils/skill-normalizer");

function normalizeIncomingSkills(value) {
  const list = Array.isArray(value) ? value : [];
  return toDisplaySkillList(normalizeSkillList(list));
}

async function getCompanyProfileByUserId(userId) {
  const company = await CompanyProfile.findOne({ user: userId });
  if (!company) {
    throw new AppError("Company profile not found", 404);
  }
  return company;
}

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await getCompanyProfileByUserId(req.user._id);
  res.json({ profile });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await getCompanyProfileByUserId(req.user._id);
  const allowed = ["companyName", "contactName", "phone", "website", "address", "description"];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  await profile.save();
  res.json({ message: "Company profile updated", profile });
});

exports.postInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);

  const { role, skillsRequired, prioritySkills, stipend, duration, location, description } = req.body;

  if (!role || !description) {
    throw new AppError("role and description are required", 400);
  }

  const internship = await Internship.create({
    company: company._id,
    role,
    skillsRequired: normalizeIncomingSkills(skillsRequired),
    prioritySkills: normalizeIncomingSkills(prioritySkills),
    stipend: stipend || "",
    duration: duration || "",
    location: location || "",
    description,
    isActive: true
  });

  res.status(201).json({ message: "Internship posted", internship });
});

exports.getMyInternships = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internships = await Internship.find({ company: company._id }).sort({ createdAt: -1 });
  res.json({ internships });
});

exports.updateMyInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await Internship.findOne({ _id: req.params.id, company: company._id });

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const allowed = ["role", "skillsRequired", "prioritySkills", "stipend", "duration", "location", "description", "isActive"];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "skillsRequired" || field === "prioritySkills") {
        internship[field] = normalizeIncomingSkills(req.body[field]);
      } else {
        internship[field] = req.body[field];
      }
    }
  });

  await internship.save();
  res.json({ message: "Internship updated", internship });
});

exports.deleteMyInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await Internship.findOneAndDelete({ _id: req.params.id, company: company._id });

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  await Application.deleteMany({ internship: internship._id });
  res.json({ message: "Internship deleted" });
});

exports.getApplicantsForInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await Internship.findOne({ _id: req.params.id, company: company._id });

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const applications = await Application.find({ internship: internship._id })
    .populate("intern")
    .sort({ createdAt: -1 });

  res.json({ applications });
});

exports.updateCandidateStage = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { status, note } = req.body;

  if (!status) {
    throw new AppError("status is required", 400);
  }

  const application = await Application.findById(req.params.applicationId).populate("internship");
  if (!application) {
    throw new AppError("Application not found", 404);
  }

  if (String(application.internship.company) !== String(company._id)) {
    throw new AppError("Not allowed for this internship", 403);
  }

  application.status = status;
  application.stageHistory.push({ stage: status, note: note || "" });
  await application.save();

  res.json({ message: "Candidate stage updated", application });
});

exports.addHrFeedback = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { feedback } = req.body;

  if (!feedback) {
    throw new AppError("feedback is required", 400);
  }

  const application = await Application.findById(req.params.applicationId).populate("internship");
  if (!application) {
    throw new AppError("Application not found", 404);
  }

  if (String(application.internship.company) !== String(company._id)) {
    throw new AppError("Not allowed for this internship", 403);
  }

  application.hrFeedback.push({ feedback });
  await application.save();

  res.json({ message: "Feedback added", application });
});

exports.getAiMatchedCandidates = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await Internship.findOne({ _id: req.params.id, company: company._id });

  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const applications = await Application.find({ internship: internship._id }).populate("intern");
  const profiles = applications.map((item) => item.intern).filter(Boolean);

  const ranked = rankApplicantsForInternship(internship, profiles);

  res.json({
    internship,
    matchedCandidates: ranked.map((item) => ({
      internProfile: item.profile,
      score: item.score,
      skillGap: item.skillGap
    }))
  });
});
