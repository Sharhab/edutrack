import { Parent } from "../parents/parent.model.js";
import { Student } from "../students/student.model.js";
import { listTimetableService } from "./timetable.service.js";

export async function getParentStudentsHandler(req, res) {
  const parent = await Parent.findOne({
    userId: req.user._id,
    schoolId: req.user.schoolId,
  })
    .populate(
      "studentIds",
      "firstName lastName admissionNumber classId"
    )
    .lean();

  if (!parent) {
    return res.status(404).json({
      success: false,
      message: "Parent profile was not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: parent.studentIds || [],
  });
}

export async function getParentTimetableHandler(req, res) {
  const { sessionId, termId, studentId, day } = req.query;

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

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student is required.",
    });
  }

  /*
   * First verify that this student actually belongs
   * to the authenticated parent.
   */
  const parent = await Parent.findOne({
    userId: req.user._id,
    schoolId: req.user.schoolId,
    studentIds: studentId,
  }).select("_id");

  if (!parent) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view this student's timetable.",
    });
  }

  const student = await Student.findOne({
    _id: studentId,
    schoolId: req.user.schoolId,
    isActive: true,
  }).select("_id classId firstName lastName admissionNumber");

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student was not found.",
    });
  }

  if (!student.classId) {
    return res.status(400).json({
      success: false,
      message: "This student has not been assigned to a class.",
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
