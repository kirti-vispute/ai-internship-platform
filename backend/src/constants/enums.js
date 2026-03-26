const USER_ROLES = {
  INTERN: "intern",
  COMPANY: "company",
  ADMIN: "admin"
};

const COMPANY_VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected"
};

const APPLICATION_STATUS = {
  APPLIED: "applied",
  SHORTLISTED: "shortlisted",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFERED: "offered",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn"
};

const REPORTED_COMPANY_STATUS = {
  OPEN: "open",
  RESOLVED: "resolved"
};

module.exports = {
  USER_ROLES,
  COMPANY_VERIFICATION_STATUS,
  APPLICATION_STATUS,
  REPORTED_COMPANY_STATUS
};
