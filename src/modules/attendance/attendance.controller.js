import {
  attendanceQuerySchema,
  markAttendanceSchema,
} from "./attendance.validation.js";

import {
  getAttendanceById,
  getAttendanceByClassAndDate,
  listAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
} from "./attendance.service.js";

// CREATE
export async function markAttendanceHandler(req, res) {
  const parsed = markAttendanceSchema.parse(req.body);
  const data = await markAttendance(parsed, req.user);

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
    data,
  });
}

// LIST
export async function listAttendanceHandler(req, res) {
  const parsed = attendanceQuerySchema.parse(req.query);
  const data = await listAttendance(parsed, req.user);

  const total = data.length;
  const present = data.filter((i) => i.status === "present").length;
  const absent = data.filter((i) => i.status === "absent").length;

  res.json({
    success: true,
    message: "Attendance fetched successfully",
    data: {
      records: data,
      summary: {
        total,
        present,
        absent,
        attendanceRate: total
          ? Math.round((present / total) * 100)
          : 0,
      },
    },
  });
}

// GET ONE
export async function getAttendanceHandler(req, res) {
  const data = await getAttendanceById(req.params.id, req.user);

  res.json({
    success: true,
    message: "Attendance fetched successfully",
    data,
  });
}

// UPDATE
export async function updateAttendanceHandler(req, res) {
  const parsed = markAttendanceSchema.partial().parse(req.body);

  const data = await updateAttendance(
    req.params.id,
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "Attendance updated successfully",
    data,
  });
}

// DELETE
export async function deleteAttendanceHandler(req, res) {
  await deleteAttendance(req.params.id, req.user);

  res.json({
    success: true,
    message: "Attendance deleted successfully",
  });
}

// CLASS + DATE
export async function getAttendanceByClassDateHandler(req, res) {
  const data = await getAttendanceByClassAndDate(
    {
      classId: req.params.classId,
      date: req.params.date,
    },
    req.user
  );

  const total = data.length;
  const present = data.filter((i) => i.status === "present").length;
  const absent = data.filter((i) => i.status === "absent").length;

  res.json({
    success: true,
    message: "Attendance fetched successfully",
    data: {
      records: data,
      summary: {
        total,
        present,
        absent,
        attendanceRate: total
          ? Math.round((present / total) * 100)
          : 0,
      },
    },
  });
}