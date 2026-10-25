import api from "./axios";
import { RESULT_ENDPOINTS } from "./endpoints";
import { CreateResultPayload, ResultRecord } from "../types/result";

export async function bulkUpsertResults(payload: {
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;
  results: any[];
}) {
  const res = await api.post("/results/bulk-upsert", payload);
  return res.data;
}
/* =========================================
   LIST RESULTS
========================================= */
export async function getResults(params?: any): Promise<ResultRecord[]> {
  const res = await api.get(RESULT_ENDPOINTS.list, { params });
  return res.data.data;
}

/* =========================================
   GET STUDENT RESULTS
========================================= */
export async function getStudentResults(studentId: string): Promise<ResultRecord[]> {
  const res = await api.get(
    RESULT_ENDPOINTS.student(studentId)
  );
  return res.data.data;
}


/* =========================================
   GET ASSESSMENT SCHEME FOR CLASS
========================================= */

export type AssessmentComponent = {
  key: string;
  label: string;
  maxScore: number;
};

export type AssessmentScheme = {
  _id?: string;
  name?: string;
  version: number;
  totalMax: number;
  components: AssessmentComponent[];
  source?: string;
};

export async function getClassAssessmentScheme(
  classId: string
): Promise<AssessmentScheme | null> {
  if (!classId) {
    return null;
  }

  const { data } = await api.get("/result-schemes", {
    params: { classId },
  });

  return data?.data?.scheme ?? null;
}

/* =========================================
   SAVE / AUTOSAVE BULK RESULTS (V2)
========================================= */
export async function saveResults(payload: CreateResultPayload) {
  const res = await api.post("/results", payload);
  return res.data.data;
}

/* =========================================
   GET CLASS STUDENTS FOR ENTRY
========================================= */
export async function getClassStudents(classId: string) {
  const res = await api.get(`/classes/${classId}/students`);
  return res.data.data;
}





/* =========================================
   TEACHER RESULT CONTEXT (FIX)
========================================= */
export async function getTeacherResultContext() {
  const { data } = await api.get("/results/teacher/results/context");
  return data.data;
}

/* =========================================
   STUDENTS FOR CLASS ENTRY
========================================= */
export async function getClassStudentsForResultEntry(classId: string) {
  const { data } = await api.get(`/teacher/classes/${classId}/students`);
  return data.data;
}

/* =========================================
   AUTOSAVE RESULTS
========================================= */
export async function autosaveResults(payload: any) {
  const { data } = await api.post("/results", payload);
  return data.data;
}

/* =========================================
   PUBLISH RESULTS
========================================= */
export async function publishResults(payload: any) {
  const { data } = await api.post("/results/admin/publish", payload);
  return data.data;
}
