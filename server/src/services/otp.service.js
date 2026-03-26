const buildTransporter = require("../config/mailer");

async function sendOtpEmail({ to, otp }) {
  const transporter = buildTransporter();

  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log(`[OTP_DEV_MODE] OTP for ${to}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "InternAI OTP Verification",
    text: `Your OTP is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`
  });
}

module.exports = { sendOtpEmail };
