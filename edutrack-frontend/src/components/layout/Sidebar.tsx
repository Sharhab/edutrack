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
import { useTenant } from "../../components/providers/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import TenantThemeSurface from "../../components/tenant/TenantThemeSurface";
import TenantBadge from "../../components/tenant/TenantBadge";

type SidebarProps = {
  role: UserRole;
};

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
    {
  label: "Billing",
  href: "/school-admin/billing",
  icon: CreditCard,
},
    { label: "Students", href: "/school-admin/students", icon: GraduationCap },
    { label: "Teachers", href: "/school-admin/teachers", icon: Users },
    { label: "Attendance", href: "/school-admin/attendance", icon: CalendarCheck },
    { label: "Classes", href: "/school-admin/classes", icon: Building2 },
    { label: "Results", href: "/school-admin/results", icon: BookOpen },
     
     {
    label: "Import Students",
    href: "/school-admin/students/import",
    icon: Upload,
  },

  {
  label: "Students Bulk Entry",
  href: "/school-admin/students/bulk",
  icon: Users,
},
    /* ================= REPORT CARD SYSTEM (NEW FEATURES) ================= */

    {
      label: "Report Cards",
      href: "/school-admin/results/report-cards",
      icon: FileText,
    },
    {
      label: "Class Reports",
      href: "/school-admin/results/class-reports",
      icon: GraduationCap,
    },


    /* ================================================================ */

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
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const items = navByRole[role];

  return (
    <aside className="hidden w-72 shrink-0 lg:block print:hidden">
      <div className="card sticky top-6 h-[calc(100vh-3rem)] overflow-hidden p-5 flex flex-col">

        <TenantThemeSurface tenant={tenant} />

        {/* HEADER */}
        <div className="relative mb-8 flex items-center gap-3">
          <TenantLogo tenant={tenant} size={48} roundedClassName="rounded-2xl" />
          <div>
            <p className="gradient-text text-lg font-bold">
              {tenant?.schoolName || "EduTrack"}
            </p>
            <p className="text-xs text-slate-400">
              {tenant ? "Tenant workspace" : "Premium school workspace"}
            </p>
          </div>
        </div>

        {/* ROLE CARD */}
        <div className="relative mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Active Role
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-white">
            {role.replace("_", " ")}
          </p>

          <div className="mt-3">
            <TenantBadge tenant={tenant} />
          </div>
        </div>

        {/* NAV */}
        <nav className="relative space-y-2 flex-1 overflow-y-auto pr-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                  active
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white ring-1 ring-cyan-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <div
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    active
                      ? "bg-white/10 text-cyan-300"
                      : "bg-white/[0.04] text-slate-400 group-hover:text-white"
                  )}
                >
                  <Icon size={17} />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}