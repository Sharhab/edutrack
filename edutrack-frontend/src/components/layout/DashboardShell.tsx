"use client";

import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

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
      {/* Overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full lg:static lg:block print:hidden
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar role={role} onNavigate={closeSidebar} />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 print:w-full">
        {/* Header */}
        <div className="print:hidden">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuToggle={toggleSidebar}
          />
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}