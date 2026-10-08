import {
  listTimetableService,
} from "./timetable.service.js";

export async function getClassTimetableHandler(
  req,
  res
) {
  const {
    sessionId,
    termId,
    classId,
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

  if (!classId) {
    return res.status(400).json({
      success: false,
      message: "Class is required.",
    });
  }

  const entries = await listTimetableService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
    classId,
    day,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    data: entries,
  });
}
