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

  setTenant: (
    tenant: ResolvedTenant | null
  ) => void;

  patchTenant: (
    updates: Partial<ResolvedTenant>
  ) => void;

  clearTenant: () => void;
};

const TenantContext =
  createContext<TenantContextType | null>(
    null
  );

export function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tenant, setTenantState] =
    useState<ResolvedTenant | null>(
      null
    );

  useEffect(() => {
    const saved =
      getResolvedTenant();

    console.log(
      "SAVED TENANT:",
      saved
    );

    if (saved) {
      setTenantState(saved);
    }
  }, []);

  function setTenant(
    nextTenant:
      | ResolvedTenant
      | null
  ) {
    setTenantState(nextTenant);

    saveResolvedTenant(
      nextTenant
    );
  }

 function patchTenant(updates: Partial<ResolvedTenant>) {
  setTenantState((prev) => {
    const nextTenant: ResolvedTenant = {
      ...(prev ?? ({} as ResolvedTenant)),
      ...updates,
    };

    saveResolvedTenant(nextTenant);

    console.log("PATCHED TENANT:", nextTenant);

    return nextTenant;
  });
}

  function clearTenant() {
    setTenantState(null);

    saveResolvedTenant(null);
  }

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      patchTenant,
      clearTenant,
    }),
    [tenant]
  );

  return (
    <TenantContext.Provider
      value={value}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context =
    useContext(TenantContext);

  if (!context) {
    throw new Error(
      "useTenant must be used inside TenantProvider"
    );
  }

  return context;
}