const fs = require("fs");
const path = require("path");

const Application = require("../../../models/Application");
const CompanyProfile = require("../../../models/CompanyProfile");
const InternProfile = require("../../../models/InternProfile");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const AppError = require("../../../shared/utils/AppError");
const { sendSuccess } = require("../../../shared/utils/api-response");

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("intern")
    .populate({ path: "internship", populate: { path: "company" } })
    .lean();

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  const role = String(req.user?.role || "");
  if (role === "intern") {
    const profile = await InternProfile.findOne({ user: req.user._id }).select("_id").lean();
    if (!profile || String(application.internId || application.intern) !== String(profile._id)) {
      throw new AppError("Not allowed to access this application", 403);
    }
  } else if (role === "company") {
    const profile = await CompanyProfile.findOne({ user: req.user._id }).select("_id").lean();
    if (!profile || String(application.companyId || application.company) !== String(profile._id)) {
      throw new AppError("Not allowed to access this application", 403);
    }
  } else if (role !== "admin") {
    throw new AppError("Not allowed to access this application", 403);
  }

  return sendSuccess(res, { data: { application } });
});

function normalizeResumePath(filePath = "") {
  let normalized = String(filePath || "").replace(/\\/g, "/").trim();
  if (!normalized) return "";
  normalized = normalized.replace(/^\/+/, "");
  if (normalized.startsWith("backend/")) normalized = normalized.slice("backend/".length);
  const uploadsIdx = normalized.indexOf("uploads/");
  if (uploadsIdx >= 0) return normalized.slice(uploadsIdx);
  return normalized;
}

function resolveAbsoluteResumePath(filePath = "") {
  const normalized = normalizeResumePath(filePath);
  if (!normalized) return "";
  const absolute = path.join(__dirname, "../..", normalized);
  if (!fs.existsSync(absolute)) return "";
  return absolute;
}

exports.getApplicationResume = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .select("attachedResumePath internId intern companyId company")
    .lean();
  if (!application) {
    throw new AppError("Application not found", 404);
  }

  const role = String(req.user?.role || "");
  if (role === "intern") {
    const profile = await InternProfile.findOne({ user: req.user._id }).select("_id").lean();
    if (!profile || (String(application.internId || application.intern) !== String(profile._id))) {
      throw new AppError("Not allowed to access this resume", 403);
    }
  } else if (role === "company") {
    const profile = await CompanyProfile.findOne({ user: req.user._id }).select("_id").lean();
    if (!profile || (String(application.companyId || application.company) !== String(profile._id))) {
      throw new AppError("Not allowed to access this resume", 403);
    }
  } else {
    throw new AppError("Not allowed to access this resume", 403);
  }

  const attachedResumeAbsolutePath = resolveAbsoluteResumePath(application.attachedResumePath);
  if (attachedResumeAbsolutePath) {
    return res.sendFile(attachedResumeAbsolutePath);
  }

  const internProfile = await InternProfile.findById(application.internId || application.intern)
    .select("resume.filePath")
    .lean();
  const fallbackResumeAbsolutePath = resolveAbsoluteResumePath(internProfile?.resume?.filePath);
  if (!fallbackResumeAbsolutePath) {
    throw new AppError("Resume not available", 404);
  }
  return res.sendFile(fallbackResumeAbsolutePath);
});
