const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

async function listNotifications(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 30)));
  const skip = (page - 1) * limit;
  const unreadOnly = String(req.query.unreadOnly || "false").toLowerCase() === "true";

  const query = { user: req.user._id };
  if (unreadOnly) query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  res.json({ notifications, page, limit, total, unreadCount });
}

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.json({ notification });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: "All notifications marked as read" });
});

module.exports = {
  listNotifications: asyncHandler(listNotifications),
  markNotificationRead,
  markAllNotificationsRead
};
