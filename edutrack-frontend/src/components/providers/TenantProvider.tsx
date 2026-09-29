"use client";

import {
  createContext,
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

type TenantContextType = {
  tenant: ResolvedTenant | null;
  setTenant: (tenant: ResolvedTenant | null) => void;
  clearTenant: () => void;
  patchTenant: (updates: Partial<ResolvedTenant>) => void;
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<ResolvedTenant | null>(null);

  useEffect(() => {
    const saved = getResolvedTenant();
    if (saved) setTenantState(saved);
  }, []);

  function setTenant(nextTenant: ResolvedTenant | null) {
    setTenantState(nextTenant);
    saveResolvedTenant(nextTenant);
  }

  function clearTenant() {
    setTenantState(null);
    saveResolvedTenant(null);
  }

  function patchTenant(updates: Partial<ResolvedTenant>) {
    setTenantState((prev) => {
      if (!prev) return prev;

      const nextTenant = {
        ...prev,
        ...updates,
      };

      saveResolvedTenant(nextTenant);
      return nextTenant;
    });
  }

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      clearTenant,
      patchTenant,
    }),
    [tenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
}