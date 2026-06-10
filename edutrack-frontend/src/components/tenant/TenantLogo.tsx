import { ResolvedTenant } from "../../types/tenant-resolver";
import { getBrandGradient, getBrandInitials } from "../../lib/tenant-branding";

type TenantLogoProps = {
  tenant?: ResolvedTenant | null;
  size?: number;
  roundedClassName?: string;
  textClassName?: string;
};

export default function TenantLogo({
  tenant,
  size = 48,
  roundedClassName = "rounded-2xl",
  textClassName = "text-white font-bold",
}: TenantLogoProps) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${roundedClassName} ${textClassName}`}
      style={{
        width: size,
        height: size,
        background: getBrandGradient(tenant),
      }}
    >
      {tenant?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.logoUrl}
          alt={tenant.schoolName || "Tenant Logo"}
          className="h-full w-full object-cover"
        />
      ) : (
        getBrandInitials(tenant)
      )}
    </div>
  );
}