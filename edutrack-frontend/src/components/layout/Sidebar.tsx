"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import { UserRole } from "../../types/auth";
import { useTenant } from "../../components/tenant/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import TenantThemeSurface from "../../components/tenant/TenantThemeSurface";
import TenantBadge from "../../components/tenant/TenantBadge";

type SidebarProps = {
  role: UserRole;
  onNavigate?: () => void;
};

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =========================================
   NAV CONFIG
========================================= */
const navByRole: Record<
  UserRole,
  { label: string; href: string; icon: React.ElementType }[]
> = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin", icon: Shield },
    { label: "Tenants", href: "/super-admin/tenants", icon: Building2 },
    { label: "Billing", href: "/super-admin/billing", icon: CreditCard },
    { label: "Invoices", href: "/super-admin/invoices", icon: FileText },
  ],

  school_admin: [
    { label: "Dashboard", href: "/school-admin", icon: LayoutDashboard },
    { label: "Billing", href: "/school-admin/billing", icon: CreditCard },
    { label: "Students", href: "/school-admin/students", icon: GraduationCap },
    { label: "Teachers", href: "/school-admin/teachers", icon: Users },
    { label: "Attendance", href: "/school-admin/attendance", icon: CalendarCheck },
    { label: "Classes", href: "/school-admin/classes", icon: Building2 },
    { label: "Results", href: "/school-admin/results", icon: BookOpen },
    { label: "Import Students", href: "/school-admin/students/import", icon: Upload },
    { label: "Bulk Entry", href: "/school-admin/students/bulk", icon: Users },
    { label: "Report Cards", href: "/school-admin/results/report-cards", icon: FileText },
    { label: "Class Reports", href: "/school-admin/results/class-reports", icon: GraduationCap },
    { label: "Parents", href: "/school-admin/parents", icon: Users },
    { label: "Announcements", href: "/school-admin/announcements", icon: Bell },
    { label: "Settings", href: "/school-admin/settings", icon: Settings },
  ],

  teacher: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "My Classes", href: "/teacher/students", icon: GraduationCap },
    { label: "Result Entry", href: "/teacher/results/entry", icon: BookOpen },
    { label: "Announcements", href: "/teacher/announcements", icon: Bell },
  ],

  parent: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "My Children", href: "/parent/children", icon: GraduationCap },
    { label: "Results", href: "/parent/results", icon: BookOpen },
    { label: "Announcements", href: "/parent/announcements", icon: Bell },
  ],

  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "My Classes", href: "/student/classes", icon: GraduationCap },
    { label: "Results", href: "/student/results", icon: BookOpen },
    { label: "Announcements", href: "/student/announcements", icon: Bell },
  ],
};

export default function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const items = navByRole[role];

  return (
    <aside className="relative h-full w-72 overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl">
      {/* THEME LAYER */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <TenantThemeSurface tenant={tenant} />
      </div>

      <div className="relative flex h-full flex-col p-5">
        {/* HEADER */}
<div className="mb-8 flex items-center gap-4">
  {tenant?.logoUrl ? (
    <img
      src={tenant.logoUrl}
      alt={tenant.schoolName}
      className="h-14 w-14 rounded-2xl object-cover border border-white/10"
    />
  ) : (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
      style={{
        background:
          tenant?.themeColor || "#06b6d4",
      }}
    >
      🏫
    </div>
  )}

  <div className="min-w-0">
    <p className="truncate text-base font-bold text-white">
      {tenant?.schoolName || "EduTrack"}
    </p>

    <p className="text-xs text-slate-400">
      {tenant?.currentSession || ""}
    </p>

    <p className="text-xs text-cyan-300">
      {tenant?.currentTerm || ""}
    </p>
  </div>
</div>

        {/* ROLE CARD */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Active Role
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {formatRole(role)}
          </p>

          <div className="mt-3">
            <TenantBadge tenant={tenant} />
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          {items.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                  active
                    ? "bg-cyan-500/20 text-white ring-1 ring-cyan-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}