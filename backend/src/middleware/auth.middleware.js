const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");
const { ADMIN_ROLES, COMPANY_ACCOUNT_TYPES } = require("../constants/enums");
const { ROLE_PERMISSIONS, PERMISSION_KEYS } = require("../constants/roles");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const cookieToken = req.cookies?.accessToken || null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select(
      "_id email role adminRole permissions companyAccountType companyProfileRef isActive"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized: invalid user" });
    }

    if (user.role === "admin" && (!Array.isArray(user.permissions) || user.permissions.length === 0)) {
      const normalizedAdminRole = user.adminRole || ADMIN_ROLES.SUPER_ADMIN;
      user.adminRole = normalizedAdminRole;
      user.permissions = ROLE_PERMISSIONS[normalizedAdminRole] || [];
    }
    if (user.role === "company") {
      const accountType = user.companyAccountType || COMPANY_ACCOUNT_TYPES.OWNER;
      user.companyAccountType = accountType;
      if (accountType === COMPANY_ACCOUNT_TYPES.HR) {
        user.permissions = [
          PERMISSION_KEYS.PROFILE_READ,
          PERMISSION_KEYS.APPLICATION_REVIEW,
          PERMISSION_KEYS.PIPELINE_UPDATE,
          PERMISSION_KEYS.FEEDBACK_WRITE,
          PERMISSION_KEYS.COMPANY_ASSIGNED_SCOPE,
          PERMISSION_KEYS.COMPANY_ANALYTICS_RECRUITER
        ];
      } else {
        user.permissions = ROLE_PERMISSIONS.company || [];
      }
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}

module.exports = authMiddleware;
