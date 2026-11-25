
import {
  teacherClockInSchema,
  teacherClockOutSchema,
  teacherAttendanceQuerySchema,
  correctTeacherAttendanceSchema,
} from "./teacher-attendance.validation.js";

import {
  clockInTeacher,
  clockOutTeacher,
  getMyTeacherAttendance,
  listTeacherAttendance,
  getTeacherAttendanceDashboard,
  correctTeacherAttendance,
} from "./teacher-attendance.service.js";

// TEACHER CLOCK IN
export async function clockInHandler(req, res) {
  const parsed = teacherClockInSchema.parse(req.body);

  const data = await clockInTeacher(parsed, req.user);

  res.status(201).json({
    success: true,
    message: "Clock-in recorded successfully",
    data,
  });
}

// TEACHER CLOCK OUT
export async function clockOutHandler(req, res) {
  const parsed = teacherClockOutSchema.parse(req.body);

  const data = await clockOutTeacher(parsed, req.user);

  res.json({
    success: true,
    message: "Clock-out recorded successfully",
    data,
  });
}

// TEACHER: VIEW OWN ATTENDANCE
export async function myAttendanceHandler(req, res) {
  const parsed = teacherAttendanceQuerySchema.parse(req.query);

  const data = await getMyTeacherAttendance(
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "Your attendance fetched successfully",
    data,
  });
}

// ADMIN: VIEW SCHOOL ATTENDANCE LIST
export async function listTeacherAttendanceHandler(req, res) {
  const parsed = teacherAttendanceQuerySchema.parse(req.query);

  const data = await listTeacherAttendance(
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "Teacher attendance fetched successfully",
    data,
  });
}

// ADMIN: STAFF ATTENDANCE DASHBOARD
export async function teacherAttendanceDashboardHandler(req, res) {
  const parsed = teacherAttendanceQuerySchema.parse(req.query);

  const data = await getTeacherAttendanceDashboard(
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "Staff attendance dashboard fetched successfully",
    data,
  });
}
export async function correctTeacherAttendanceHandler(req, res) {
  const parsed = correctTeacherAttendanceSchema.parse(req.body);

  const data = await correctTeacherAttendance(
    req.params.teacherId,
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "Teacher attendance updated successfully",
    data,
  });
}
