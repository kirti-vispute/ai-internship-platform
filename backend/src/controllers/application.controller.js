const fs = require("fs");
const path = require("path");

const Application = require("../models/Application");
const CompanyProfile = require("../models/CompanyProfile");
const InternProfile = require("../models/InternProfile");
const asyncHandler = require("../utils/asyncHandler");

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("intern")
    .populate({ path: "internship", populate: { path: "company" } });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  res.json({ application });
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

exports.getApplicationResume = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).select("attachedResumePath internId intern companyId company");
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  const role = String(req.user?.role || "");
  if (role === "intern") {
    const profile = await InternProfile.findOne({ user: req.user._id }).select("_id");
    if (!profile || (String(application.internId || application.intern) !== String(profile._id))) {
      return res.status(403).json({ message: "Not allowed to access this resume" });
    }
  } else if (role === "company") {
    const profile = await CompanyProfile.findOne({ user: req.user._id }).select("_id");
    if (!profile || (String(application.companyId || application.company) !== String(profile._id))) {
      return res.status(403).json({ message: "Not allowed to access this resume" });
    }
  } else {
    return res.status(403).json({ message: "Not allowed to access this resume" });
  }

  const normalized = normalizeResumePath(application.attachedResumePath);
  if (!normalized) {
    return res.status(404).json({ message: "Resume not available" });
  }
  const absolutePath = path.join(__dirname, "../..", normalized);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ message: "Resume not available" });
  }

  return res.sendFile(absolutePath);
});
