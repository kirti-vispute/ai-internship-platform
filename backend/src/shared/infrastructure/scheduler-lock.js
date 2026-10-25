const mongoose = require("mongoose");
const crypto = require("crypto");
const logger = require("../logger");

// Distributed lock so a periodic sweep (interview no-show/reminders, job-agent
// discovery) runs on exactly one backend instance per tick, even when the
// deployment scales to multiple instances sharing the same MongoDB.
// findOneAndUpdate's filter + upsert is atomic: only one concurrent caller
// can match-or-insert the document for a given `name`, so this needs no
// separate transaction.

const schedulerLockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    lockedUntil: { type: Date, required: true },
    owner: { type: String, required: true }
  },
  { collection: "scheduler_locks" }
);

const SchedulerLock =
  mongoose.models.SchedulerLock || mongoose.model("SchedulerLock", schedulerLockSchema);

const instanceId = `${process.pid}:${crypto.randomBytes(4).toString("hex")}`;

async function withSchedulerLock(name, ttlMs, fn) {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ttlMs);

  let acquired;
  try {
    acquired = await SchedulerLock.findOneAndUpdate(
      { name, lockedUntil: { $lte: now } },
      { $set: { lockedUntil, owner: instanceId } },
      { upsert: true, new: true }
    );
  } catch (error) {
    // Duplicate-key race (another instance inserted/renewed first) means we
    // lost the lock for this tick -- that is expected, not a failure.
    if (error && error.code === 11000) return { ran: false };
    logger.error(`[scheduler-lock] ${name} acquire failed:`, error && error.message ? error.message : error);
    return { ran: false };
  }

  if (!acquired || acquired.owner !== instanceId) {
    return { ran: false };
  }

  try {
    const result = await fn();
    return { ran: true, result };
  } finally {
    await SchedulerLock.updateOne(
      { name, owner: instanceId },
      { $set: { lockedUntil: now } }
    ).catch(() => {});
  }
}

module.exports = { withSchedulerLock };
