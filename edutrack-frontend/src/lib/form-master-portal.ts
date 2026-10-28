import api from "./axios";

export interface FormMasterSession {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

export interface FormMasterClass {
  assignmentId: string;
  classId: string;
  name: string;
  level: string;
  code: string;
  studentCount: number;
  assignedAt: string;
}

export interface FormMasterStudent {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  admissionNumber: string;
  gender: string;
}

export interface FormMasterOverview {
  teacher: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  session: FormMasterSession | null;
  stats: {
    assignedClasses: number;
    totalStudents: number;
  };
  classes: FormMasterClass[];
}

export async function getFormMasterOverview(
  sessionId?: string
): Promise<FormMasterOverview> {
  const { data } = await api.get("/form-master-portal/overview", {
    params: sessionId ? { sessionId } : {},
  });

  return data.data;
}

export async function getFormMasterClassStudents(
  classId: string,
  sessionId: string
): Promise<FormMasterStudent[]> {
  const { data } = await api.get(
    `/form-master-portal/classes/${classId}/students`,
    { params: { sessionId } }
  );

  return data.data.students;
}
