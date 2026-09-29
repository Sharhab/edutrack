
// src/lib/attendance.ts
import api from "./axios";

import {
  AttendanceCreatePayload,
  AttendanceFormValues,
  AttendanceRecord,
  AttendanceListResponse,
  AttendanceFilters,
} from "../types/attendance";

const ATTENDANCE_ENDPOINTS = {
  list: "/attendance",

  create: "/attendance",

  update: (id: string) =>
    `/attendance/${id}`,

  remove: (id: string) =>
    `/attendance/${id}`,
};

/* =========================
   GET ALL
========================= */

export async function getAttendance(): Promise<
  AttendanceRecord[]
> {
  const { data } =
    await api.get<{
      data: AttendanceListResponse;
    }>(
      ATTENDANCE_ENDPOINTS.list
    );

  return (
    data?.data?.records || []
  );
}

/* =========================
   GET CLASS ATTENDANCE
========================= */
/* =========================
   GET ATTENDANCE RECORDS
========================= */

export async function getAttendanceRecords(
  filters: AttendanceFilters = {}
): Promise<AttendanceListResponse> {
  const res = await api.get(ATTENDANCE_ENDPOINTS.list, {
    params: {
      classId: filters.classId || undefined,
      studentId: filters.studentId || undefined,
      date: filters.date || undefined,
    },
  });

  return res.data.data; // ✅ IMPORTANT FIX
}

/* =========================
   CREATE BULK ATTENDANCE
========================= */

export async function createAttendance(
  payload: AttendanceFormValues
): Promise<
  AttendanceRecord[]
> {
  const requestBody: AttendanceCreatePayload =
    {
      classId:
        payload.classId,

      sessionId:
        payload.sessionId,

      termId:
        payload.termId,

      date:
        payload.date,

      records:
        payload.records.map(
          (student) => ({
            studentId:
              student.studentId,

            status:
              student.status,
          })
        ),
    };

  const { data } =
    await api.post(
      ATTENDANCE_ENDPOINTS.create,
      requestBody
    );

  return (
    data?.data || []
  );
}

/* =========================
   UPDATE SINGLE RECORD
========================= */

export async function updateAttendance(
  id: string,
  payload: {
    studentId: string;

    classId: string;

    sessionId: string;

    termId: string;

    date: string;

    status:
      | "present"
      | "absent"
      | "late";
  }
): Promise<
  AttendanceRecord
> {
  const { data } =
    await api.put(
      ATTENDANCE_ENDPOINTS.update(
        id
      ),
      payload
    );

  return data?.data;
}

/* =========================
   DELETE
========================= */

export async function deleteAttendance(
  id: string
) {
  const { data } =
    await api.delete(
      ATTENDANCE_ENDPOINTS.remove(
        id
      )
    );

  return data?.data;
}

