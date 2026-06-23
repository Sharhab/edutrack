"use client";

import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../components/providers/AuthProvider";
import { useTenant } from "../../components/providers/TenantProvider";

type HeaderProps = {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
};

function formatRole(role?: string) {
  if (!role) return "User";

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );
}

export default function Header({
  title,
  subtitle,
  onMenuToggle,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();

  const schoolName =
    tenant?.schoolName ||
    "EduTrack School";

  const userName =
    user?.name ||
    `${user?.firstName ?? ""} ${
      user?.lastName ?? ""
    }`.trim() ||
    "User";

  return (
    <header className="card mb-6 flex items-center justify-between gap-4 px-5 py-4 print:hidden">

      {/* LEFT */}
      <div className="flex items-center gap-4">

        {/* MOBILE MENU */}
        <button
          onClick={onMenuToggle}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* SCHOOL LOGO */}
        {tenant?.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={schoolName}
            className="h-14 w-14 rounded-2xl object-cover border border-white/10"
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{
              background:
                tenant?.themeColor ||
                "#06b6d4",
            }}
          >
            {schoolName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
        )}

        {/* SCHOOL DETAILS */}
        <div className="leading-tight">
          <p className="text-xs text-slate-400">
            School
          </p>

          <h2 className="text-sm font-semibold text-white">
            {schoolName}
          </h2>

          <p className="text-xs text-slate-400">
            {tenant?.principalName ||
              "Principal"}
          </p>

          <div className="mt-1 flex gap-2 text-[11px] text-cyan-300">
            {tenant?.currentSession && (
              <span>
                {tenant.currentSession}
              </span>
            )}

            {tenant?.currentTerm && (
              <span>
                • {tenant.currentTerm}
              </span>
            )}
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="ml-4 hidden border-l border-white/10 pl-4 md:block">
          <h1 className="text-lg font-bold text-white">
            {title}
          </h1>

          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">
            {userName}
          </p>

          <p className="text-xs uppercase tracking-wide text-slate-400">
            {formatRole(user?.role)}
          </p>

          {user?.email && (
            <p className="text-[11px] text-slate-500">
              {user.email}
            </p>
          )}
        </div>

        <button
          onClick={logout}
          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}