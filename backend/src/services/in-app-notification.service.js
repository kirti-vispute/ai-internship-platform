const Notification = require("../models/Notification");
const InternProfile = require("../models/InternProfile");
const { NOTIFICATION_TYPES } = require("../constants/notification-types");

async function createInAppNotification({ userId, type, title, message = "", link = "", metadata = null }) {
  if (!userId || !title) return null;
  return Notification.create({
    user: userId,
    type: type || NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED,
    title,
    message,
    link,
    metadata
  });
}

async function notifyInternByProfileId(internProfileId, payload) {
  const profile = await InternProfile.findById(internProfileId).select("user");
  if (!profile?.user) return null;
  return createInAppNotification({ userId: profile.user, ...payload });
}

module.exports = {
  createInAppNotification,
  notifyInternByProfileId
};
