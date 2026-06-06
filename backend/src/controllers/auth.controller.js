const User = require("../models/User");
const InternProfile = require("../models/InternProfile");
const CompanyProfile = require("../models/CompanyProfile");
const OtpVerification = require("../models/OtpVerification");
const crypto = require("crypto");
const { USER_ROLES, COMPANY_VERIFICATION_STATUS, ADMIN_ROLES } = require("../constants/enums");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../utils/jwt");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../services/otp.service");
const { VALIDATION_RULES } = require("../constants/validation-rules");
const { logActivity } = require("../services/activity-log.service");

const ACCESS_COOKIE_KEY = "accessToken";
const REFRESH_COOKIE_KEY = "refreshToken";

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function parseDurationToMs(durationValue, fallbackMs) {
  const value = String(durationValue || "").trim();
  if (!value) return fallbackMs;
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = String(match[2]).toLowerCase();
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * map[unit];
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";
  const accessMaxAge = parseDurationToMs(process.env.JWT_EXPIRES_IN, 15 * 60 * 1000);
  const refreshMaxAge = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);

  res.cookie(ACCESS_COOKIE_KEY, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: accessMaxAge
  });

  res.cookie(REFRESH_COOKIE_KEY, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: refreshMaxAge
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_KEY);
  res.clearCookie(REFRESH_COOKIE_KEY);
}

async function issueSession({ user, req, res }) {
  const payload = { userId: user._id, role: user.role, adminRole: user.adminRole || null };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000));
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip || "";
  await user.save();

  setAuthCookies(res, { accessToken, refreshToken });
  await logActivity({
    actorUser: user._id,
    actorRole: user.role,
    entityType: "auth",
    entityId: user._id,
    action: "user_login",
    metadata: { role: user.role, adminRole: user.adminRole || null },
    ipAddress: req.ip
  });

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    role: user.role,
    adminRole: user.adminRole || null,
    permissions: user.permissions || []
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

async function upsertOtp({ email, purpose, otp }) {
  return OtpVerification.findOneAndUpdate(
    { email, purpose },
    {
      email,
      otpHash: hashOtp(otp),
      purpose,
      verified: false,
      expiresAt: new Date(Date.now() + VALIDATION_RULES.OTP_EXPIRY_MINUTES * 60 * 1000)
    },
    { upsert: true, new: true }
  );
}

async function verifyOtpRecord({ email, otp, purpose }) {
  const record = await OtpVerification.findOne({ email, purpose });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError("OTP expired or not found", 400);
  }
  if (record.otpHash !== hashOtp(String(otp))) {
    throw new AppError("Invalid OTP", 400);
  }
  record.verified = true;
  await record.save();
  return record;
}

exports.sendInternOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!validateEmail(email)) {
    throw new AppError("Valid email is required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  await upsertOtp({ email: normalizedEmail, purpose: "intern_signup", otp });

  await sendOtpEmail({ to: normalizedEmail, otp });

  res.json({ message: "OTP sent successfully" });
});

exports.verifyInternOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!validateEmail(email) || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  await verifyOtpRecord({ email: normalizedEmail, otp, purpose: "intern_signup" });

  res.json({ message: "OTP verified" });
});

exports.internSignup = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password } = req.body;

  if (!fullName || !validateEmail(email) || !mobile || !password) {
    throw new AppError("fullName, email, mobile and password are required", 400);
  }

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const otpRecord = await OtpVerification.findOne({ email: normalizedEmail, purpose: "intern_signup" });
  if (!otpRecord || !otpRecord.verified) {
    throw new AppError("Please verify OTP before signup", 400);
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: USER_ROLES.INTERN,
    emailVerified: true
  });

  await InternProfile.create({
    user: user._id,
    fullName,
    email: normalizedEmail,
    mobile,
    skills: [],
    education: [],
    projects: [],
    certifications: [],
    interests: [],
    completedCourses: []
  });

  const session = await issueSession({ user, req, res });
  res.status(201).json({ message: "Intern signup successful", ...session });
});

