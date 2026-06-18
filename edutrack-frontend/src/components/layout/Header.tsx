"use client";

import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../components/providers/AuthProvider";
import { useTenant } from "../../components/providers/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import TenantBadge from "../../components/tenant/TenantBadge";

type HeaderProps = {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
};

export default function Header({
  title,
  subtitle,
  onMenuToggle,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();

  return (
    <header className="card mb-6 flex items-center justify-between gap-4 px-5 py-4 print:hidden">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* LOGO */}
        <TenantLogo
          tenant={tenant}
          size={44}
          roundedClassName="rounded-2xl"
        />

        {/* SCHOOL INFO */}
        <div className="leading-tight">
          <p className="text-xs text-slate-400">School</p>

          <h2 className="text-sm font-semibold text-white">
            {tenant?.schoolName || "EduTrack School"}
          </h2>

          <div className="mt-1">
            <TenantBadge tenant={tenant} />
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="ml-4 hidden border-l border-white/10 pl-4 md:block">
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">
            {user?.name ?? "User"}
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {user?.role?.replace("_", " ")}
          </p>
          <p className="text-[11px] text-slate-500">{user?.email ?? ""}</p>
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