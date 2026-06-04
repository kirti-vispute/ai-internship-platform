const Internship = require("../models/Internship");
const CompanyProfile = require("../models/CompanyProfile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { COMPANY_VERIFICATION_STATUS } = require("../constants/enums");

exports.getAllInternships = asyncHandler(async (req, res) => {
  const filter = { isActive: true, isDeleted: false };
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;

  if (req.query.location) {
    filter.location = { $regex: req.query.location, $options: "i" };
  }

  if (req.query.role) {
    filter.role = { $regex: req.query.role, $options: "i" };
  }

  const internships = await Internship.find(filter).populate("company").sort({ createdAt: -1 }).skip(skip).limit(limit);

  // Production note: this currently filters by active internships only.
  // Add full-text indexes for advanced search/scoring in future iterations.
  const filtered = internships.filter((item) => item.company?.verificationStatus === COMPANY_VERIFICATION_STATUS.VERIFIED);

  const total = await Internship.countDocuments(filter);
  res.json({ internships: filtered, page, limit, total });
});

exports.getInternshipById = asyncHandler(async (req, res) => {
  const internship = await Internship.findOne({ _id: req.params.id, isDeleted: false }).populate("company");
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const company = await CompanyProfile.findById(internship.company);
  if (!company || company.verificationStatus !== COMPANY_VERIFICATION_STATUS.VERIFIED) {
    throw new AppError("Internship not available", 404);
  }

  res.json({ internship });
});
