
import api from "./axios";

export type AcademicTerm = {
  _id: string;
  sessionId: string | { _id: string; name: string };
  name: string;
  order?: number;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
};

export async function getTerms(sessionId?: string): Promise<AcademicTerm[]> {
  const res = await api.get("/terms", {
    params: sessionId ? { sessionId } : undefined,
  });

  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createTerm(payload: {
  sessionId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  order?: number;
  isCurrent?: boolean;
}) {
  const res = await api.post("/terms", payload);
  return res.data?.data ?? res.data;
}

export async function setCurrentTerm(id: string) {
  const res = await api.patch(`/terms/${id}/set-current`);
  return res.data?.data ?? res.data;
}

