import api from "./axios";
import { ClassFormValues, ClassItem, ClassPayload } from "../types/class";

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
 * GET
 */
export async function getClasses(): Promise<ClassItem[]> {
  const res = await api.get("/classes");
  return res.data.data;
}

/**
 * CREATE (NOW FIXED TYPE)
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
 * UPDATE (🔥 THIS IS THE CRITICAL FIX)
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
 * DELETE
 */
export async function deleteClass(id: string) {
  const res = await api.delete(`/classes/${id}`);
  return res.data.data;
}
