const User = require("../models/User");
const InternProfile = require("../models/InternProfile");
const CompanyProfile = require("../models/CompanyProfile");
const OtpVerification = require("../models/OtpVerification");
const { USER_ROLES, COMPANY_VERIFICATION_STATUS } = require("../constants/enums");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../services/otp.service");

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

exports.sendInternOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!validateEmail(email)) {
    throw new AppError("Valid email is required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await OtpVerification.findOneAndUpdate(
    { email: normalizedEmail, purpose: "intern_signup" },
    {
      email: normalizedEmail,
      otpHash,
      purpose: "intern_signup",
      verified: false,
      expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000)
    },
    { upsert: true, new: true }
  );

  await sendOtpEmail({ to: normalizedEmail, otp });

  res.json({ message: "OTP sent successfully" });
});

exports.verifyInternOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!validateEmail(email) || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = await OtpVerification.findOne({ email: normalizedEmail, purpose: "intern_signup" });

  if (!record || record.expiresAt < new Date()) {
    throw new AppError("OTP expired or not found", 400);
  }

  if (record.otpHash !== hashOtp(String(otp))) {
    throw new AppError("Invalid OTP", 400);
  }

  record.verified = true;
  await record.save();

  res.json({ message: "OTP verified" });
});

exports.internSignup = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password } = req.body;

  if (!fullName || !validateEmail(email) || !mobile || !password) {
    throw new AppError("fullName, email, mobile and password are required", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: USER_ROLES.INTERN
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

  const token = signToken({ userId: user._id, role: user.role });
  res.status(201).json({ message: "Intern signup successful", token, role: user.role });
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

  if (password.length < 8) {
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
    role: USER_ROLES.COMPANY
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

  const token = signToken({ userId: user._id, role: user.role });

  res.status(201).json({
    message: "Company signup successful. Verification pending.",
    token,
    role: user.role,
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

  const token = signToken({ userId: user._id, role: user.role });
  return { token, role: user.role, userId: user._id };
}

exports.internLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await loginByRole({ email, password, expectedRole: USER_ROLES.INTERN });
  res.json({ message: "Intern login successful", ...data });
});

exports.companyLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await loginByRole({ email, password, expectedRole: USER_ROLES.COMPANY });

  const profile = await CompanyProfile.findOne({ user: data.userId });

  res.json({
    message: "Company login successful",
    token: data.token,
    role: data.role,
    verificationStatus: profile?.verificationStatus || COMPANY_VERIFICATION_STATUS.PENDING
  });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await loginByRole({ email, password, expectedRole: USER_ROLES.ADMIN });
  res.json({ message: "Admin login successful", token: data.token, role: data.role });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
