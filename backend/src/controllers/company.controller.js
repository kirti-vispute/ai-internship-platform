const User = require("../models/User");
const CompanyProfile = require("../models/CompanyProfile");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const InternProfile = require("../models/InternProfile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { rankApplicantsForInternship } = require("../services/ai.service");
const { computeApplicationRelevance } = require("../services/application-relevance.service");
const { normalizeSkillList, toDisplaySkillList } = require("../utils/skill-normalizer");
const { APPLICATION_STATUS } = require("../constants/enums");
const { canTransition } = require("../services/pipeline.service");
const { logActivity } = require("../services/activity-log.service");
const { sendNotificationEmail } = require("../services/notification.service");
const { hashPassword } = require("../utils/password");
const {
  canManageRecruiters,
  canAssignRecruiters,
  buildListMeta,
  applicantsQueryForInternship
} = require("../services/company-access.service");
const companyQuery = require("../services/company-query.service");
const { buildCompanyAnalytics } = require("../services/company-analytics.service");

function normalizeIncomingSkills(value) {
  const list = Array.isArray(value) ? value : [];
  return toDisplaySkillList(normalizeSkillList(list));
}

function normalizeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (!mode) return "";
  if (["remote", "on-site", "hybrid"].includes(mode)) return mode;
  throw new AppError("mode must be one of remote, on-site, hybrid", 400);
}

async function getCompanyProfileByUserId(userId) {
  const user = await User.findById(userId).select("companyProfileRef");
  if (user?.companyProfileRef) {
    const linked = await CompanyProfile.findById(user.companyProfileRef);
    if (linked) return linked;
  }

  const company = await CompanyProfile.findOne({ user: userId });
  if (!company) {
    throw new AppError("Company profile not found", 404);
  }
  return company;
}

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await getCompanyProfileByUserId(req.user._id);
  res.json({
    profile,
    currentUser: {
      _id: req.user._id,
      email: req.user.email,
      companyAccountType: req.user.companyAccountType || "owner",
      permissions: req.user.permissions || []
    },
    meta: buildListMeta(req.user)
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await getCompanyProfileByUserId(req.user._id);
  const allowed = ["companyName", "contactName", "phone", "website", "address", "description"];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  await profile.save();
  res.json({ message: "Company profile updated", profile, meta: buildListMeta(req.user) });
});

exports.postInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);

  const {
    role,
    skillsRequired,
    prioritySkills,
    stipend,
    perks,
    openings,
    duration,
    internshipType,
    department,
    location,
    startDate,
    applicationDeadline,
    mode,
    responsibilities,
    eligibilityCriteria,
    preferredSkillsText,
    educationQualification,
    degreePreferences,
    minimumCgpa,
    experienceRequirement,
    selectionProcess,
    interviewRoundsInfo,
    additionalInstructions,
    hrContact,
    description
  } = req.body;

  if (!role || !description) {
    throw new AppError("role and description are required", 400);
  }

  const internship = await Internship.create({
    company: company._id,
    assignedRecruiter: null,
    assignedDepartment: department || "",
    role,
    skillsRequired: normalizeIncomingSkills(skillsRequired),
    prioritySkills: normalizeIncomingSkills(prioritySkills),
    stipend: stipend || "",
    perks: perks || "",
    openings: typeof openings === "number" ? openings : null,
    duration: duration || "",
    internshipType: internshipType || "",
    department: department || "",
    location: location || "",
    startDate: startDate ? new Date(startDate) : null,
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
    mode: normalizeMode(mode),
    responsibilities: responsibilities || "",
    eligibilityCriteria: eligibilityCriteria || "",
    preferredSkillsText: preferredSkillsText || "",
    educationQualification: educationQualification || "",
    degreePreferences: degreePreferences || "",
    minimumCgpa: minimumCgpa || "",
    experienceRequirement: experienceRequirement || "",
    selectionProcess: selectionProcess || "",
    interviewRoundsInfo: interviewRoundsInfo || "",
    additionalInstructions: additionalInstructions || "",
    hrContact: hrContact || "",
    description,
    isActive: true
  });
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "internship",
    entityId: internship._id,
    action: "internship_created",
    metadata: { role: internship.role },
    ipAddress: req.ip
  });

  res.status(201).json({ message: "Internship posted", internship, meta: buildListMeta(req.user) });
});

exports.getMyInternships = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const result = await companyQuery.findInternships(company._id, req.user, {
    page: req.query.page,
    limit: req.query.limit
  });
  res.json(result);
});

