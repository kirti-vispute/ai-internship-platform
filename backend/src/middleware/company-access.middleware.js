const { sendError } = require("../utils/api-response");
const {
  assertCanPostInternships,
  assertCanUpdateCompanyProfile,
  canManageRecruiters,
  canManageHrAccounts,
  canAssignRecruiters,
  canViewGlobalAnalytics,
  isHrScopedUser
} = require("../services/company-access.service");
const AppError = require("../utils/AppError");

function requireExecutiveCompany() {
  return (req, res, next) => {
    if (isHrScopedUser(req.user)) {
      return sendError(res, {
        statusCode: 403,
        message: "Forbidden: executive company access required"
      });
    }
    return next();
  };
}

function requireCanPostInternship() {
  return (req, res, next) => {
    try {
      assertCanPostInternships(req.user);
      return next();
    } catch (error) {
      return sendError(res, {
        statusCode: error.statusCode || 403,
        message: error.message
      });
    }
  };
}

function requireCanUpdateCompanyProfile() {
  return (req, res, next) => {
    try {
      assertCanUpdateCompanyProfile(req.user);
      return next();
    } catch (error) {
      return sendError(res, {
        statusCode: error.statusCode || 403,
        message: error.message
      });
    }
  };
}

function requireManageRecruiters() {
  return (req, res, next) => {
    if (!canManageRecruiters(req.user)) {
      return sendError(res, { statusCode: 403, message: "Forbidden: cannot manage recruiters" });
    }
    return next();
  };
}

function requireCeoHrManagement() {
  return (req, res, next) => {
    if (isHrScopedUser(req.user)) {
      return sendError(res, { statusCode: 403, message: "Forbidden: HR cannot manage HR accounts" });
    }
    if (!canManageHrAccounts(req.user)) {
      return sendError(res, { statusCode: 403, message: "Forbidden: CEO access required for HR management" });
    }
    return next();
  };
}

function requireAssignRecruiters() {
  return (req, res, next) => {
    if (!canAssignRecruiters(req.user)) {
      return sendError(res, { statusCode: 403, message: "Forbidden: cannot assign recruiters" });
    }
    return next();
  };
}

function requireGlobalAnalytics() {
  return (req, res, next) => {
    if (!canViewGlobalAnalytics(req.user) && !isHrScopedUser(req.user)) {
      return sendError(res, { statusCode: 403, message: "Forbidden: global analytics not permitted" });
    }
    return next();
  };
}

module.exports = {
  requireExecutiveCompany,
  requireCanPostInternship,
  requireCanUpdateCompanyProfile,
  requireManageRecruiters,
  requireCeoHrManagement,
  requireAssignRecruiters,
  requireGlobalAnalytics
};
