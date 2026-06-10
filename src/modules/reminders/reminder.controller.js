import { Reminder } from "./reminder.model.js";

/**
 * LIST REMINDERS
 */
export async function listRemindersHandler(req, res) {
  const data = await Reminder.find({
    schoolId: req.user.schoolId,
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data,
  });
}