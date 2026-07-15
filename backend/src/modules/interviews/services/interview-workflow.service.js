const CompanyProfile = require("../../../models/CompanyProfile");
const InternProfile = require("../../../models/InternProfile");
const Application = require("../../../models/Application");
const Notification = require("../../../models/Notification");
const ChatConversation = require("../../../models/ChatConversation");
const ChatMessage = require("../../../models/ChatMessage");
const { NOTIFICATION_TYPES } = require("../../../constants/notification-types");
const { notifyInternByProfileId, createInAppNotification } = require("../../../services/in-app-notification.service");
const { isEnabled } = require("../../../shared/config/feature-flags");

const REMINDER_WINDOWS = [
  { key: "24h", offsetMs: 24 * 60 * 60 * 1000, label: "24 hours" },
  { key: "1h", offsetMs: 60 * 60 * 1000, label: "1 hour" },
  { key: "15m", offsetMs: 15 * 60 * 1000, label: "15 minutes" }
];

function toInAppInterviewLink(interviewRoomLink) {
  if (!interviewRoomLink) return "/dashboard/intern/interviews";
  const match = String(interviewRoomLink).match(/\/interview\/([^/?#]+)/i);
  if (match?.[1]) return `/interview/${match[1]}`;
  if (String(interviewRoomLink).startsWith("/")) return interviewRoomLink;
  return "/dashboard/intern/interviews";
}

function parseInterviewDateTime(interviewDate, interviewTime) {
  if (!interviewDate) return null;
  const datePart = interviewDate instanceof Date ? interviewDate.toISOString().slice(0, 10) : String(interviewDate).slice(0, 10);
  const timePart = String(interviewTime || "09:00").slice(0, 5);
  const parsed = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatInterviewScheduleMessage({ role, companyName, interviewDate, interviewTime, roundType }) {
  const when = formatReadableDateTime(interviewDate, interviewTime);
  const typeLabel = String(roundType || "Interview").replace(/_/g, " ");
  return `Your interview for ${role} at ${companyName} has been scheduled for ${when}. (${typeLabel})`;
}

function formatReadableDateTime(interviewDate, interviewTime) {
  const parsed = parseInterviewDateTime(interviewDate, interviewTime);
  if (!parsed) return "the scheduled time";
  const dateLabel = parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeLabel = parsed.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
  return `${dateLabel} at ${timeLabel}`;
}

async function findOrCreateConversationForApplication(application) {
  if (!isEnabled("ENABLE_CHAT")) return null;

  const internProfile = await InternProfile.findById(application.internId || application.intern).select("user").lean();
  if (!internProfile?.user) return null;

  let conversation = await ChatConversation.findOne({
    internProfile: internProfile._id,
    company: application.companyId || application.company
  });

  if (!conversation) {
    conversation = await ChatConversation.create({
      internProfile: internProfile._id,
      internUser: internProfile.user,
      company: application.companyId || application.company,
      application: application._id,
      lastMessageAt: new Date()
    });
  }

  return conversation;
}

async function sendAutomatedRecruiterChatMessage({ application, companyUserId, body }) {
  if (!isEnabled("ENABLE_CHAT") || !body?.trim() || !companyUserId) return null;

  const conversation = await findOrCreateConversationForApplication(application);
  if (!conversation || !companyUserId) return null;

  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: companyUserId,
    senderRole: "company",
    body: body.trim()
  });

  conversation.lastMessageText = body.trim().slice(0, 500);
  conversation.lastMessageAt = message.createdAt;
  conversation.lastSenderRole = "company";
  conversation.unreadIntern += 1;
  await conversation.save();

  return { conversation, message };
}

async function notifyInterviewScheduled({
  application,
  round,
  companyUserId,
  interviewRoomLink
}) {
  const populated = await Application.findById(application._id)
    .populate("internship", "role")
    .populate("company", "companyName")
    .lean();

  const role = populated?.internship?.role || "Internship";
  const companyName = populated?.company?.companyName || "the company";
  const detailsLink = toInAppInterviewLink(interviewRoomLink);
  const message = formatInterviewScheduleMessage({
    role,
    companyName,
    interviewDate: round.interviewDate,
    interviewTime: round.interviewTime,
    roundType: round.roundType
  });

  await notifyInternByProfileId(application.internId || application.intern, {
    type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
    title: "Interview scheduled",
    message,
    link: detailsLink,
    metadata: {
      applicationId: application._id,
      roundId: round._id,
      interviewDate: round.interviewDate,
      interviewTime: round.interviewTime,
      roundType: round.roundType,
      roomLink: interviewRoomLink || null,
      actionLabel: "View Interview Details"
    }
  });

  const chatBody = `${message}\n\nView Interview Details: ${detailsLink}`;
  await sendAutomatedRecruiterChatMessage({
    application,
    companyUserId,
    body: chatBody
  });

  return message;
}

async function notifyInterviewUpdated({
  application,
  round,
  companyUserId,
  changeType = "updated",
  interviewRoomLink
}) {
  const populated = await Application.findById(application._id)
    .populate("internship", "role")
    .populate("company", "companyName")
    .lean();

  const role = populated?.internship?.role || "Internship";
  const companyName = populated?.company?.companyName || "the company";
  const when = formatReadableDateTime(round.interviewDate, round.interviewTime);
  const detailsLink = toInAppInterviewLink(interviewRoomLink);

  let title = "Interview updated";
  let message = `Your interview for ${role} at ${companyName} has been updated (${when}).`;

  if (changeType === "rescheduled") {
    title = "Interview rescheduled";
    message = `Your ${round.roundType || "interview"} for ${role} at ${companyName} has been rescheduled to ${when}.`;
  } else if (changeType === "cancelled") {
    title = "Interview cancelled";
    message = `Your ${round.roundType || "interview"} for ${role} at ${companyName} scheduled for ${when} has been cancelled.`;
  } else if (changeType === "completed") {
    title = "Interview completed";
    message = `Your ${round.roundType || "interview"} for ${role} at ${companyName} has been marked completed.`;
  }

  await notifyInternByProfileId(application.internId || application.intern, {
    type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
    title,
    message,
    link: changeType === "cancelled" ? "/dashboard/intern/interviews" : detailsLink,
    metadata: {
      applicationId: application._id,
      roundId: round._id,
      interviewDate: round.interviewDate,
      interviewTime: round.interviewTime,
      roundType: round.roundType,
      changeType,
      roomLink: interviewRoomLink || null,
      actionLabel: "View Interview Details"
    }
  });

  await sendAutomatedRecruiterChatMessage({
    application,
    companyUserId,
    body: `${message}\n\nView Interview Details: ${detailsLink}`
  });
}

async function reminderAlreadySent({ userId, applicationId, roundId, reminderKey }) {
  const existing = await Notification.findOne({
    user: userId,
    type: NOTIFICATION_TYPES.INTERVIEW_REMINDER,
    "metadata.applicationId": applicationId,
    "metadata.roundId": String(roundId),
    "metadata.reminderKey": reminderKey
  })
    .select("_id")
    .lean();
  return Boolean(existing);
}

async function processInterviewRemindersForIntern(internProfileId) {
  const profile = await InternProfile.findById(internProfileId).select("user").lean();
  if (!profile?.user) return { sent: 0 };

  const applications = await Application.find({
    internId: internProfileId,
    "interviewRounds.0": { $exists: true }
  })
    .populate("internship", "role")
    .populate("company", "companyName")
    .lean();

  const now = Date.now();
  let sent = 0;

  for (const application of applications) {
    const role = application.internship?.role || "Internship";
    const companyName = application.company?.companyName || "Company";

    for (const round of application.interviewRounds || []) {
      if (!round || !["scheduled"].includes(String(round.status || "").toLowerCase())) continue;

      const start = parseInterviewDateTime(round.interviewDate, round.interviewTime);
      if (!start) continue;

      const delta = start.getTime() - now;
      if (delta <= 0) continue;

      for (const window of REMINDER_WINDOWS) {
        const withinWindow = delta <= window.offsetMs && delta > window.offsetMs - 5 * 60 * 1000;
        if (!withinWindow) continue;

        const alreadySent = await reminderAlreadySent({
          userId: profile.user,
          applicationId: application._id,
          roundId: round._id,
          reminderKey: window.key
        });
        if (alreadySent) continue;

        const when = formatReadableDateTime(round.interviewDate, round.interviewTime);
        const message = `Reminder: Your ${round.roundType || "interview"} for ${role} at ${companyName} starts in ${window.label} (${when}).`;

        await createInAppNotification({
          userId: profile.user,
          type: NOTIFICATION_TYPES.INTERVIEW_REMINDER,
          title: `Interview in ${window.label}`,
          message,
          link: "/dashboard/intern/interviews",
          metadata: {
            applicationId: application._id,
            roundId: String(round._id),
            reminderKey: window.key,
            interviewDate: round.interviewDate,
            interviewTime: round.interviewTime,
            actionLabel: "View Interview Details"
          }
        });

        sent += 1;
      }
    }
  }

  return { sent };
}

function serializeInternInterview(application, round, roundIndex) {
  const role = application.internship?.role || "Internship";
  const companyName = application.company?.companyName || "Company";
  const interviewDate = round.interviewDate;
  const interviewTime = round.interviewTime || "";
  const start = parseInterviewDateTime(interviewDate, interviewTime);
  const now = Date.now();
  const appStatus = String(application.status || "").toLowerCase();
  let interviewStatus = "scheduled";

  if (appStatus === "rejected" || appStatus === "withdrawn") {
    interviewStatus = "cancelled";
  } else if (["completed", "cleared"].includes(String(round.status || "").toLowerCase())) {
    interviewStatus = "completed";
  } else if (String(round.status || "").toLowerCase() === "rejected") {
    interviewStatus = "cancelled";
  } else if (start) {
    const startMs = start.getTime();
    if (now >= startMs && now <= startMs + 60 * 60 * 1000) interviewStatus = "in_progress";
    else if (now < startMs && startMs - now <= 24 * 60 * 60 * 1000) interviewStatus = "upcoming";
  }

  return {
    interviewId: String(round._id || `${application._id}-${roundIndex}`),
    applicationId: String(application._id),
    companyId: String(application.companyId || application.company || ""),
    roleId: String(application.internshipId || application.internship?._id || ""),
    companyName,
    role,
    interviewDate: interviewDate ? new Date(interviewDate).toISOString() : "",
    interviewTime,
    interviewType: round.roundType || "Interview",
    interviewStatus,
    meetingLink: round.meetingLink || "",
    roomId: (() => {
      const match = String(round.meetingLink || "").match(/\/interview\/([^/?#]+)/i);
      return match?.[1] || null;
    })(),
    mode: round.mode || "",
    notes: round.notes || ""
  };
}

async function listInternInterviews(internProfileId) {
  const applications = await Application.find({
    internId: internProfileId,
    "interviewRounds.0": { $exists: true }
  })
    .populate("internship", "role")
    .populate("company", "companyName")
    .sort({ updatedAt: -1 });

  const interviews = [];
  applications.forEach((application) => {
    (application.interviewRounds || []).forEach((round, index) => {
      interviews.push(serializeInternInterview(application, round, index));
    });
  });

  interviews.sort(
    (a, b) =>
      (parseInterviewDateTime(a.interviewDate, a.interviewTime)?.getTime() || 0) -
      (parseInterviewDateTime(b.interviewDate, b.interviewTime)?.getTime() || 0)
  );

  return interviews;
}

module.exports = {
  formatInterviewScheduleMessage,
  notifyInterviewScheduled,
  notifyInterviewUpdated,
  processInterviewRemindersForIntern,
  listInternInterviews
};
