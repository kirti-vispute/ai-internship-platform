const NOTIFICATION_TYPES = Object.freeze({
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_RECEIVED: "application_received",
  APPLICATION_STATUS_CHANGED: "application_status_changed",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  INTERVIEW_REMINDER: "interview_reminder",
  FEEDBACK_ADDED: "feedback_added",
  PROFILE_REMINDER: "profile_reminder",
  OTP: "otp",
  CHAT_MESSAGE: "chat_message"
});

module.exports = { NOTIFICATION_TYPES };
