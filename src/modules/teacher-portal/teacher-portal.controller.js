import {
  getTeacherPortalOverview,
  getTeacherClassStudents,
  submitTeacherAttendance,
} from "./teacher-portal.service.js";

/* =========================================
   TEACHER DASHBOARD
========================================= */
export async function getTeacherPortalHandler(req, res) {
  const data = await getTeacherPortalOverview(req.user.id);

  return res.json({
    success: true,
    data,
  });
}

/* =========================================
   CLASS STUDENTS
========================================= */
export async function getTeacherClassStudentsHandler(req, res) {
  const data = await getTeacherClassStudents(
    req.user.id,
    req.params.classId
  );

  return res.json({
    success: true,
    data, // must include { students: [...] }
  });
}

/* =========================================
   SUBMIT ATTENDANCE
========================================= */
export async function submitTeacherAttendanceHandler(req, res) {
  const data = await submitTeacherAttendance(req.user.id, {
    classId: req.body.classId,
    attendance: req.body.attendance,
  });

  return res.json({
    success: true,
    message: "Attendance submitted successfully",
    data,
  });
}