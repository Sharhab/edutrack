import { ResolvedTenant } from "../types/tenant-resolver";
import { getBrandColor } from "../lib/tenant-branding";

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");

  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const num = Number.parseInt(normalized, 16);

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getTenantButtonStyle(tenant?: ResolvedTenant | null) {
  const color = getBrandColor(tenant);

  return {
    background: `linear-gradient(135deg, ${color}, #3b82f6, #8b5cf6)`,
    boxShadow: `0 10px 25px ${hexToRgba(color, 0.25)}`,
  };
}

export function getTenantSoftCardStyle(tenant?: ResolvedTenant | null) {
  const color = getBrandColor(tenant);

  return {
    background: `linear-gradient(180deg, ${hexToRgba(color, 0.12)}, rgba(255,255,255,0.03))`,
    borderColor: hexToRgba(color, 0.28),
  };
}

export function getTenantRingStyle(tenant?: ResolvedTenant | null) {
  const color = getBrandColor(tenant);

  return {
    boxShadow: `0 0 0 1px ${hexToRgba(color, 0.35)}`,
  };
}