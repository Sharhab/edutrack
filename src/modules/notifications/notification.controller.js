import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.service.js";

export async function listNotificationsHandler(req, res) {
  const data = await listNotifications(req.user);

  res.json({
    success: true,
    message: "Notifications fetched successfully",
    data,
  });
}

export async function markNotificationReadHandler(req, res) {
  const data = await markNotificationRead(req.params.id, req.user);

  res.json({
    success: true,
    message: "Notification marked as read",
    data,
  });
}

export async function markAllNotificationsReadHandler(req, res) {
  const data = await markAllNotificationsRead(req.user);

  res.json({
    success: true,
    message: "All notifications marked as read",
    data,
  });
}