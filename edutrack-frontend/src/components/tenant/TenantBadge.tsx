import { ResolvedTenant } from "../../types/tenant-resolver";
import { getBrandColor, getBrandName } from "../../lib/tenant-branding";

type TenantBadgeProps = {
  tenant?: ResolvedTenant | null;
};

export default function TenantBadge({ tenant }: TenantBadgeProps) {
  if (!tenant) return null;

  return (
    <span
      className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-white"
      style={{
        background: `${getBrandColor(tenant)}22`,
        borderColor: `${getBrandColor(tenant)}55`,
      }}
    >
      {getBrandName(tenant)}
    </span>
  );
}