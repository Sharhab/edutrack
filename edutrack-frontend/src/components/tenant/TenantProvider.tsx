

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ResolvedTenant } from "../../types/tenant-resolver";
import {
  getResolvedTenant,
  saveResolvedTenant,
} from "../../lib/tenant-storage";

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
  const [tenant, setTenantState] =
    useState<ResolvedTenant | null>(null);

  const [hydrated, setHydrated] = useState(false);

  // Restore the saved school branding on initial load.
  useEffect(() => {
    try {
      setTenantState(getResolvedTenant());
    } catch (error) {
      console.error("Failed to restore tenant:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setTenant = useCallback(
    (nextTenant: ResolvedTenant | null) => {
      setTenantState(nextTenant);

      try {
        saveResolvedTenant(nextTenant);
      } catch (error) {
        console.error("Failed to save tenant:", error);
      }
    },
    []
  );

  const patchTenant = useCallback(
    (updates: Partial<ResolvedTenant>) => {
      setTenantState((previous) => {
        if (!previous) return previous;

        const updated = {
          ...previous,
          ...updates,
        };

        try {
          saveResolvedTenant(updated);
        } catch (error) {
          console.error("Failed to save tenant updates:", error);
        }

        return updated;
      });
    },
    []
  );

  const clearTenant = useCallback(() => {
    setTenantState(null);

    try {
      saveResolvedTenant(null);
    } catch (error) {
      console.error("Failed to clear tenant:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      patchTenant,
      clearTenant,
    }),
    [tenant, setTenant, patchTenant, clearTenant]
  );

  // Avoid rendering children until saved tenant data has been restored.
  if (!hydrated) return null;

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
