const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const { isEnabled } = require("../../../shared/config/feature-flags");
const JobAgentPreference = require("../../../models/JobAgentPreference");
const InternProfile = require("../../../models/InternProfile");
const Notification = require("../../../models/Notification");
const { NOTIFICATION_TYPES } = require("../../notifications/constants/notification-types");
const { createInAppNotification } = require("../../notifications/services/in-app-notification.service");
const { discoverExternalJobs } = require("./job-discovery.service");
const { getUnifiedJobFeed } = require("./job-feed.service");

/**
 * Proactive Job Monitoring scheduler (spec 2D). Mirrors the existing
 * interview-scheduler.service.js pattern exactly: a single setInterval
 * registered at process boot (server.js) and cleared on graceful shutdown,
 * so monitoring resumes automatically after a server restart and never
 * depends on a browser being open.
 */

const SWEEP_INTERVAL_MS = PLATFORM_CONFIG.jobAgent.sweepIntervalMs;
const FREQUENCY_WINDOWS_MS = {
  realtime: 0,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000
};

let timer = null;

function jobAlertKey({ userId, source, sourceId }) {
  return `${userId}:${source}:${sourceId}`;
}

// Same batched-Set dedup strategy as interview-workflow.service.js's
// reminderSentKey/alreadySentKeys -- one query for every active user in the
// sweep instead of one query per (user, job) pair, with identical semantics.
async function fetchAlreadySentJobAlertKeys(userIds) {
  if (!userIds.length) return new Set();
  const existing = await Notification.find({
    type: NOTIFICATION_TYPES.JOB_AGENT_NEW_MATCH,
    user: { $in: userIds }
  })
    .select("user metadata.jobSource metadata.jobSourceId")
    .lean();

  return new Set(
    existing.map((doc) =>
      jobAlertKey({
        userId: String(doc.user),
        source: doc.metadata?.jobSource,
        sourceId: doc.metadata?.jobSourceId
      })
    )
  );
}

function isDueForNotification(preference, now) {
  const windowMs = FREQUENCY_WINDOWS_MS[preference.notificationFrequency] ?? 0;
  if (!preference.lastNotifiedAt) return true;
  return now - new Date(preference.lastNotifiedAt).getTime() >= windowMs;
}

async function sweepForPreference(preference, alreadySentKeys, now, minFitScore) {
  const internProfile = await InternProfile.findById(preference.internProfile).lean();
  if (!internProfile) {
    return { matchCount: 0, alertsSent: 0 };
  }

  const { jobs } = await getUnifiedJobFeed({
    internProfile,
    preference,
    filters: {},
    page: 1,
    limit: PLATFORM_CONFIG.jobAgent.maxJobsPerSweep
  });

  const matches = jobs.filter((job) => job.fitScore >= minFitScore);
  let alertsSent = 0;

  // Matches are always computed every sweep (so "new matches since last
  // visit" stays accurate on the dashboard), but whether we actually push a
  // notification for them is gated by the user's own notificationFrequency
  // setting -- realtime notifies every sweep, daily/weekly throttle it.
  if (isDueForNotification(preference, now)) {
    for (const job of matches) {
      const key = jobAlertKey({ userId: String(preference.user), source: job.source, sourceId: job.sourceId });
      if (alreadySentKeys.has(key)) continue;

      await createInAppNotification({
        userId: preference.user,
        type: NOTIFICATION_TYPES.JOB_AGENT_NEW_MATCH,
        title: `New job match: ${job.title}`,
        message: `${job.title}${job.companyName ? ` at ${job.companyName}` : ""} — ${job.fitScore}% fit. ${job.explanation}`.slice(0, 500),
        link: "/dashboard/intern/job-agent",
        metadata: {
          jobSource: job.source,
          jobSourceId: job.sourceId,
          fitScore: job.fitScore
        }
      });

      alreadySentKeys.add(key);
      alertsSent += 1;
    }

    if (alertsSent > 0) {
      await JobAgentPreference.updateOne({ _id: preference._id }, { $set: { lastNotifiedAt: now } });
    }
  }

  return { matchCount: matches.length, alertsSent };
}

/**
 * Runs one full monitoring pass: refreshes the external job cache, then
 * scores + (frequency-gated) alerts every enabled, non-paused agent.
 * Never throws -- a single user's failure or a provider outage is logged
 * and skipped so the rest of the sweep still completes.
 */
async function runSweep() {
  if (!isEnabled("ENABLE_JOB_AGENT") || !PLATFORM_CONFIG.jobAgent.enabled) {
    return { skipped: true, reason: "disabled" };
  }

  const discovery = await discoverExternalJobs().catch((error) => ({
    error: error?.message || String(error),
    providers: []
  }));

  const activePreferences = await JobAgentPreference.find({ enabled: true, pausedAt: null }).lean();
  if (!activePreferences.length) {
    return { discovery, usersProcessed: 0, totalAlerts: 0 };
  }

  const now = Date.now();
  const minFitScore = PLATFORM_CONFIG.jobAgent.minFitScoreForAlert;
  const userIds = activePreferences.map((p) => String(p.user));
  const alreadySentKeys = await fetchAlreadySentJobAlertKeys(userIds);

  let totalAlerts = 0;
  let usersProcessed = 0;

  for (const preference of activePreferences) {
    try {
      const { matchCount, alertsSent } = await sweepForPreference(preference, alreadySentKeys, now, minFitScore);
      await JobAgentPreference.updateOne(
        { _id: preference._id },
        { $set: { lastSweepAt: new Date(now), lastSweepMatchCount: matchCount } }
      );
      totalAlerts += alertsSent;
      usersProcessed += 1;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[job-agent] sweep failed for preference ${preference._id}:`, error.message);
    }
  }

  return { discovery, usersProcessed, totalAlerts };
}

function runSweepSafely() {
  runSweep().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[job-agent] sweep error:", error.message);
  });
}

function start() {
  if (timer) return;
  if (!PLATFORM_CONFIG.jobAgent.enabled) return;

  // Fire one sweep right away instead of waiting a full SWEEP_INTERVAL_MS
  // (default 1h) for the first run -- otherwise the external job cache
  // (and every intern's feed) stays empty for up to an hour after every
  // fresh deploy or restart, which defeats "discovers jobs from day one".
  // Scheduled on the next tick (not called synchronously) so start() itself
  // never blocks server boot on a network call.
  setImmediate(runSweepSafely);

  timer = setInterval(runSweepSafely, SWEEP_INTERVAL_MS);
  timer.unref?.();
}

function stop() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, runSweep, jobAlertKey, isDueForNotification };
