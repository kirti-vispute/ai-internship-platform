const { sendNotificationEmail } = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../constants/notification-types");

async function sendOtpEmail({ to, otp }) {
  sendNotificationEmail({
    to,
    subject: "CareerSetu OTP Verification",
    text: `Your OTP is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    type: NOTIFICATION_TYPES.OTP
  });
}

module.exports = { sendOtpEmail };
