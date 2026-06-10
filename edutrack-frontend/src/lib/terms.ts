import api from "./axios";

export async function getTerms() {
  const res = await api.get("/terms");
  return res.data.data || res.data;
}

export async function createTerm(payload: {
  sessionId: string;
  name: "First Term" | "Second Term" | "Third Term";
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}) {
  const res = await api.post("/terms", payload);
  return res.data.data || res.data;
}

export async function setCurrentTerm(id: string) {
  const res = await api.patch(`/terms/${id}/set-current`);
  return res.data.data || res.data;
}