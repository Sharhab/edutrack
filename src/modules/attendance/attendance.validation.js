// modules/attendance/attendance.validation.js

import { z } from "zod";

// ================= CREATE / MARK =================

export const markAttendanceSchema = z.object({
  classId: z
    .string()
    .min(1, "Class is required"),

  sessionId: z
    .string()
    .min(1, "Session is required"),

  termId: z
    .string()
    .min(1, "Term is required"),

  date: z
    .string()
    .min(1, "Date is required"),

  records: z
    .array(
      z.object({
        studentId: z
          .string()
          .min(1, "Student is required"),

        status: z.enum([
          "present",
          "absent",
          "late",
        ]),
      })
    )
    .min(1, "Attendance records are required"),
});

// ================= UPDATE =================

export const updateAttendanceSchema = z.object({
  studentId: z.string().optional(),

  classId: z.string().optional(),

  sessionId: z.string().optional(),

  termId: z.string().optional(),

  date: z.string().optional(),

  status: z
    .enum([
      "present",
      "absent",
      "late",
    ])
    .optional(),
});

// ================= QUERY =================

export const attendanceQuerySchema = z.object({
  classId: z.string().optional(),

  studentId: z.string().optional(),

  date: z.string().optional(),
});