import api from "./axios";

/* =========================================
   TYPES
========================================= */

export type OverviewPayload = {
  sessionId?: string;
  termId?: string;
};

export type ActionPayload = {
  sessionId: string;
  termId: string;
  classId: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/* =========================================
   SAFE RESPONSE HANDLER
========================================= */

function unwrap<T>(res: any): T {
  return res?.data?.data ?? res?.data ?? res;
}

/* =========================================
   ADMIN OVERVIEW
========================================= */

export async function getAdminResultOverview(
  params: OverviewPayload
) {
  const res = await api.get<ApiResponse<any>>(
    "/results/admin/overview",
    { params }
  );

  return unwrap(res);
}

/* =========================================
   ADMIN SUMMARY (NEW DASHBOARD ENGINE)
   - FIXES YOUR 404 ISSUE ENDPOINT
========================================= */

export async function getAdminResultSummary(
  params: OverviewPayload
) {
  const res = await api.get<ApiResponse<any>>(
    "/results/admin/summary",
    { params }
  );

  return unwrap(res);
}

/* =========================================
   RESULT ANALYTICS
========================================= */

export async function getResultAnalytics(
  params: OverviewPayload
) {
  const res = await api.get<ApiResponse<any>>(
    "/results/admin/analytics",
    { params }
  );

  return unwrap(res);
}

/* =========================================
   GENERATE RESULTS
========================================= */

export async function generateResults(
  payload: ActionPayload
) {
  const res = await api.post<ApiResponse<any>>(
    "/results/admin/generate",
    payload
  );

  return unwrap(res);
}

/* =========================================
   PUBLISH RESULTS
========================================= */

export async function publishResults(
  payload: ActionPayload
) {
  const res = await api.post<ApiResponse<any>>(
    "/results/admin/publish",
    payload
  );

  return unwrap(res);
}

/* =========================================
   LOCK RESULTS
========================================= */

export async function lockResults(
  payload: ActionPayload
) {
  const res = await api.post<ApiResponse<any>>(
    "/results/admin/lock",
    payload
  );

  return unwrap(res);
}

/* =========================================
   UNLOCK RESULTS
========================================= */

export async function unlockResults(
  payload: ActionPayload
) {
  const res = await api.post<ApiResponse<any>>(
    "/results/admin/unlock",
    payload
  );

  return unwrap(res);
}