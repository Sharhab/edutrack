import api from "./axios";
import { Teacher, TeacherFormValues } from "../types/teacher";

function buildTeacherPayload(
  payload: TeacherFormValues,
  isUpdate = false
) {
  return {
    // PERSONAL
    firstName: payload.firstName,
    middleName: payload.middleName,
    lastName: payload.lastName,

    email: payload.email,
    phone: payload.phone,

    employeeId: payload.employeeId,

    qualification: payload.qualification,
    designation: payload.designation,

    dateOfBirth: payload.dateOfBirth,

    // EMPLOYMENT
    employmentDate: payload.employmentDate,
    employmentType: payload.employmentType,

    // ASSIGNMENTS
    subjectIds: payload.subjectIds || [],
    classIds: payload.classIds || [],

    // PROFILE
    gender: payload.gender,
    address: payload.address,

    // STATUS
    isActive: payload.isActive,
    status: payload.status,

    // ADDITIONAL DETAILS
    maritalStatus: payload.maritalStatus,
    stateOfOrigin: payload.stateOfOrigin,
    lga: payload.lga,
    nationality: payload.nationality,

    staffCategory: payload.staffCategory,

    emergencyName: payload.emergencyName,
    emergencyPhone: payload.emergencyPhone,

    bloodGroup: payload.bloodGroup,
    genotype: payload.genotype,

    nin: payload.nin,

    photo: payload.photo,

    ...(payload.password &&
    (!isUpdate || payload.password)
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