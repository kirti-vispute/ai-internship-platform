const User = require("../models/User");
const Internship = require("../models/Internship");
const CompanyProfile = require("../models/CompanyProfile");
const ReportedCompany = require("../models/ReportedCompany");
const ActivityLog = require("../models/ActivityLog");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { COMPANY_VERIFICATION_STATUS, REPORTED_COMPANY_STATUS, ADMIN_ROLES, USER_ROLES } = require("../constants/enums");
const { logActivity } = require("../services/activity-log.service");
const { ROLE_PERMISSIONS } = require("../constants/roles");

function softDeleteFilter(query) {
  return { ...query, isDeleted: false };
}

function buildUserFilter({ q = "", role = "", isActive }) {
  const filter = { isDeleted: false };
  const normalizedQuery = String(q || "").trim();
  if (normalizedQuery) {
    filter.email = { $regex: normalizedQuery, $options: "i" };
  }
  if (role && Object.values(USER_ROLES).includes(role)) {
    filter.role = role;
  }
  if (isActive === "true" || isActive === "false") {
    filter.isActive = isActive === "true";
  }
  return filter;
}

function buildReportFilter({ status = "", type = "", q = "" }) {
  const filter = softDeleteFilter({});
  if (status && Object.values(REPORTED_COMPANY_STATUS).includes(status)) {
    filter.status = status;
  }
  if (type) {
    filter.reportType = type;
  }
  const normalizedQuery = String(q || "").trim();
  if (normalizedQuery) {
    filter.$or = [
      { reason: { $regex: normalizedQuery, $options: "i" } },
      { details: { $regex: normalizedQuery, $options: "i" } }
    ];
  }
  return filter;
}

exports.getDashboardMetrics = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalCompanies,
    activeInternships,
    totalHires,
    reportsOverview,
    pendingCompanyApprovals,
    activeInterviews
  ] = await Promise.all([
    User.countDocuments(softDeleteFilter({ role: USER_ROLES.INTERN })),
    CompanyProfile.countDocuments(softDeleteFilter({})),
    Internship.countDocuments(softDeleteFilter({ isActive: true })),
    Application.countDocuments({ status: { $in: ["selected", "offered"] } }),
    ReportedCompany.countDocuments(softDeleteFilter({ status: { $in: [REPORTED_COMPANY_STATUS.OPEN, REPORTED_COMPANY_STATUS.IN_REVIEW, REPORTED_COMPANY_STATUS.ESCALATED] } })),
    CompanyProfile.countDocuments(softDeleteFilter({ verificationStatus: COMPANY_VERIFICATION_STATUS.PENDING })),
    Application.countDocuments({ status: { $in: ["interview_scheduled", "technical_round", "hr_round"] } })
  ]);

  res.json({
    metrics: {
      totalStudents,
      totalCompanies,
      activeInternships,
      totalHires,
      reportsOverview,
      pendingCompanyApprovals,
      activeInterviews
    }
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;
  const filter = buildUserFilter(req.query || {});
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("email role adminRole permissions isActive createdAt lastLoginAt lastLoginIp")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ users, page, limit, total });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, isDeleted: false }).select(
    "email role adminRole permissions isActive createdAt updatedAt lastLoginAt lastLoginIp"
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }
  res.json({ user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, isDeleted: false });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { isActive, role, adminRole } = req.body || {};
  if (typeof isActive === "boolean") {
    user.isActive = isActive;
  }

  if (role !== undefined) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new AppError("Invalid role", 400);
    }
    user.role = role;
  }

  if (user.role === USER_ROLES.ADMIN && adminRole !== undefined) {
    if (!Object.values(ADMIN_ROLES).includes(adminRole)) {
      throw new AppError("Invalid admin role", 400);
    }
    user.adminRole = adminRole;
    user.permissions = [...new Set(ROLE_PERMISSIONS[adminRole] || [])];
  }

  await user.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "user",
    entityId: user._id,
    action: "admin_user_updated",
    metadata: { isActive, role, adminRole },
    ipAddress: req.ip
  });

  res.json({ message: "User updated", user });
});

exports.softDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, isDeleted: false });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = req.user._id;
  user.isActive = false;
  await user.save();

  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "user",
    entityId: user._id,
    action: "admin_user_soft_deleted",
    metadata: null,
    ipAddress: req.ip
  });
  res.json({ message: "User soft deleted" });
});

