"use client";

import { useTenant } from "../../components/providers/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import TenantBadge from "../../components/tenant/TenantBadge";

export default function TenantLiveBrandPanel() {
  const { tenant } = useTenant();

  if (!tenant) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-4">
        <TenantLogo
          tenant={tenant}
          size={56}
          roundedClassName="rounded-3xl"
        />

        <div>
          <h3 className="text-lg font-semibold text-white">
            {tenant.schoolName}
          </h3>

          <p className="text-sm text-slate-400">
            {tenant.slug || tenant.domain || "School Portal"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <TenantBadge tenant={tenant} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Theme
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {tenant.themeColor || "#06b6d4"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Contact
          </p>

          <p className="mt-2 text-sm text-white">
            {tenant.phone || tenant.email || "-"}
          </p>
        </div>
      </div>

      {(tenant.address || tenant.principalName) && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          {tenant.principalName && (
            <p className="text-sm text-white">
              Principal: {tenant.principalName}
            </p>
          )}

          {tenant.address && (
            <p className="mt-1 text-sm text-slate-400">
              {tenant.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}