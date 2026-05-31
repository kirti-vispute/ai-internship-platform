const asyncHandler = require("../utils/asyncHandler");
const CompanyProfile = require("../models/CompanyProfile");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { buildListMeta } = require("../services/company-access.service");
const {
  buildHrInsights,
  createHrAccount,
  deleteHrAccount,
  updateHrPermissions,
  listCompanyHrUsers
} = require("../services/company-hr.service");
const { HR_ASSIGNABLE_PERMISSIONS } = require("../constants/hr-permissions");

async function getCompanyProfileByUserId(userId) {
  const user = await User.findById(userId).select("companyProfileRef");
  if (user?.companyProfileRef) {
    const linked = await CompanyProfile.findById(user.companyProfileRef);
    if (linked) return linked;
  }
  const company = await CompanyProfile.findOne({ user: userId });
  if (!company) throw new AppError("Company profile not found", 404);
  return company;
}

exports.createHr = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const hrUser = await createHrAccount(company._id, req.body || {});
  res.status(201).json({
    message: "HR account created",
    hrUser,
    meta: buildListMeta(req.user)
  });
});

exports.deleteHr = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const result = await deleteHrAccount(company._id, req.params.id, req.user._id);
  res.json({ message: "HR account deleted", ...result, meta: buildListMeta(req.user) });
});

exports.getHrInsights = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const insights = await buildHrInsights(company._id);
  res.json({ ...insights, meta: buildListMeta(req.user) });
});

exports.patchHrPermissions = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const { permissions } = req.body || {};
  if (!Array.isArray(permissions)) {
    throw new AppError("permissions array is required", 400);
  }
  const hrUser = await updateHrPermissions(company._id, req.params.id, permissions);
  res.json({
    message: "HR permissions updated",
    hrUser,
    assignablePermissions: HR_ASSIGNABLE_PERMISSIONS,
    meta: buildListMeta(req.user)
  });
});

exports.listHr = asyncHandler(async (req, res) => {
  const company = await getCompanyProfileByUserId(req.user._id);
  const hrUsers = await listCompanyHrUsers(company._id);
  res.json({
    hrUsers: hrUsers.map((hr) => ({
      id: hr._id,
      name: hr.displayName || hr.email.split("@")[0],
      email: hr.email,
      isActive: hr.isActive,
      permissions: hr.permissions || []
    })),
    meta: buildListMeta(req.user)
  });
});
