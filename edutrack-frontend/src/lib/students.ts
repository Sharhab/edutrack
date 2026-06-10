import api from "./axios";
import { Student, StudentFormValues } from "../types/student";

export async function getStudents(params?: { search?: string }): Promise<Student[]> {
  const { data } = await api.get("/students", { params });
  return data?.data || [];
}

export async function createStudent(payload: StudentFormValues): Promise<Student> {
  const requestBody = {
    ...payload,
    classId: payload.classId || undefined,
    parentId: payload.parentId || undefined,
  };

  const { data } = await api.post("/students", requestBody);
  return data?.data || data;
}

export async function updateStudent(
  id: string,
  payload: StudentFormValues
): Promise<Student> {
  const requestBody = {
    ...payload,
    classId: payload.classId || undefined,
    parentId: payload.parentId || undefined,
  };

  const { data } = await api.put(`/students/${id}`, requestBody);
  return data?.data || data;
}

export async function deleteStudent(id: string) {
  const { data } = await api.delete(`/students/${id}`);
  return data?.data || data;
}