import api from "./axios";

import {
  TeacherDashboardData,
  SchoolAdminDashboardData,
  ParentDashboardData,
} from "../types/dashboard";

const DASHBOARD_ENDPOINTS = {
  schoolAdmin: "/dashboard/school-admin",
  teacher: "/dashboard/teacher",
  parent: "/dashboard/parent",
};

/* =========================================
   API RESPONSE WRAPPER
========================================= */

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

/* =========================================
   SCHOOL ADMIN
========================================= */

export async function getSchoolAdminDashboard() {
  const response =
    await api.get<
      ApiResponse<SchoolAdminDashboardData>
    >(DASHBOARD_ENDPOINTS.schoolAdmin);

  return response.data.data;
}

/* =========================================
   TEACHER
========================================= */

export async function getTeacherDashboard() {
  const response =
    await api.get<
      ApiResponse<TeacherDashboardData>
    >(DASHBOARD_ENDPOINTS.teacher);

  return response.data.data;
}

/* =========================================
   PARENT
========================================= */

export async function getParentDashboard() {
  const response =
    await api.get<
      ApiResponse<ParentDashboardData>
    >(DASHBOARD_ENDPOINTS.parent);

  return response.data.data;
}