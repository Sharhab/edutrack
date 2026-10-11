
import api from "./axios";

export type AcademicSession = {
  _id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
};

export async function getSessions(): Promise<AcademicSession[]> {
  const res = await api.get("/sessions");
  const data = res.data?.data ?? res.data;

  return Array.isArray(data) ? data : [];
}

export async function createSession(payload: {
  name: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}) {
  const res = await api.post("/sessions", payload);
  return res.data?.data ?? res.data;
}

export async function setCurrentSession(id: string) {
  const res = await api.patch(`/sessions/${id}/set-current`);
  return res.data?.data ?? res.data;
}

