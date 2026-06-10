import api from "../lib/axios";

import {
  ParentAnnouncement,
  ParentChild,
  ParentChildResultsResponse,
  ParentPortalResponse,
  ParentResult,
} from "../types/parent-portal";

/* ================= ENDPOINTS ================= */

const ENDPOINTS = {
  overview: "/parent/portal",

  childResults: (childId: string) =>
    `/parent/children/${childId}/results`,

  parents: "/parents",

  parentById: (id: string) => `/parents/${id}`,
};

/* =========================================================
   PARENT PORTAL
========================================================= */

export async function getParentPortalOverview(): Promise<any> {
  const response = await api.get(ENDPOINTS.overview);

  return response.data.data;
}

/* =========================================================
   CHILD RESULTS
========================================================= */

export async function getParentChildResults(
  childId: string
): Promise<ParentResult[]> {
  const response =
    await api.get<ParentChildResultsResponse>(
      ENDPOINTS.childResults(childId)
    );

  return response.data.results || [];
}

/* =========================================================
   ADMIN PARENTS CRUD
========================================================= */

export async function getParents(params?: {
  search?: string;
}) {
  const response = await api.get(
    ENDPOINTS.parents,
    {
      params,
    }
  );

  return response.data.data || [];
}

export async function createParent(
  payload: any
) {
  const response = await api.post(
    ENDPOINTS.parents,
    payload
  );

  return response.data.data;
}

export async function getParent(id: string) {
  const response = await api.get(
    ENDPOINTS.parentById(id)
  );

  return response.data.data;
}

export async function updateParent(
  id: string,
  payload: any
) {
  const response = await api.put(
    ENDPOINTS.parentById(id),
    payload
  );

  return response.data.data;
}

export async function deleteParent(id: string) {
  const response = await api.delete(
    ENDPOINTS.parentById(id)
  );

  return response.data.data;
}