exports.updateMyInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await companyQuery.findInternshipById(company._id, req.params.id, req.user);

  const allowed = [
    "role", "skillsRequired", "prioritySkills", "stipend", "perks", "openings", "duration", "internshipType", "department",
    "location", "startDate", "applicationDeadline", "mode", "responsibilities", "eligibilityCriteria", "preferredSkillsText",
    "educationQualification", "degreePreferences", "minimumCgpa", "experienceRequirement", "selectionProcess",
    "interviewRoundsInfo", "additionalInstructions", "hrContact", "description", "isActive"
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "skillsRequired" || field === "prioritySkills") {
        internship[field] = normalizeIncomingSkills(req.body[field]);
      } else {
        if (field === "mode") internship[field] = normalizeMode(req.body[field]);
        else if (field === "startDate" || field === "applicationDeadline") internship[field] = req.body[field] ? new Date(req.body[field]) : null;
        else if (field === "openings") internship[field] = typeof req.body[field] === "number" ? req.body[field] : null;
        else internship[field] = req.body[field];
      }
    }
  });

  await internship.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "internship",
    entityId: internship._id,
    action: "internship_updated",
    metadata: { fields: Object.keys(req.body || {}) },
    ipAddress: req.ip
  });
  res.json({ message: "Internship updated", internship, meta: buildListMeta(req.user) });
});

exports.deleteMyInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await companyQuery.findInternshipById(company._id, req.params.id, req.user);

  internship.isDeleted = true;
  internship.deletedAt = new Date();
  internship.deletedBy = req.user._id;
  internship.isActive = false;
  await internship.save();

  await Application.updateMany(
    { $or: [{ internshipId: internship._id }, { internship: internship._id }] },
    { $set: { status: APPLICATION_STATUS.ON_HOLD } }
  );
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "internship",
    entityId: internship._id,
    action: "internship_soft_deleted",
    metadata: null,
    ipAddress: req.ip
  });
  res.json({ message: "Internship deleted", meta: buildListMeta(req.user) });
});

exports.getApplicantsForInternship = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await companyQuery.findInternshipById(company._id, req.params.id, req.user);

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const status = String(req.query.status || "").trim();

  const query = applicantsQueryForInternship(internship._id, company._id, req.user);
  if (status) query.status = status;

  const applications = await Application.find(query).populate("intern").sort({ createdAt: -1 });

  await Promise.all(
    applications.map(async (application) => {
      const relevance = computeApplicationRelevance(application.intern || {}, internship || {});
      const nextScore = relevance.relevanceScore;
      if ((application.relevanceScore ?? application.matchScore ?? -1) !== nextScore) {
        application.relevanceScore = nextScore;
        application.matchScore = nextScore;
        await application.save();
      }
    })
  );

  const total = await Application.countDocuments(query);
  const skip = (page - 1) * limit;
  res.json({
    applications: applications.slice(skip, skip + limit),
    page,
    limit,
    total,
    meta: buildListMeta(req.user)
  });
});

exports.updateCandidateStage = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { status, note } = req.body;

  if (!status) {
    throw new AppError("status is required", 400);
  }
  if (!Object.values(APPLICATION_STATUS).includes(status)) {
    throw new AppError("Invalid status value", 400);
  }

  const application = await companyQuery.findApplicationById(
    company._id,
    req.params.applicationId,
    req.user
  );

  const previousStatus = application.status;
  if (!canTransition(previousStatus, status)) {
    throw new AppError(`Invalid stage transition from ${application.status} to ${status}`, 400);
  }
  application.status = status;
  application.stageHistory.push({ stage: status, note: note || "" });
  await application.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "application",
    entityId: application._id,
    action: "application_stage_updated",
    metadata: { from: previousStatus, to: status, note: note || "" },
    ipAddress: req.ip
  });
  const internProfile = await InternProfile.findById(application.internId || application.intern).select("email");
  if (internProfile?.email) {
    sendNotificationEmail({
      to: internProfile.email,
      subject: "Application Status Updated",
      text: `Your application status is now ${status.replace(/_/g, " ")}.`,
      type: "application_status_changed"
    });
  }

  res.json({ message: "Candidate stage updated", application, meta: buildListMeta(req.user) });
});