exports.getAllInternships = asyncHandler(async (req, res) => {
  const internships = await Internship.find({ isDeleted: false }).populate("company").sort({ createdAt: -1 });
  res.json({ internships });
});

exports.getCompanies = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const q = String(req.query.q || "").trim();
  const filter = {};
  if (status && Object.values(COMPANY_VERIFICATION_STATUS).includes(status)) {
    filter.verificationStatus = status;
  }
  if (q) {
    filter.$or = [
      { companyName: { $regex: q, $options: "i" } },
      { companyEmail: { $regex: q, $options: "i" } },
      { contactName: { $regex: q, $options: "i" } }
    ];
  }

  const companies = await CompanyProfile.find({ ...filter, isDeleted: false })
    .populate("verifiedByAdmin", "email")
    .sort({ createdAt: -1 });
  res.json({ companies });
});

exports.updateCompanyVerification = asyncHandler(async (req, res) => {
  const { status, rejectionReason, verificationNotes = "", verifiedBadge = false } = req.body;

  if (!Object.values(COMPANY_VERIFICATION_STATUS).includes(status)) {
    throw new AppError("Invalid verification status", 400);
  }

  const company = await CompanyProfile.findById(req.params.companyId);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  company.verificationStatus = status;
  company.rejectionReason = status === COMPANY_VERIFICATION_STATUS.REJECTED ? (rejectionReason || "") : "";
  if (status === COMPANY_VERIFICATION_STATUS.VERIFIED && verifiedBadge) {
    company.verifiedBadgeIssuedAt = new Date();
    company.verifiedByAdmin = req.user._id;
  }
  if (status === COMPANY_VERIFICATION_STATUS.SUSPENDED) {
    company.rejectionReason = rejectionReason || "Suspended by administrator";
  }
  await company.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "company_profile",
    entityId: company._id,
    action: "verification_status_updated",
    metadata: { status, verificationNotes, verifiedBadge },
    ipAddress: req.ip
  });

  res.json({ message: "Company verification updated", company });
});

exports.reportCompany = asyncHandler(async (req, res) => {
  const { companyId, reason, details = "", reportType = "other", evidenceUrls = [], internshipId = null, hrUserId = null } = req.body;
  if (!companyId || !reason) {
    throw new AppError("companyId and reason are required", 400);
  }

  const report = await ReportedCompany.create({
    company: companyId,
    reason,
    details,
    reportType,
    evidenceUrls,
    internship: internshipId,
    hrUser: hrUserId,
    reportedBy: req.user?._id
  });

  res.status(201).json({ message: "Company reported", report });
});

exports.getReportedCompanies = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.query || {});
  const reports = await ReportedCompany.find(filter)
    .populate("company reportedBy hrUser reviewedBy", "companyName companyEmail email role")
    .populate("internship", "role")
    .sort({ createdAt: -1 });
  res.json({ reports });
});

exports.resolveReport = asyncHandler(async (req, res) => {
  const { resolutionNote, status = REPORTED_COMPANY_STATUS.RESOLVED } = req.body || {};

  const report = await ReportedCompany.findById(req.params.reportId);
  if (!report) {
    throw new AppError("Report not found", 404);
  }

  if (!Object.values(REPORTED_COMPANY_STATUS).includes(status)) {
    throw new AppError("Invalid report status", 400);
  }
  report.status = status;
  report.resolutionNote = resolutionNote || "Resolved by admin";
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  await report.save();
  await logActivity({
    actorUser: req.user._id,
    actorRole: req.user.role,
    entityType: "company_report",
    entityId: report._id,
    action: "report_status_updated",
    metadata: { status },
    ipAddress: req.ip
  });

  res.json({ message: "Report updated", report });
});

exports.getActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const query = {};
  if (req.query.entityType) query.entityType = req.query.entityType;
  if (req.query.action) query.action = req.query.action;
  if (req.query.actorRole) query.actorRole = req.query.actorRole;
  if (req.query.actorUserId) query.actorUser = req.query.actorUserId;
  if (req.query.q) {
    query.$or = [
      { action: { $regex: req.query.q, $options: "i" } },
      { entityType: { $regex: req.query.q, $options: "i" } },
      { ipAddress: { $regex: req.query.q, $options: "i" } }
    ];
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("actorUser", "email"),
    ActivityLog.countDocuments(query)
  ]);
  res.json({ logs, page, limit, total });
});
