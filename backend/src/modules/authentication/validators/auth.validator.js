function requireEmail(req) {
  const email = String(req.body?.email || "").trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return { valid, message: valid ? "" : "Valid email is required" };
}

function requireInternSignup(req) {
  const { fullName, email, mobile, password } = req.body || {};
  const valid = Boolean(fullName && email && mobile && password);
  return { valid, message: valid ? "" : "fullName, email, mobile and password are required" };
}

function requireOtpVerify(req) {
  const email = String(req.body?.email || "").trim();
  const otp = String(req.body?.otp || "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validOtp = /^\d{6}$/.test(otp);
  return {
    valid: validEmail && validOtp,
    message: !validEmail ? "Valid email is required" : !validOtp ? "Enter the 6-digit OTP" : ""
  };
}

function requirePasswordReset(req) {
  const email = String(req.body?.email || "").trim();
  const otp = String(req.body?.otp || "").trim();
  const newPassword = String(req.body?.newPassword || "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validOtp = /^\d{6}$/.test(otp);
  const validPassword = newPassword.length >= 8;
  return {
    valid: validEmail && validOtp && validPassword,
    message: !validEmail
      ? "Valid email is required"
      : !validOtp
        ? "Enter the 6-digit OTP"
        : !validPassword
          ? "Password must be at least 8 characters"
          : ""
  };
}

module.exports = { requireEmail, requireInternSignup, requireOtpVerify, requirePasswordReset };
