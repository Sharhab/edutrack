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
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Header({
  title,
  subtitle,
  onMenuToggle,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();

  const userName =
    user?.name ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    "User";

  return (
    <header className="card mb-6 flex items-center justify-between gap-4 px-5 py-4 print:hidden">
      {/* LEFT SIDE */}
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
            alt={tenant.schoolName}
            className="h-14 w-14 rounded-2xl object-cover border border-white/10"
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{
              background:
                tenant?.themeColor || "#06b6d4",
            }}
          >
            🏫
          </div>
        )}

        {/* SCHOOL INFO */}
        <div>
          <h2 className="text-lg font-bold text-white">
            {tenant?.schoolName || " "}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {tenant?.currentSession && (
              <span>{tenant.currentSession}</span>
            )}

            {tenant?.currentTerm && (
              <>
                <span>•</span>
                <span>{tenant.currentTerm}</span>
              </>
            )}
          </div>

          {tenant?.principalName && (
            <p className="text-xs text-cyan-300">
              Principal: {tenant.principalName}
            </p>
          )}
        </div>

        {/* PAGE TITLE */}
        <div className="ml-5 hidden border-l border-white/10 pl-5 md:block">
          <h1 className="text-lg font-bold text-white">
            {title}
          </h1>

          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">
            {userName}
          </p>

          <p className="text-xs uppercase tracking-wide text-cyan-300">
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