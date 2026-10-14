
import { ReactNode } from "react";
import { ResolvedTenant } from "../../types/tenant-resolver";
import { hexToRgba } from "../../lib/tenant-ui";

type TenantStatCardProps = {
  tenant?: ResolvedTenant | null;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accentColor?: string;
};

export default function TenantStatCard({
  tenant,
  title,
  value,
  subtitle,
  icon,
  accentColor,
}: TenantStatCardProps) {
  const color = accentColor || tenant?.themeColor || "#06b6d4";

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: `linear-gradient(145deg, ${hexToRgba(color, 0.19)}, rgba(15,23,42,0.96) 75%)`,
        borderColor: hexToRgba(color, 0.42),
        boxShadow: `0 8px 24px ${hexToRgba(color, 0.07)}`,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: hexToRgba(color, 0.2) }}
      />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-300">
            {title}
          </p>

          {icon && (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border"
              style={{
                color,
                backgroundColor: hexToRgba(color, 0.15),
                borderColor: hexToRgba(color, 0.4),
              }}
            >
              {icon}
            </div>
          )}
        </div>

        <p className="text-3xl font-black tracking-tight text-white">
          {value}
        </p>

        {subtitle && (
          <p className="mt-2 text-sm text-slate-400">
            {subtitle}
          </p>
        )}

        <div
          className="mt-5 h-1 w-12 rounded-full transition-all duration-300 group-hover:w-20"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
