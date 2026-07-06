const buildTransporter = require("../../../shared/config/mailer");
const { buildEmailFromText } = require("../../../services/email-template.service");
const { NOTIFICATION_TYPES } = require("../../../constants/notification-types");
const { VALIDATION_RULES } = require("../../../constants/validation-rules");
const AppError = require("../../../shared/utils/AppError");
const logger = require("../../../shared/logger");

async function sendOtpEmail({ to, otp }) {
  const subject = "CareerSetu OTP Verification";
  const text = `Your verification code is ${otp}. It expires in ${VALIDATION_RULES.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`;

  const transporter = buildTransporter();
  if (transporter) {
    try {
      const branded = buildEmailFromText({ subject, text, type: NOTIFICATION_TYPES.OTP });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: branded.text,
        html: branded.html
      });
      logger.info("OTP email sent", { to });
      return { delivered: true, devMode: false };
    } catch (error) {
      logger.error("OTP email delivery failed", { to, error: error?.message });
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Unable to send OTP email. Please try again later.", 503);
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new AppError("Email service is not configured. Contact support.", 503);
  }

  // eslint-disable-next-line no-console
  console.log(`[OTP_DEV] ${to} :: code=${otp} (expires in ${VALIDATION_RULES.OTP_EXPIRY_MINUTES} min)`);
  return { delivered: false, devMode: true };
}

module.exports = { sendOtpEmail };
