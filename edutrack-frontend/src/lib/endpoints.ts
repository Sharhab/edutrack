export const RESULT_ENDPOINTS = {
  create: "/results",
  list: "/results",
  student: (id: string) => `/results/student/${id}`,

  adminOverview: "/results/admin/overview",
  generate: "/results/admin/generate",
  publish: "/results/admin/publish",
  lock: "/results/admin/lock",
  unlock: "/results/admin/unlock",
};