exports.companySignup = asyncHandler(async (req, res) => {
  const {
    companyName,
    companyEmail,
    gst,
    contactName,
    phone,
    website,
    address,
    description,
    password
  } = req.body;

  if (!companyName || !validateEmail(companyEmail) || !gst || !contactName || !phone || !address || !description || !password) {
    throw new AppError("All required company fields must be provided", 400);
  }

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const normalizedEmail = companyEmail.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("Company email already registered", 409);
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: USER_ROLES.COMPANY,
    emailVerified: false
  });

  await CompanyProfile.create({
    user: user._id,
    companyName,
    companyEmail: normalizedEmail,
    gst,
    contactName,
    phone,
    website,
    address,
    description,
    verificationStatus: COMPANY_VERIFICATION_STATUS.PENDING
  });

  const session = await issueSession({ user, req, res });

  res.status(201).json({
    message: "Company signup successful. Verification pending.",
    ...session,
    verificationStatus: COMPANY_VERIFICATION_STATUS.PENDING
  });
});

async function loginByRole({ email, password, expectedRole }) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, role: expectedRole });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const valid = await comparePassword(password || "", user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isActive || user.isDeleted) {
    throw new AppError("Account is disabled. Contact support.", 403);
  }

  return { user };
}

exports.internLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user } = await loginByRole({ email, password, expectedRole: USER_ROLES.INTERN });
  const session = await issueSession({ user, req, res });
  res.json({ message: "Intern login successful", ...session });
});

exports.companyLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user } = await loginByRole({ email, password, expectedRole: USER_ROLES.COMPANY });

  let profile = null;
  if (user.companyProfileRef) {
    profile = await CompanyProfile.findById(user.companyProfileRef);
  }
  if (!profile) {
    profile = await CompanyProfile.findOne({ user: user._id });
  }
  const session = await issueSession({ user, req, res });

  res.json({
    message: "Company login successful",
    ...session,
    companyAccountType: user.companyAccountType || "owner",
    verificationStatus: profile?.verificationStatus || COMPANY_VERIFICATION_STATUS.PENDING
  });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const { user } = await loginByRole({ email, password, expectedRole: USER_ROLES.ADMIN });

  if (!user.adminRole) {
    user.adminRole = ADMIN_ROLES.SUPER_ADMIN;
  }

  const session = await issueSession({ user, req, res });
  res.json({ message: "Admin login successful", ...session });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.refreshSession = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_KEY] || req.body?.refreshToken;
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401);
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);
  if (!user || !user.isActive || user.isDeleted) {
    throw new AppError("Invalid refresh session", 401);
  }

  if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError("Refresh token is not valid", 401);
  }

  if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
    throw new AppError("Refresh token expired", 401);
  }

  const session = await issueSession({ user, req, res });
  res.json({ message: "Session refreshed", ...session });
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_KEY] || req.body?.refreshToken;
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.userId);
      if (user) {
        user.refreshTokenHash = "";
        user.refreshTokenExpiresAt = null;
        await user.save();
      }
    } catch {
      // Best-effort logout.
    }
  }

  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

exports.sendPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!validateEmail(email)) throw new AppError("Valid email is required", 400);
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("User not found", 404);
  const otp = generateOtp();
  await upsertOtp({ email: normalizedEmail, purpose: "password_reset", otp });
  await sendOtpEmail({ to: normalizedEmail, otp });
  res.json({ message: "Password reset OTP sent" });
});

exports.resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body || {};
  if (!validateEmail(email) || !otp || !newPassword) throw new AppError("email, otp and newPassword are required", 400);
  if (newPassword.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) throw new AppError("Password must be at least 8 characters", 400);
  const normalizedEmail = email.toLowerCase().trim();
  await verifyOtpRecord({ email: normalizedEmail, otp, purpose: "password_reset" });
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("User not found", 404);
  user.passwordHash = await hashPassword(newPassword);
  user.refreshTokenHash = "";
  user.refreshTokenExpiresAt = null;
  await user.save();
  res.json({ message: "Password reset successful" });
});
