import api from "./axios";
import { Teacher, TeacherFormValues } from "../types/teacher";

function buildTeacherPayload(
  payload: TeacherFormValues,
  isUpdate = false
) {
  return {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    employeeId: payload.employeeId,

    subjectIds: payload.subjectIds || [],
    classIds: payload.classIds || [],

    gender: payload.gender,
    address: payload.address,

    isActive: payload.isActive,

    ...(payload.password && (!isUpdate || payload.password)
      ? { password: payload.password }
      : {}),
  };
}
export async function getTeachers(p0: { search: string; }): Promise<Teacher[]> {
  const { data } = await api.get("/teachers");
  return data?.data || [];
}

export async function createTeacher(payload: TeacherFormValues): Promise<Teacher> {
  const { data } = await api.post("/teachers", buildTeacherPayload(payload));
  return data?.data || data;
}

export async function updateTeacher(id: string, payload: TeacherFormValues): Promise<Teacher> {
  const { data } = await api.put(
    `/teachers/${id}`,
    buildTeacherPayload(payload, true)
  );

  return data?.data || data;
}

export async function deleteTeacher(id: string) {
  const { data } = await api.delete(`/teachers/${id}`);
  return data?.data || data;
}