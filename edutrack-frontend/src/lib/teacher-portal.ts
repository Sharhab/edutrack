import api from "../lib/axios";

import {
  TeacherAssignedClass,
  TeacherPortalAnnouncement,
  TeacherPortalOverviewResponse,
  TeacherPortalStudent,
} from "../types/teacher-portal";

const ENDPOINTS = {
  overview: "/teacher/portal",

  classStudents: (classId: string) =>
    `/teacher/classes/${classId}/students`,

  submitAttendance: "/teacher/attendance",

  resultContext: "/results/teacher/results/context",
};

/* =========================================
   TEACHER PORTAL OVERVIEW
========================================= */

export async function getTeacherPortalOverview(): Promise<{
  teacher: any;
  classes: TeacherAssignedClass[];
  announcements: TeacherPortalAnnouncement[];
}> {
  const res =
    await api.get<TeacherPortalOverviewResponse>(
      ENDPOINTS.overview
    );

  const payload = res.data?.data;

  return {
    teacher: payload?.teacher || null,
    classes: payload?.classes || [],
    announcements:
      payload?.announcements || [],
  };
}

/* =========================================
   TEACHER RESULT CONTEXT
========================================= */

export async function getTeacherResultContext() {
  const { data } = await api.get(
    ENDPOINTS.resultContext
  );

  console.log(
    "📚 TEACHER RESULT CONTEXT:",
    data?.data
  );

  return data?.data;
}

/* =========================================
   TEACHER CLASS STUDENTS
========================================= */

export async function getTeacherClassStudents(
  classId: string
): Promise<TeacherPortalStudent[]> {
  const res = await api.get(
    ENDPOINTS.classStudents(classId)
  );

  console.log(
    "✅ CLASS STUDENTS RESPONSE:",
    res.data
  );

  return (
    res.data?.data?.students || []
  );
}

/* =========================================
   SUBMIT ATTENDANCE
========================================= */

export async function submitTeacherAttendance(
  payload: {
    classId: string;
    sessionId: string;
    termId: string;
    attendance: {
      studentId: string;
      status:
        | "present"
        | "absent";
    }[];
  }
) {
  console.log(
    "📤 ATTENDANCE PAYLOAD:",
    payload
  );

  const res = await api.post(
    ENDPOINTS.submitAttendance,
    payload
  );

  console.log(
    "✅ ATTENDANCE SUBMIT RESPONSE:",
    res.data
  );

  return res.data;
}