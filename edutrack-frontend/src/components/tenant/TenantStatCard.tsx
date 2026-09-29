import { ReactNode } from "react";
import { ResolvedTenant } from "../../types/tenant-resolver";
import { getTenantSoftCardStyle } from "../../lib/tenant-ui";

type TenantStatCardProps = {
  tenant?: ResolvedTenant | null;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
};

export default function TenantStatCard({
  tenant,
  title,
  value,
  subtitle,
  icon,
}: TenantStatCardProps) {
  return (
    <div
      className="rounded-3xl border p-6"
      style={getTenantSoftCardStyle(tenant)}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {icon ? <div className="text-white">{icon}</div> : null}
      </div>

      <p className="text-3xl font-black text-white">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}