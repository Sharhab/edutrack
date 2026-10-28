import api from "./axios";

export interface FormMasterSession {
  _id: string;
  name: string;
  isCurrent?: boolean;
}

export interface FormMasterAssignment {
  _id: string;
  sessionId: string | FormMasterSession;
  classId:
    | string
    | {
        _id: string;
        name: string;
        level?: string;
        code?: string;
      };
  teacherId:
    | string
    | {
        _id: string;
        employeeId?: string;
        status?: string;
        userId?: {
          firstName: string;
          lastName: string;
          email?: string;
        };
      };
  assignedAt: string;
  history?: Array<{
    changedAt: string;
  }>;
}

export async function getFormMasterAssignments(
  sessionId?: string
): Promise<FormMasterAssignment[]> {
  const response = await api.get("/form-master-assignments", {
    params: sessionId ? { sessionId } : {},
  });

  return response.data.data;
}

export async function assignFormMaster(payload: {
  sessionId: string;
  classId: string;
  teacherId: string;
}): Promise<FormMasterAssignment> {
  const response = await api.post(
    "/form-master-assignments",
    payload
  );

  return response.data.data;
}

export async function reassignFormMaster(
  assignmentId: string,
  teacherId: string
): Promise<FormMasterAssignment> {
  const response = await api.patch(
    `/form-master-assignments/${assignmentId}/reassign`,
    { teacherId }
  );

  return response.data.data;
}
