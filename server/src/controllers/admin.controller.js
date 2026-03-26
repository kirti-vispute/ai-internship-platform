const User = require("../models/User");
const Internship = require("../models/Internship");
const CompanyProfile = require("../models/CompanyProfile");
const ReportedCompany = require("../models/ReportedCompany");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { COMPANY_VERIFICATION_STATUS, REPORTED_COMPANY_STATUS } = require("../constants/enums");

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("email role isActive createdAt").sort({ createdAt: -1 });
  res.json({ users });
});

exports.getAllInternships = asyncHandler(async (req, res) => {
  const internships = await Internship.find({}).populate("company").sort({ createdAt: -1 });
  res.json({ internships });
});

exports.getCompanies = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const filter = status ? { verificationStatus: status } : {};

  const companies = await CompanyProfile.find(filter).sort({ createdAt: -1 });
  res.json({ companies });
});

exports.updateCompanyVerification = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!Object.values(COMPANY_VERIFICATION_STATUS).includes(status)) {
    throw new AppError("Invalid verification status", 400);
  }

  const company = await CompanyProfile.findById(req.params.companyId);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  company.verificationStatus = status;
  company.rejectionReason = status === COMPANY_VERIFICATION_STATUS.REJECTED ? (rejectionReason || "") : "";
  await company.save();

  res.json({ message: "Company verification updated", company });
});

exports.reportCompany = asyncHandler(async (req, res) => {
  const { companyId, reason } = req.body;
  if (!companyId || !reason) {
    throw new AppError("companyId and reason are required", 400);
  }

  const report = await ReportedCompany.create({
    company: companyId,
    reason,
    reportedBy: req.user?._id
  });

  res.status(201).json({ message: "Company reported", report });
});

exports.getReportedCompanies = asyncHandler(async (req, res) => {
  const reports = await ReportedCompany.find({}).populate("company reportedBy", "companyName companyEmail email role").sort({ createdAt: -1 });
  res.json({ reports });
});

exports.resolveReport = asyncHandler(async (req, res) => {
  const { resolutionNote } = req.body;

  const report = await ReportedCompany.findById(req.params.reportId);
  if (!report) {
    throw new AppError("Report not found", 404);
  }

  report.status = REPORTED_COMPANY_STATUS.RESOLVED;
  report.resolutionNote = resolutionNote || "Resolved by admin";
  await report.save();

  res.json({ message: "Report resolved", report });
});
