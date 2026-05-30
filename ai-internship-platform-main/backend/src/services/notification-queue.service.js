const { isEnabled } = require("../config/feature-flags");
const buildTransporter = require("../config/mailer");

const pendingJobs = [];
let processing = false;

async function processJob(job) {
  const transporter = buildTransporter();
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log(`[NOTIFICATION_DEV_MODE] ${job.to} :: ${job.subject} :: ${job.text}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: job.to,
    subject: job.subject,
    text: job.text
  });
}

async function flushQueue() {
  if (processing) return;
  processing = true;
  while (pendingJobs.length) {
    const job = pendingJobs.shift();
    try {
      // eslint-disable-next-line no-await-in-loop
      await processJob(job);
    } catch {
      // Queue failures should not crash API requests.
    }
  }
  processing = false;
}

function enqueueNotification(job) {
  if (!isEnabled("ENABLE_NOTIFICATIONS")) return;
  pendingJobs.push(job);
  setImmediate(flushQueue);
}

module.exports = { enqueueNotification };
