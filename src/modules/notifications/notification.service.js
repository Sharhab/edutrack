import { Notification } from "./notification.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function listNotifications(user) {
  return Notification.find({ userId: user._id }).sort({ createdAt: -1 });
}

export async function markNotificationRead(id, user) {
  const doc = await Notification.findOne({ _id: id, userId: user._id });

  if (!doc) {
    throw new ApiError(404, "Notification not found");
  }

  doc.isRead = true;
  await doc.save();

  return doc;
}

export async function markAllNotificationsRead(user) {
  await Notification.updateMany(
    { userId: user._id, isRead: false },
    { isRead: true }
  );

  return { updated: true };
}

export async function createNotification(payload) {
  return Notification.create(payload);
}