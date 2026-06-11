import api from "./axios";
import { ClassFormValues } from "../types/class";
import { ClassItem, ClassPayload } from "../types/class";
/**
 * Convert form → backend payload
 */
function buildClassPayload(payload: ClassFormValues): ClassPayload {
  return {
    name: payload.name.trim(),
    level: payload.level?.trim() || undefined,
    capacity: payload.capacity ? Number(payload.capacity) : undefined,
    isActive: payload.isActive === "true",
  };
}

/**
 * CREATE (NOW FIXED TYPE)
 */

export async function getClasses(): Promise<ClassItem[]> {
  const res = await api.get("/classes");
  return res.data.data;
}

export async function createClass(
  payload: ClassPayload
): Promise<ClassItem> {
  const res = await api.post("/classes", payload);
  return res.data.data;
}

export async function updateClass(
  id: string,
  payload: ClassPayload
): Promise<ClassItem> {
  const res = await api.put(`/classes/${id}`, payload);
  return res.data.data;
}

export async function deleteClass(id: string) {
  const res = await api.delete(`/classes/${id}`);
  return res.data.data;
}
