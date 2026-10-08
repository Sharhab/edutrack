import { Student } from "../students/student.model.js";
import { listTimetableService } from "./timetable.service.js";

export async function getStudentTimetableHandler(req, res) {
  const { sessionId, termId, day } = req.query;

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

  const student = await Student.findOne({
    userId: req.user._id,
    schoolId: req.user.schoolId,
    isActive: true,
  }).select("_id classId firstName lastName admissionNumber");

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student profile was not found.",
    });
  }

  if (!student.classId) {
    return res.status(400).json({
      success: false,
      message: "No class has been assigned to this student.",
    });
  }

  const entries = await listTimetableService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
    classId: student.classId,
    day,
    isActive: true,
  });

  return res.status(200).json({
    success: true,
    data: entries,
  });
}
