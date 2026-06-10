"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "../../components/layout/DashboardShell";
import TenantReactiveTitle from "../../components/tenant/TenantReactiveTitle";
import TenantGuard from "../../components/tenant/TenantGuard";
import { useAuth } from "../../components/providers/AuthProvider";
import { getDashboardRoute } from "../../lib/auth";

type UserRole = "super_admin" | "school_admin" | "teacher" | "parent";

const config: Record<
  string,
  { role: UserRole; title: string; subtitle: string }
> = {
  "/super-admin": {
    role: "super_admin",
    title: "Super Admin Dashboard",
    subtitle: "Manage tenants, plans, subscriptions, and platform growth.",
  },
  "/school-admin": {
    role: "school_admin",
    title: "School Admin Dashboard",
    subtitle: "Manage your school, staff, students, and academic activities.",
  },
  "/teacher": {
    role: "teacher",
    title: "Teacher Dashboard",
    subtitle: "Track classes, attendance, results, and announcements.",
  },
  "/parent": {
    role: "parent",
    title: "Parent Dashboard",
    subtitle: "Monitor your child’s progress, attendance, and updates.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useAuth();

  const current = useMemo(() => {
    if (pathname.startsWith("/super-admin")) return config["/super-admin"];
    if (pathname.startsWith("/school-admin")) return config["/school-admin"];
    if (pathname.startsWith("/teacher")) return config["/teacher"];
    return config["/parent"];
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;

    if (!user?.role) {
      router.replace("/login");
      return;
    }

    const correctBase = getDashboardRoute(user.role);

    if (!pathname.startsWith(correctBase)) {
      router.replace(correctBase);
    }
  }, [hydrated, user, pathname, router]);

  if (!hydrated) return null;
  if (!user?.role) return null;

  return (
    <>
      <TenantReactiveTitle pageTitle={current.title} />

      <TenantGuard>
        <DashboardShell
          role={user.role}
          title={current.title}
          subtitle={current.subtitle}
        >
          {children}
        </DashboardShell>
      </TenantGuard>
    </>
  );
}