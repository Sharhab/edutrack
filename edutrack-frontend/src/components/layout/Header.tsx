
"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../components/providers/AuthProvider";
import { useTenant } from "../../components/tenant/TenantProvider";

type HeaderProps = {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
};

function formatRole(role?: string) {
  if (!role) return "User";

  return role.replace(/_/g, " ").replace(/\b\w/g, (c) =>
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

  const [logoFailed, setLogoFailed] = useState(false);

  const logoUrl = tenant?.logoUrl?.trim() || "";
  const hasLogo = Boolean(logoUrl) && !logoFailed;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const userName =
    user?.name ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    "User";

  return (
    <header className="card mb-6 flex w-full min-w-0 flex-wrap items-center justify-between gap-3 px-3 py-4 sm:flex-nowrap sm:gap-4 sm:px-5 print:hidden">
      {/* Left: menu, school logo and school information */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* School logo remains visible for every dashboard role */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900 sm:h-14 sm:w-14">
          {hasLogo ? (
            <img
              key={logoUrl}
              src={logoUrl}
              alt={`${tenant?.schoolName || "School"} logo`}
              className="h-full w-full object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl"
              style={{
                backgroundColor: tenant?.themeColor || "#06b6d4",
              }}
              aria-label="School logo placeholder"
            >
              🏫
            </div>
          )}
        </div>

        {/* School information */}
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-base font-bold leading-snug text-white [overflow-wrap:anywhere] sm:text-lg">
            {tenant?.schoolName || "EduTrack"}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {tenant?.currentSession && (
              <span>{tenant.currentSession}</span>
            )}

            {tenant?.currentSession && tenant?.currentTerm && (
              <span aria-hidden="true">•</span>
            )}

            {tenant?.currentTerm && (
              <span>{tenant.currentTerm}</span>
            )}
          </div>

          {tenant?.principalName && (
            <p className="mt-1 break-words text-xs text-cyan-300 [overflow-wrap:anywhere]">
              Principal: {tenant.principalName}
            </p>
          )}
        </div>

        {/* Page information */}
        <div className="ml-2 hidden min-w-0 border-l border-white/10 pl-3 lg:block xl:ml-5 xl:pl-5">
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Right: user information and logout */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">{userName}</p>

          <p className="text-xs uppercase tracking-wide text-cyan-300">
            {formatRole(user?.role)}
          </p>

          {user?.email && (
            <p className="max-w-40 truncate text-[11px] text-slate-500">
              {user.email}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
