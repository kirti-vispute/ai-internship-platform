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
  REVIEWED: "reviewed",
  SHORTLISTED: "shortlisted",
  SCREENING: "screening",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  INTERVIEW_COMPLETED: "interview_completed",
  INTERVIEW: "interview",
  SELECTED: "selected",
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
