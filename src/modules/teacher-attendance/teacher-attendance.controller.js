
import {
  teacherClockInSchema,
  teacherClockOutSchema,
  teacherAttendanceQuerySchema,
} from "./teacher-attendance.validation.js";

import {
  clockInTeacher,
  clockOutTeacher,
  getMyTeacherAttendance,
  listTeacherAttendance,
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

// ADMIN: VIEW SCHOOL TEACHER ATTENDANCE
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
