"use client";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { UserRole } from "../../types/auth";

type DashboardShellProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function DashboardShell({
  role,
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  return (
    <div
      className="
        mx-auto
        flex
        min-h-screen
        max-w-[1600px]
        gap-6
        px-4
        py-6
        md:px-6

        print:block
        print:max-w-none
        print:p-0
      "
    >
      {/* Hide sidebar when printing */}
      <div className="print:hidden">
        <Sidebar role={role} />
      </div>

      <main className="min-w-0 flex-1 print:w-full">
        {/* Hide dashboard header when printing */}
        <div className="print:hidden">
          <Header
            title={title}
            subtitle={subtitle}
          />
        </div>

        {children}
      </main>
    </div>
  );
}