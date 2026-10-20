
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ResolvedTenant } from "../../types/tenant-resolver";
import {
  getResolvedTenant,
  saveResolvedTenant,
} from "../../lib/tenant-storage";
import { resolveTenantBySlug } from "../../lib/tenant-resolver";
import { useAuth } from "../providers/AuthProvider";

type TenantContextType = {
  tenant: ResolvedTenant | null;
  setTenant: (tenant: ResolvedTenant | null) => void;
  patchTenant: (updates: Partial<ResolvedTenant>) => void;
  clearTenant: () => void;
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated } = useAuth();

  const [tenant, setTenantState] = useState<ResolvedTenant | null>(null);
  const [tenantLoaded, setTenantLoaded] = useState(false);

  useEffect(() => {
    const saved = getResolvedTenant();

    if (saved) {
      setTenantState(saved);
    }

    setTenantLoaded(true);
  }, []);

  const setTenant = useCallback((nextTenant: ResolvedTenant | null) => {
    setTenantState(nextTenant);
    saveResolvedTenant(nextTenant);
  }, []);

  const patchTenant = useCallback(
    (updates: Partial<ResolvedTenant>) => {
      setTenantState((previous) => {
        if (!previous) return previous;

        const updated = { ...previous, ...updates };
        saveResolvedTenant(updated);
        return updated;
      });
    },
    []
  );

  const clearTenant = useCallback(() => {
    setTenantState(null);
    saveResolvedTenant(null);
  }, []);

  useEffect(() => {
    if (!hydrated || !tenantLoaded || !user) return;

    let cancelled = false;

    async function refreshTenant() {
      try {
        // Prefer the existing saved school slug. It is needed to resolve
        // the same school for administrators, teachers and parents.
        const savedTenant = getResolvedTenant();
        const slug = savedTenant?.slug;

        if (!slug) return;

        const resolved = await resolveTenantBySlug(slug);

        if (cancelled || !resolved) return;

        // Do not overwrite a tenant with a different school.
        if (
          user.schoolId &&
          resolved._id &&
          resolved._id !== user.schoolId
        ) {
          console.warn("Resolved tenant does not match the signed-in user's school.");
          return;
        }

        setTenant(resolved);
      } catch (error) {
        console.error("Failed to refresh school branding:", error);
        // Keep saved branding available if refresh fails.
      }
    }

    void refreshTenant();

    return () => {
      cancelled = true;
    };
  }, [hydrated, tenantLoaded, user, setTenant]);

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      patchTenant,
      clearTenant,
    }),
    [tenant, setTenant, patchTenant, clearTenant]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
}
