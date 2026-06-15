import api from "../lib/axios";
import {
  TeacherAssignedClass,
  TeacherClassStudentsResponse,
  TeacherPortalAnnouncement,
  TeacherPortalOverviewResponse,
  TeacherPortalStudent,
} from "../types/teacher-portal";

const ENDPOINTS = {
  overview: "/teacher/portal",
  classStudents: (classId: string) =>
    `/teacher/classes/${classId}/students`,
  submitAttendance: "/teacher/attendance",
};

/* =========================================
   TEACHER PORTAL OVERVIEW
========================================= */
export async function getTeacherPortalOverview(): Promise<{
  teacher: any;
  classes: TeacherAssignedClass[];
  announcements: TeacherPortalAnnouncement[];
}> {
  const res = await api.get<TeacherPortalOverviewResponse>(
    ENDPOINTS.overview
  );

  const payload = res.data?.data; // 👈 FIXED

  return {
    teacher: payload?.teacher || null,
    classes: payload?.classes || [],
    announcements: payload?.announcements || [],
  };
}

/* =========================================
   TEACHER RESULT CONTEXT (v2 FIX)
   - replaces manual class/subject IDs
========================================= */
export async function getTeacherResultContext() {
  const { data } = await api.get("/teacher/results/context");

  return data.data;
}

/* =========================================
   TEACHER CLASS STUDENTS (keep existing)
========================================= */
/* =========================================
   CLASS STUDENTS
========================================= */
 export async function getTeacherClassStudents(
  classId: string
): Promise<TeacherPortalStudent[]> {
  const res = await api.get<TeacherClassStudentsResponse>(
    ENDPOINTS.classStudents(classId)
  );

  const payload = res.data?.data;

  return payload || [];
}
/* =========================================
   ATTENDANCE
========================================= */
export async function submitTeacherAttendance(payload: {
  classId: string;
  attendance: {
    studentId: string;
    status: "present" | "absent";
  }[];
}) {
  const res = await api.post(ENDPOINTS.submitAttendance, payload);
  return res.data;
}