exports.scheduleInterviewRound = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { roundType, interviewDate, interviewTime, mode, meetingLink, location, notes } = req.body || {};

  if (!roundType || !interviewDate || !interviewTime) {
    throw new AppError("roundType, interviewDate and interviewTime are required", 400);
  }

  const application = await companyQuery.findApplicationById(
    company._id,
    req.params.applicationId,
    req.user
  );

  application.interviewRounds.push({
    roundType: String(roundType || "").trim(),
    interviewDate: new Date(interviewDate),
    interviewTime: String(interviewTime || "").trim(),
    mode: ["online", "offline"].includes(String(mode || "").toLowerCase()) ? String(mode).toLowerCase() : "",
    meetingLink: String(meetingLink || "").trim(),
    location: String(location || "").trim(),
    notes: String(notes || "").trim(),
    status: "scheduled",
    updatedAt: new Date()
  });

  application.status = APPLICATION_STATUS.INTERVIEW_SCHEDULED;
  application.stageHistory.push({ stage: "interview_scheduled", note: "Interview round scheduled" });
  await application.save();
  const internProfile = await InternProfile.findById(application.internId || application.intern).select("email");
  if (internProfile?.email) {
    sendNotificationEmail({
      to: internProfile.email,
      subject: "Interview Scheduled",
      text: "An interview round has been scheduled for your application.",
      type: "interview_scheduled"
    });
  }

  res.json({ message: "Interview round scheduled", application, meta: buildListMeta(req.user) });
});

exports.updateInterviewRound = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { status, notes, interviewDate, interviewTime, mode, meetingLink, location } = req.body || {};

  const application = await companyQuery.findApplicationById(
    company._id,
    req.params.applicationId,
    req.user
  );

  const round = (application.interviewRounds || []).id(req.params.roundId);
  if (!round) {
    throw new AppError("Interview round not found", 404);
  }

  if (status) round.status = String(status).toLowerCase();
  if (notes !== undefined) round.notes = String(notes || "").trim();
  if (interviewDate) round.interviewDate = new Date(interviewDate);
  if (interviewTime !== undefined) round.interviewTime = String(interviewTime || "").trim();
  if (meetingLink !== undefined) round.meetingLink = String(meetingLink || "").trim();
  if (location !== undefined) round.location = String(location || "").trim();
  if (mode !== undefined) round.mode = ["online", "offline"].includes(String(mode || "").toLowerCase()) ? String(mode).toLowerCase() : "";
  round.updatedAt = new Date();

  if (round.status === "completed" || round.status === "cleared") {
    application.status = "interview_completed";
    application.stageHistory.push({ stage: "interview_completed", note: "Interview round completed" });
  }
  if (round.status === "rejected") {
    application.status = "rejected";
    application.stageHistory.push({ stage: "rejected", note: "Rejected after interview round" });
  }

  await application.save();
  res.json({ message: "Interview round updated", application, meta: buildListMeta(req.user) });
});

exports.addHrFeedback = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { feedback, rating, category, visibility = "candidate" } = req.body;

  if (!feedback) {
    throw new AppError("feedback is required", 400);
  }

  const application = await companyQuery.findApplicationById(
    company._id,
    req.params.applicationId,
    req.user
  );

  application.hrFeedback.push({
    feedback,
    stage: application.status,
    rating: typeof rating === "number" ? rating : null,
    category: String(category || "general"),
    visibility: ["internal", "candidate"].includes(String(visibility)) ? String(visibility) : "candidate",
    authorRole: req.user.role
  });
  await application.save();
  const internProfile = await InternProfile.findById(application.internId || application.intern).select("email");
  if (internProfile?.email) {
    sendNotificationEmail({
      to: internProfile.email,
      subject: "Recruiter Feedback Added",
      text: "New recruiter feedback is available for your application.",
      type: "feedback_added"
    });
  }
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "application",
    entityId: application._id,
    action: "hr_feedback_added",
    metadata: { stage: application.status, rating: typeof rating === "number" ? rating : null },
    ipAddress: req.ip
  });

  res.json({ message: "Feedback added", application, meta: buildListMeta(req.user) });
});

exports.getAiMatchedCandidates = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const internship = await companyQuery.findInternshipById(company._id, req.params.id, req.user);

  const applications = await Application.find(
    applicantsQueryForInternship(internship._id, company._id, req.user)
  ).populate("intern");
  const profiles = applications.map((item) => item.intern).filter(Boolean);

  const ranked = rankApplicantsForInternship(internship, profiles);

  res.json({
    internship,
    matchedCandidates: ranked.map((item) => ({
      internProfile: item.profile,
      score: item.score,
      skillGap: item.skillGap
    })),
    meta: buildListMeta(req.user)
  });
});

