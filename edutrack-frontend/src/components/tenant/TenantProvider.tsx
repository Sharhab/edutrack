


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
import type { SchoolBrandColors } from "../../types/settings";

import {
  getResolvedTenant,
  saveResolvedTenant,
} from "../../lib/tenant-storage";

import {
  getSchoolProfile,
  getSchoolBranding,
} from "../../lib/settings";

import { mapSchoolProfileToTenantPatch } from "../../lib/tenant-patch";
import { useAuth } from "../providers/AuthProvider";

type TenantContextType = {
  tenant: ResolvedTenant | null;
  setTenant: (tenant: ResolvedTenant | null) => void;
  patchTenant: (updates: Partial<ResolvedTenant>) => void;
  clearTenant: () => void;
};

const TenantContext = createContext<TenantContextType | null>(null);

const DEFAULT_BRAND_COLORS: SchoolBrandColors = {
  primary: "#06b6d4",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#172033",
};

function normalizeBranding(
  branding: Partial<ResolvedTenant>
): Partial<ResolvedTenant> {
  const brandColors: SchoolBrandColors = {
    ...DEFAULT_BRAND_COLORS,
    ...(branding.brandColors || {}),
    primary:
      branding.brandColors?.primary ||
      branding.themeColor ||
      DEFAULT_BRAND_COLORS.primary,
  };

  return {
    ...branding,
    brandColors,
    themeColor: brandColors.primary,
  };
}

type TenantProviderProps = {
  children: React.ReactNode;
};

export function TenantProvider({
  children,
}: TenantProviderProps) {
  const [tenant, setTenantState] = useState<ResolvedTenant | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const {
    user,
    token,
    hydrated: authHydrated,
  } = useAuth();

  // Restore previously resolved tenant.
  useEffect(() => {
    try {
      const savedTenant = getResolvedTenant();

      setTenantState(
        savedTenant
          ? ({
              ...savedTenant,
              ...normalizeBranding(savedTenant),
            } as ResolvedTenant)
          : null
      );
    } catch (error) {
      console.error("Failed to restore tenant:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Keep the public tenant context API.
  const setTenant = useCallback(
    (nextTenant: ResolvedTenant | null) => {
      const normalizedTenant = nextTenant
        ? ({
            ...nextTenant,
            ...normalizeBranding(nextTenant),
          } as ResolvedTenant)
        : null;

      setTenantState(normalizedTenant);

      try {
        saveResolvedTenant(normalizedTenant);
      } catch (error) {
        console.error("Failed to save tenant:", error);
      }
    },
    []
  );

  // Update only the current authenticated tenant context.
  const patchTenant = useCallback(
    (updates: Partial<ResolvedTenant>) => {
      setTenantState((previous) => {
        const normalizedUpdates = normalizeBranding(updates);

        const updated = {
          ...(previous ?? {}),
          ...normalizedUpdates,
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

  // Load authoritative branding for teachers and parents.
  useEffect(() => {
    if (!authHydrated || !token || !user) return;

    if (user.role !== "teacher" && user.role !== "parent") {
      return;
    }

    if (!user.schoolId) return;

    let cancelled = false;

    async function loadTeacherParentBranding() {
      try {
        const branding = await getSchoolBranding();

        if (cancelled) return;

        setTenantState((previous) => {
          const normalizedBranding = normalizeBranding(
            branding as Partial<ResolvedTenant>
          );

          const updated = {
            ...(previous ?? {}),
            ...normalizedBranding,
          } as ResolvedTenant;

          try {
            saveResolvedTenant(updated);
          } catch (error) {
            console.error(
              "Failed to save teacher/parent branding:",
              error
            );
          }

          return updated;
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load teacher/parent branding:",
            error
          );
        }
      }
    }

    void loadTeacherParentBranding();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, token, user]);

  // Load authoritative branding for school administrators.
  useEffect(() => {
    if (!authHydrated || !token || !user) return;

    if (user.role !== "school_admin" || !user.schoolId) {
      return;
    }

    let cancelled = false;

    async function loadSchoolAdminBranding() {
      try {
        const profile = await getSchoolProfile();

        if (cancelled) return;

        const updates = normalizeBranding(
          mapSchoolProfileToTenantPatch(profile)
        );

        setTenantState((previous) => {
          const updated = {
            ...(previous ?? {}),
            ...updates,
          } as ResolvedTenant;

          try {
            saveResolvedTenant(updated);
          } catch (error) {
            console.error(
              "Failed to save school-admin branding:",
              error
            );
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

    void loadSchoolAdminBranding();

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
