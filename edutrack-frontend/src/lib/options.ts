import api from "./axios";

export type OptionItem = {
  _id: string;
  name: string;
  label?: string;
  value?: string;
};

function normalizeOption(item: any): OptionItem {
  return {
    _id: item?._id || item?.value || "",
    name: item?.name || item?.label || "",
  };
}

/* =========================
   SAFE ARRAY EXTRACTOR
========================= */
function safeArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.classes)) return data.classes;
  return [];
}

/* =========================
   CLASSES
========================= */
export async function getClassOptions() {
  const res = await api.get("/options/classes");
  return safeArray(res.data).map(normalizeOption);
}

/* =========================
   STUDENTS
========================= */
export async function getStudentOptions() {
  const res = await api.get("/options/students");
  return safeArray(res.data).map(normalizeOption);
}

/* =========================
   SUBJECTS
========================= */
export async function getSubjectOptions() {
  const res = await api.get("/options/subjects");
  return safeArray(res.data).map(normalizeOption);
}

/* =========================
   PARENTS
========================= */
export async function getParentOptions() {
  const res = await api.get("/options/parents");
  return safeArray(res.data).map(normalizeOption);
}

/* =========================
   SESSIONS
========================= */
export async function getSessions() {
  const res = await api.get("/options/sessions");
  return safeArray(res.data).map(normalizeOption);
}

/* =========================
   TERMS
========================= */
export async function getTerms() {
  const res = await api.get("/options/terms");
  return safeArray(res.data).map(normalizeOption);
}



