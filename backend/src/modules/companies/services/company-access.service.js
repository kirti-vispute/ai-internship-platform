const { COMPANY_ACCOUNT_TYPES } = require("../../../constants/enums");
const { PERMISSION_KEYS } = require("../../../constants/roles");
const AppError = require("../../../shared/utils/AppError");
const {
  ALL_SIDEBAR_MODULE_KEYS,
  HR_DEFAULT_SIDEBAR_MODULES
} = require("../../../constants/sidebar-modules");

/** @typedef {"hr" | "executive"} CompanyAccessTier */

function getAccessTier(user = {}) {
  if (user?.companyAccountType === COMPANY_ACCOUNT_TYPES.HR) {
    return "hr";
  }
  return "executive";
}

function isHrScopedUser(user = {}) {
  return getAccessTier(user) === "hr";
}

function isCompanyAdminUser(user = {}) {
  const type = user?.companyAccountType || COMPANY_ACCOUNT_TYPES.OWNER;
  return (
    type === COMPANY_ACCOUNT_TYPES.OWNER ||
    type === COMPANY_ACCOUNT_TYPES.CEO
  );
}

function isCeoOrOwnerUser(user = {}) {
  return isCompanyAdminUser(user);
}

function canManageHrAccounts(user = {}) {
  return (
    user?.companyAccountType === COMPANY_ACCOUNT_TYPES.CEO ||
    user?.companyAccountType === COMPANY_ACCOUNT_TYPES.OWNER ||
    hasPermission(user, PERMISSION_KEYS.COMPANY_HR_MANAGE)
  );
}

function hasPermission(user = {}, permission) {
  return (user?.permissions || []).includes(permission);
}

function canManageRecruiters(user = {}) {
  return hasPermission(user, PERMISSION_KEYS.COMPANY_HR_MANAGE) || isCompanyAdminUser(user);
}

function canAssignRecruiters(user = {}) {
  return hasPermission(user, PERMISSION_KEYS.COMPANY_INTERNSHIP_ASSIGN) || isCompanyAdminUser(user);
}

function canPostInternships(user = {}) {
  if (isHrScopedUser(user)) return false;
  return hasPermission(user, PERMISSION_KEYS.INTERNSHIP_MANAGE) || isCompanyAdminUser(user);
}

function canUpdateCompanyProfile(user = {}) {
  if (isHrScopedUser(user)) return false;
  return hasPermission(user, PERMISSION_KEYS.PROFILE_WRITE) || isCompanyAdminUser(user);
}

function canViewGlobalAnalytics(user = {}) {
  if (isHrScopedUser(user)) return false;
  return hasPermission(user, PERMISSION_KEYS.COMPANY_ANALYTICS_GLOBAL) || isCompanyAdminUser(user);
}

function canViewSalaryAnalytics(user = {}) {
  if (isHrScopedUser(user)) return false;
  return hasPermission(user, PERMISSION_KEYS.COMPANY_ANALYTICS_SALARY) || isCompanyAdminUser(user);
}

function canViewRecruiterAnalytics(user = {}) {
  return (
    hasPermission(user, PERMISSION_KEYS.COMPANY_ANALYTICS_RECRUITER) ||
    canViewGlobalAnalytics(user)
  );
}

function internshipScopeFilter(companyId, user = {}) {
  const filter = { company: companyId, isDeleted: false };
  if (isHrScopedUser(user)) {
    filter.assignedRecruiter = user._id;
  }
  return filter;
}

function applicationScopeFilter(companyId, user = {}) {
  const filter = { companyId };
  if (isHrScopedUser(user)) {
    filter.assignedRecruiter = user._id;
  }
  return filter;
}

function applicantsQueryForInternship(internshipId, companyId, user = {}) {
  return {
    $or: [{ internshipId }, { internship: internshipId }],
    ...applicationScopeFilter(companyId, user)
  };
}

function assertExecutiveAccess(user, message = "Executive company access required") {
  if (isHrScopedUser(user)) {
    throw new AppError(message, 403);
  }
}

function assertCanPostInternships(user) {
  if (!canPostInternships(user)) {
    throw new AppError("HR accounts cannot create internships", 403);
  }
}

function assertCanUpdateCompanyProfile(user) {
  if (!canUpdateCompanyProfile(user)) {
    throw new AppError("HR accounts cannot modify company profile", 403);
  }
}

function resolveEffectiveSidebarModules(user = {}) {
  if (isCompanyAdminUser(user)) return [...ALL_SIDEBAR_MODULE_KEYS];
  if (Array.isArray(user.sidebarModules)) return user.sidebarModules;
  return [...HR_DEFAULT_SIDEBAR_MODULES];
}

function hasSidebarModule(user = {}, moduleKey) {
  return resolveEffectiveSidebarModules(user).includes(moduleKey);
}

function buildListMeta(user = {}) {
  const tier = getAccessTier(user);
  return {
    accessTier: tier,
    dataScope: tier === "hr" ? "assigned_only" : "company_wide",
    companyAccountType: user?.companyAccountType || COMPANY_ACCOUNT_TYPES.OWNER
  };
}

module.exports = {
  getAccessTier,
  isHrScopedUser,
  isCompanyAdminUser,
  isCeoOrOwnerUser,
  canManageHrAccounts,
  hasPermission,
  canManageRecruiters,
  canAssignRecruiters,
  canPostInternships,
  canUpdateCompanyProfile,
  canViewGlobalAnalytics,
  canViewSalaryAnalytics,
  canViewRecruiterAnalytics,
  internshipScopeFilter,
  applicationScopeFilter,
  applicantsQueryForInternship,
  assertExecutiveAccess,
  assertCanPostInternships,
  assertCanUpdateCompanyProfile,
  buildListMeta,
  resolveEffectiveSidebarModules,
  hasSidebarModule
};
