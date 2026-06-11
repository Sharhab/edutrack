import api from "./axios";
import { ClassFormValues, ClassItem, ClassPayload } from "../types/class";

/**
 * Convert UI form → backend payload
 */
function buildClassPayload(payload: ClassFormValues): ClassPayload {
  return {
    name: payload.name.trim(),
    level: payload.level?.trim() || undefined,
    arm: undefined, // removed from backend schema
    capacity: payload.capacity ? Number(payload.capacity) : undefined,
    isActive: payload.isActive === "true",
  };
}

/**
 * GET CLASSES
 */
export async function getClasses(): Promise<ClassItem[]> {
  const res = await api.get("/classes");
  return res.data.data;
}

/**
 * CREATE CLASS
 */
export async function createClass(
  payload: ClassFormValues
): Promise<ClassItem> {
  const res = await api.post(
    "/classes",
    buildClassPayload(payload)
  );
  return res.data.data;
}

/**
 * UPDATE CLASS
 */
export async function updateClass(
  id: string,
  payload: ClassFormValues
): Promise<ClassItem> {
  const res = await api.put(
    `/classes/${id}`,
    buildClassPayload(payload)
  );
  return res.data.data;
}

/**
 * DELETE CLASS
 */
export async function deleteClass(id: string) {
  const res = await api.delete(`/classes/${id}`);
  return res.data.data;
}
