import api from "./axios";
import { Student, StudentFormValues } from "../types/student";

/**
 * =========================
 * GET STUDENTS
 * =========================
 */
export async function getStudents(params?: {
  search?: string;
  classId?: string;
  status?: string;
}): Promise<Student[]> {
  const { data } = await api.get("/students", { params });
  return data?.data || [];
}

/**
 * =========================
 * CREATE STUDENT
 * =========================
 */
export async function createStudent(
  payload: StudentFormValues
): Promise<Student> {
  const requestBody = normalizeStudentPayload(payload);

  const { data } = await api.post("/students", requestBody);
  return data?.data || data;
}

/**
 * =========================
 * UPDATE STUDENT
 * =========================
 */
export async function updateStudent(
  id: string,
  payload: StudentFormValues
): Promise<Student> {
  const requestBody = normalizeStudentPayload(payload);

  const { data } = await api.put(`/students/${id}`, requestBody);
  return data?.data || data;
}

/**
 * =========================
 * DELETE STUDENT
 * =========================
 */
export async function deleteStudent(id: string) {
  const { data } = await api.delete(`/students/${id}`);
  return data?.data || data;
}

/**
 * =========================
 * SAFE NORMALIZER (IMPORTANT)
 * =========================
 * Prevents sending empty strings that break Mongo logic
 */
function normalizeStudentPayload(payload: StudentFormValues) {
  return {
    ...payload,

    // IDs (prevent empty string bugs)
    classId: payload.classId || undefined,
    parentId: payload.parentId || undefined,

    // Optional identity fields
    nin: (payload as any).nin || undefined,
    birthCertificateNo: (payload as any).birthCertificateNo || undefined,

    // Academic
    entryType: (payload as any).entryType || "new",
    previousSchool: (payload as any).previousSchool || undefined,

    // Location
    stateOfOrigin: (payload as any).stateOfOrigin || undefined,
    lga: (payload as any).lga || undefined,

    // Health
    bloodGroup: (payload as any).bloodGroup || undefined,
    genotype: (payload as any).genotype || undefined,

    // Emergency
    emergencyName: (payload as any).emergencyName || undefined,
    emergencyPhone: (payload as any).emergencyPhone || undefined,

    // Ensure status consistency
    status: (payload as any).status || "active",
  };
}