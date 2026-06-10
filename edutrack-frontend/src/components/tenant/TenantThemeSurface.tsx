import { ResolvedTenant } from "../../types/tenant-resolver";
import { getBrandGradient } from "../../lib/tenant-branding";

type TenantThemeSurfaceProps = {
  tenant?: ResolvedTenant | null;
};

export default function TenantThemeSurface({
  tenant,
}: TenantThemeSurfaceProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-28 blur-3xl opacity-25"
      style={{
        background: getBrandGradient(tenant),
      }}
    />
  );
}