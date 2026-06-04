const CompanyProfile = require("../models/CompanyProfile");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { APPLICATION_STATUS, COMPANY_VERIFICATION_STATUS } = require("../constants/enums");

exports.getPublicCompanyProfile = asyncHandler(async (req, res) => {
  const company = await CompanyProfile.findOne({
    _id: req.params.companyId,
    isDeleted: { $ne: true }
  }).select("companyName companyEmail website address description verificationStatus linkedInUrl createdAt");

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const companyId = company._id;
  const [activeOpenings, totalApplications, totalHires] = await Promise.all([
    Internship.countDocuments({ company: companyId, isActive: true, isDeleted: { $ne: true } }),
    Application.countDocuments({ companyId }),
    Application.countDocuments({
      companyId,
      status: { $in: [APPLICATION_STATUS.SELECTED, APPLICATION_STATUS.OFFERED] }
    })
  ]);

  const hiringSuccessRate = totalApplications > 0 ? Math.round((totalHires / totalApplications) * 100) : 0;

  res.json({
    company: {
      _id: company._id,
      companyName: company.companyName,
      website: company.website,
      address: company.address,
      description: company.description,
      linkedInUrl: company.linkedInUrl,
      joinedAt: company.createdAt,
      verificationStatus: company.verificationStatus,
      isVerified: company.verificationStatus === COMPANY_VERIFICATION_STATUS.VERIFIED,
      activeOpenings,
      totalInternsHired: totalHires,
      hiringSuccessRate,
      totalApplications
    }
  });
});
