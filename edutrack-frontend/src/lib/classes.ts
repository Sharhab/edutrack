import api from "./axios";
import { ClassFormValues, ClassItem } from "../types/class";

/**
 * REMOVE arm (not in backend schema)
 */
function buildClassPayload(payload: ClassFormValues) {
  return {
    name: payload.name,
    level: payload.level || undefined,
    capacity: payload.capacity ? Number(payload.capacity) : undefined,
    isActive: payload.isActive === "true",
  };
}

/**
 * GET CLASSES
 * backend always returns: { success, message, data: [] }
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