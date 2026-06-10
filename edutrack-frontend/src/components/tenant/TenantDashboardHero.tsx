"use client";

import { useTenant } from "../../components/providers/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import TenantName from "../../components/tenant/TenantName";
import { getBrandColor } from "../../lib/tenant-branding";

export default function TenantDashboardHero() {
  const { tenant } = useTenant();

  if (!tenant) return null;

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border p-6"
      style={{
        borderColor: `${getBrandColor(tenant)}44`,
        background: `linear-gradient(135deg, ${getBrandColor(tenant)}20, rgba(255,255,255,0.03), rgba(255,255,255,0.02))`,
      }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <TenantLogo tenant={tenant} size={64} roundedClassName="rounded-3xl" />

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
              Active Tenant
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              <TenantName tenant={tenant} />
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Branded workspace with tenant-aware visual identity.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Theme Color:{" "}
          <span className="font-semibold text-white">{tenant.themeColor || "#06b6d4"}</span>
        </div>
      </div>
    </div>
  );
}