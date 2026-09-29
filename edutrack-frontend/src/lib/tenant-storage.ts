"use client";

import { ResolvedTenant } from "../types/tenant-resolver";

const TENANT_STORAGE_KEY = "edutrack_resolved_tenant";

export function saveResolvedTenant(tenant: ResolvedTenant | null) {
  if (typeof window === "undefined") return;

  if (!tenant) {
    localStorage.removeItem(TENANT_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
}

export function getResolvedTenant(): ResolvedTenant | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TENANT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ResolvedTenant;
  } catch {
    return null;
  }
}

export function clearResolvedTenant() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TENANT_STORAGE_KEY);
}