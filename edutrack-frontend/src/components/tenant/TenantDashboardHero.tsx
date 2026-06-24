"use client";

import { useTenant } from "../../components/tenant/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import { getBrandColor } from "../../lib/tenant-branding";

export default function TenantDashboardHero() {
  const { tenant } = useTenant();

  if (!tenant) {
    return null;
  }

  const brandColor =
    tenant.themeColor ||
    getBrandColor(tenant) ||
    "#06b6d4";

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border p-6"
      style={{
        borderColor: `${brandColor}44`,
        background: `linear-gradient(
          135deg,
          ${brandColor}20,
          rgba(255,255,255,0.03),
          rgba(255,255,255,0.02)
        )`,
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <TenantLogo
            tenant={tenant}
            size={64}
            roundedClassName="rounded-3xl"
          />

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
              Active Tenant
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              {tenant.schoolName}
            </h2>

            {tenant.principalName && (
              <p className="mt-1 text-sm text-cyan-300">
                Principal: {tenant.principalName}
              </p>
            )}

            <p className="mt-2 text-sm text-slate-300">
              Branded workspace with tenant-aware visual identity.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Theme Color{" "}
            <span className="font-semibold text-white">
              {brandColor}
            </span>
          </div>

          {tenant.currentSession && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Session{" "}
              <span className="font-semibold text-white">
                {tenant.currentSession}
              </span>
            </div>
          )}

          {tenant.currentTerm && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Term{" "}
              <span className="font-semibold text-white">
                {tenant.currentTerm}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}