import { ResolvedTenant } from "../../types/tenant-resolver";
import {
  getBrandGradient,
  getBrandInitials,
} from "../../lib/tenant-branding";

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
  const hasLogo =
    !!tenant?.logoUrl &&
    tenant.logoUrl.trim() !== "";

  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 ${roundedClassName}`}
      style={{
        width: size,
        height: size,
        background: hasLogo
          ? "transparent"
          : getBrandGradient(tenant),
      }}
    >
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.logoUrl}
          alt={
            tenant.schoolName ||
            "School Logo"
          }
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display =
              "none";
          }}
        />
      ) : (
        <span className={textClassName}>
          {getBrandInitials(tenant)}
        </span>
      )}
    </div>
  );
}