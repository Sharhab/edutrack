
"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Bell,
} from "lucide-react";

import { useAuth } from "../../../components/providers/AuthProvider";
import { useTenant } from "../../../components/tenant/TenantProvider";
import TenantLogo from "../../../components/tenant/TenantLogo";

const studentLinks = [
  {
    title: "My Results",
    description: "View published academic results.",
    href: "/student/results",
    icon: BookOpen,
  },
  {
    title: "My Timetable",
    description: "Check your class schedule.",
    href: "/student/timetable",
    icon: CalendarDays,
  },
  {
    title: "My Classes",
    description: "View your class information.",
    href: "/student/classes",
    icon: ClipboardCheck,
  },
  {
    title: "Announcements",
    description: "Read school announcements.",
    href: "/student/announcements",
    icon: Bell,
  },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const studentName =
    user?.firstName?.trim() || "Student";

  const schoolName =
    tenant?.schoolName || "Your School";

  const brandColor =
    tenant?.themeColor || "#06b6d4";

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: `${brandColor}66`,
          background: `linear-gradient(125deg, ${brandColor}24, rgba(15,23,42,0.98) 65%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <TenantLogo
            tenant={tenant}
            size={56}
            roundedClassName="rounded-2xl"
          />

          <div className="min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: brandColor }}
            >
              {schoolName}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Welcome, {studentName}!
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Your academic dashboard
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-white">
          My School
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {studentLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-400/50 hover:bg-white/[0.07]"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${brandColor}20`,
                    color: brandColor,
                  }}
                >
                  <Icon size={22} />
                </div>

                <h3 className="font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">
          Academic Overview
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Your current academic period, published results,
          attendance summary, and upcoming activities will
          appear here once the student dashboard API is connected.
        </p>
      </section>
    </div>
  );
}
