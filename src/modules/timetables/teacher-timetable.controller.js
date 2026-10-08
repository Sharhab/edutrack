import {
  listTimetableService,
} from "./timetable.service.js";

export async function getTeacherTimetableHandler(
  req,
  res
) {
  const {
    sessionId,
    termId,
    day,
  } = req.query;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "Session is required.",
    });
  }

  if (!termId) {
    return res.status(400).json({
      success: false,
      message: "Term is required.",
    });
  }

  const entries = await listTimetableService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
    teacherId: req.user._id,
    day,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    data: entries,
  });
}
