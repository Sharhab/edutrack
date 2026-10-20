

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
import {
  getSchoolProfile, 
  getSchoolBranding,
} from "../../lib/settings";
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
  const [tenant, setTenantState] = useState<ResolvedTenant | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const {
    user,
    token,
    hydrated: authHydrated,
  } = useAuth();

  // Restore the previously resolved tenant from local storage.
  useEffect(() => {
    try {
      setTenantState(getResolvedTenant());
    } catch (error) {
      console.error("Failed to restore tenant:", error);
    } finally {
      setHydrated(true);
    }
  }, []);
 
  useEffect(() => {
  if (!authHydrated || !token || !user) return;

  if (
    user.role !== "teacher" &&
    user.role !== "parent"
  ) {
    return;
  }

  if (!user.schoolId) return;

  let cancelled = false;

  async function loadBranding() {
    try {
      const branding = await getSchoolBranding();

      if (cancelled) return;

      setTenantState((previous) => {
        const updated = {
          ...(previous ?? {}),
          ...branding,
        } as ResolvedTenant;

        saveResolvedTenant(updated);
        return updated;
      });
    } catch (error) {
      if (!cancelled) {
        console.error("Failed to load teacher/parent branding:", error);
      }
    }
  }

  void loadBranding();

  return () => {
    cancelled = true;
  };
}, [authHydrated, token, user]);
  // Keep the existing public context API.
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

  // Allow patches to initialize tenant state when it is empty.
  const patchTenant = useCallback(
    (updates: Partial<ResolvedTenant>) => {
      setTenantState((previous) => {
        const updated = {
          ...(previous ?? {}),
          ...updates,
        } as ResolvedTenant;

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

  // Load authoritative branding after school-admin authentication.
  useEffect(() => {
    if (!authHydrated || !token || !user) return;
    if (user.role !== "school_admin" || !user.schoolId) return;

    let cancelled = false;

    async function loadSchoolBranding() {
      try {
        const profile = await getSchoolProfile();

        if (cancelled) return;

        const updates: Partial<ResolvedTenant> = {
          schoolName: profile.schoolName,
          slug: profile.slug,
          domain: profile.domain,
          fullDomain: profile.fullDomain,
          logoUrl: profile.logoUrl,
          themeColor: profile.themeColor,
          principalName: profile.principalName,
          currentSession: profile.currentSession,
          currentTerm: profile.currentTerm,
          address: profile.address,
          phone: profile.phone,
          email: profile.email,
        };

        setTenantState((previous) => {
          const updated = {
            ...(previous ?? {}),
            ...updates,
          } as ResolvedTenant;

          try {
            saveResolvedTenant(updated);
          } catch (error) {
            console.error("Failed to save school branding:", error);
          }

          return updated;
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load authenticated school branding:",
            error
          );
        }
      }
    }

    void loadSchoolBranding();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, token, user]);

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      patchTenant,
      clearTenant,
    }),
    [tenant, setTenant, patchTenant, clearTenant]
  );

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
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
}
