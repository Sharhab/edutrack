
import {
  attendanceQuerySchema,
  markAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.validation.js";

import {
  getAttendanceById,
  getAttendanceByClassAndDate,
  listAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
} from "./attendance.service.js";

// CREATE / MARK ATTENDANCE
export async function markAttendanceHandler(req, res) {
  const parsed = markAttendanceSchema.parse(req.body);
  const data = await markAttendance(parsed, req.user);

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
    data,
  });
}

// LIST ATTENDANCE
export async function listAttendanceHandler(req, res) {
  const parsed = attendanceQuerySchema.parse(req.query);
  const data = await listAttendance(parsed, req.user);

  const total = data.length;
  const present = data.filter((item) => item.status === "present").length;
  const absent = data.filter((item) => item.status === "absent").length;
  const late = data.filter((item) => item.status === "late").length;

  res.json({
    success: true,
    message: "Attendance fetched successfully",
    data: {
      records: data,
      summary: {
        total,
        present,
        absent,
        late,
        attendanceRate: total
          ? Math.round((present / total) * 100)
          : 0,
      },
    },
  });
}

// GET ONE ATTENDANCE RECORD
export async function getAttendanceHandler(req, res) {
  const data = await getAttendanceById(req.params.id, req.user);

  res.json({
    success: true,
    message: "Attendance fetched successfully",
    data,
  });
}

// UPDATE ATTENDANCE
export async function updateAttendanceHandler(req, res) {
  const parsed = updateAttendanceSchema.parse(req.body);

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

// DELETE ATTENDANCE
export async function deleteAttendanceHandler(req, res) {
  await deleteAttendance(req.params.id, req.user);

  res.json({
    success: true,
    message: "Attendance deleted successfully",
  });
}

// GET ATTENDANCE BY CLASS AND DATE
export async function getAttendanceByClassDateHandler(req, res) {
  const data = await getAttendanceByClassAndDate(
    {
      classId: req.params.classId,
      date: req.params.date,
    },
    req.user
  );

  const total = data.length;
  const present = data.filter((item) => item.status === "present").length;
  const absent = data.filter((item) => item.status === "absent").length;
  const late = data.filter((item) => item.status === "late").length;

  res.json({
    success: true,
    message: "Attendance fetched successfully",
    data: {
      records: data,
      summary: {
        total,
        present,
        absent,
        late,
        attendanceRate: total
          ? Math.round((present / total) * 100)
          : 0,
      },
    },
  });
                           }
