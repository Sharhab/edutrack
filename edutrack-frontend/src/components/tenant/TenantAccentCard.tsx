import { ReactNode } from "react";
import { ResolvedTenant } from "../../types/tenant-resolver";
import { getTenantSoftCardStyle, getTenantRingStyle } from "../../lib/tenant-ui";

type TenantAccentCardProps = {
  tenant?: ResolvedTenant | null;
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function TenantAccentCard({
  tenant,
  title,
  description,
  children,
}: TenantAccentCardProps) {
  return (
    <div
      className="rounded-3xl border p-6"
      style={{
        ...getTenantSoftCardStyle(tenant),
        ...getTenantRingStyle(tenant),
      }}
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}