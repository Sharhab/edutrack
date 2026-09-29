// lib/sessions.ts
import api from "./axios";

export async function getSessions() {
  const res = await api.get("/sessions");
  return res.data.data || res.data;
}

export async function createSession(payload: {
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}) {
  const res = await api.post("/sessions", payload);
  return res.data.data || res.data;
}

export async function setCurrentSession(id: string) {
  const res = await api.patch(`/sessions/${id}/set-current`);
  return res.data.data || res.data;
}