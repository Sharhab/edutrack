
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

  // Restore the previously saved school branding.
  useEffect(() => {
    try {
      const savedTenant = getResolvedTenant();

      if (savedTenant) {
        setTenantState(savedTenant);
      }
    } catch (error) {
      console.error("Failed to restore saved tenant:", error);
    } finally {
      setTenantLoaded(true);
    }
  }, []);

  // Preserve the existing public context API.
  const setTenant = useCallback(
    (nextTenant: ResolvedTenant | null) => {
      setTenantState(nextTenant);
      saveResolvedTenant(nextTenant);
    },
    []
  );

  const patchTenant = useCallback(
    (updates: Partial<ResolvedTenant>) => {
      setTenantState((previous) => {
        if (!previous) return previous;

        const updatedTenant: ResolvedTenant = {
          ...previous,
          ...updates,
        };

        saveResolvedTenant(updatedTenant);

        return updatedTenant;
      });
    },
    []
  );

  const clearTenant = useCallback(() => {
    setTenantState(null);
    saveResolvedTenant(null);
  }, []);

  // Refresh saved branding for the authenticated school user.
  useEffect(() => {
    if (!hydrated || !tenantLoaded || !user) {
      return;
    }

    // Capture values while user is known to be non-null.
    const schoolId = user.schoolId;
    const userRole = user.role;

    let cancelled = false;

    async function refreshTenant() {
      try {
        const savedTenant = getResolvedTenant();
        const slug = savedTenant?.slug;

        // The existing resolver requires a school slug.
        // Keep the saved tenant if no slug is available.
        if (!slug) return;

        const resolvedTenant = await resolveTenantBySlug(slug);

        if (cancelled || !resolvedTenant) {
          return;
        }

        // Prevent branding from another school being applied.
        if (
          schoolId &&
          resolvedTenant._id &&
          resolvedTenant._id !== schoolId
        ) {
          console.warn(
            "Resolved tenant does not match the signed-in user's school."
          );
          return;
        }

        // Only update branding after the school has been verified.
        setTenant(resolvedTenant);
      } catch (error) {
        // Retain the existing tenant if refresh fails.
        console.error(
          `Failed to refresh tenant for ${userRole}:`,
          error
        );
      }
    }

    void refreshTenant();

    return () => {
      cancelled = true;
    };
  }, [hydrated, tenantLoaded, user, setTenant]);

  const value = useMemo<TenantContextType>(
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
    throw new Error(
      "useTenant must be used inside TenantProvider"
    );
  }

  return context;
}