exports.assignInternshipRecruiter = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  if (!canAssignRecruiters(req.user)) {
    throw new AppError("Insufficient permission to assign recruiters", 403);
  }

  const { recruiterUserId, department = "" } = req.body || {};
  if (!recruiterUserId) throw new AppError("recruiterUserId is required", 400);

  const recruiter = await User.findOne({
    _id: recruiterUserId,
    role: "company",
    companyProfileRef: company._id,
    companyAccountType: "hr",
    isDeleted: false,
    isActive: true
  });
  if (!recruiter) throw new AppError("HR recruiter not found in this company", 404);

  const internship = await Internship.findOne({ _id: req.params.id, company: company._id, isDeleted: false });
  if (!internship) throw new AppError("Internship not found", 404);

  internship.assignedRecruiter = recruiter._id;
  internship.assignedDepartment = String(department || internship.assignedDepartment || "").trim();
  await internship.save();

  await Application.updateMany(
    { $or: [{ internshipId: internship._id }, { internship: internship._id }], companyId: company._id },
    { $set: { assignedRecruiter: recruiter._id, assignmentUpdatedAt: new Date(), assignedBy: req.user._id } }
  );

  res.json({ message: "Internship assigned to recruiter", internship, meta: buildListMeta(req.user) });
});

exports.assignApplicationRecruiter = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  if (!canAssignRecruiters(req.user)) {
    throw new AppError("Insufficient permission to assign recruiters", 403);
  }
  const { recruiterUserId } = req.body || {};
  if (!recruiterUserId) throw new AppError("recruiterUserId is required", 400);

  const recruiter = await User.findOne({
    _id: recruiterUserId,
    role: "company",
    companyProfileRef: company._id,
    companyAccountType: "hr",
    isDeleted: false,
    isActive: true
  });
  if (!recruiter) throw new AppError("HR recruiter not found in this company", 404);

  const application = await Application.findOne({ _id: req.params.applicationId, companyId: company._id });
  if (!application) throw new AppError("Application not found", 404);

  application.assignedRecruiter = recruiter._id;
  application.assignmentUpdatedAt = new Date();
  application.assignedBy = req.user._id;
  await application.save();

  res.json({ message: "Application assigned to recruiter", application, meta: buildListMeta(req.user) });
});

exports.getRecruiters = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { listCompanyHrUsers } = require("../services/company-hr.service");
  const hrUsers = await listCompanyHrUsers(company._id);
  const recruiters = hrUsers
    .filter((hr) => hr.isActive)
    .map((hr) => ({
      _id: hr._id,
      email: hr.email,
      displayName: hr.displayName || hr.email.split("@")[0],
      companyAccountType: hr.companyAccountType,
      isActive: hr.isActive
    }));
  res.json({ recruiters, meta: buildListMeta(req.user) });
});

exports.createRecruiter = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  if (!canManageRecruiters(req.user)) {
    throw new AppError("Insufficient permission to manage recruiters", 403);
  }
  const { email, password } = req.body || {};
  if (!email || !password) throw new AppError("email and password are required", 400);
  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) throw new AppError("Email already exists", 409);

  const user = await User.create({
    email: String(email).toLowerCase().trim(),
    passwordHash: await hashPassword(password),
    role: "company",
    companyAccountType: "hr",
    companyProfileRef: company._id
  });
  res.status(201).json({
    message: "Recruiter account created",
    user: { _id: user._id, email: user.email, companyAccountType: user.companyAccountType },
    meta: buildListMeta(req.user)
  });
});

exports.deactivateRecruiter = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  if (!canManageRecruiters(req.user)) {
    throw new AppError("Insufficient permission to manage recruiters", 403);
  }

  const recruiter = await User.findOne({
    _id: req.params.userId,
    role: "company",
    companyProfileRef: company._id,
    companyAccountType: "hr",
    isDeleted: false
  });
  if (!recruiter) throw new AppError("Recruiter not found", 404);
  recruiter.isActive = false;
  await recruiter.save();
  res.json({ message: "Recruiter deactivated", meta: buildListMeta(req.user) });
});

exports.getCompanyAnalytics = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const payload = await buildCompanyAnalytics(company._id, req.user);
  res.json(payload);
});
