const Internship = require("../models/Internship");
const CompanyProfile = require("../models/CompanyProfile");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { COMPANY_VERIFICATION_STATUS } = require("../constants/enums");

exports.getAllInternships = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  if (req.query.location) {
    filter.location = { $regex: req.query.location, $options: "i" };
  }

  if (req.query.role) {
    filter.role = { $regex: req.query.role, $options: "i" };
  }

  const internships = await Internship.find(filter).populate("company").sort({ createdAt: -1 });

  // Production note: this currently filters by active internships only.
  // Add full-text indexes for advanced search/scoring in future iterations.
  const filtered = internships.filter((item) => item.company?.verificationStatus === COMPANY_VERIFICATION_STATUS.VERIFIED);

  res.json({ internships: filtered });
});

exports.getInternshipById = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.id).populate("company");
  if (!internship) {
    throw new AppError("Internship not found", 404);
  }

  const company = await CompanyProfile.findById(internship.company);
  if (!company || company.verificationStatus !== COMPANY_VERIFICATION_STATUS.VERIFIED) {
    throw new AppError("Internship not available", 404);
  }

  res.json({ internship });
});
