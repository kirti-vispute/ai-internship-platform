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

module.exports = { requireEmail, requireInternSignup };
