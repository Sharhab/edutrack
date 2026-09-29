import { ResolvedTenant } from "../types/tenant-resolver";

export const DEFAULT_BRAND_NAME = "EduTrack";
export const DEFAULT_THEME_COLOR = "#06b6d4";

export function getBrandName(tenant?: ResolvedTenant | null) {
  return tenant?.schoolName?.trim() || DEFAULT_BRAND_NAME;
}

export function getBrandColor(tenant?: ResolvedTenant | null) {
  return tenant?.themeColor?.trim() || DEFAULT_THEME_COLOR;
}

export function getBrandInitials(tenant?: ResolvedTenant | null) {
  const name = getBrandName(tenant);

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getBrandGradient(tenant?: ResolvedTenant | null) {
  const color = getBrandColor(tenant);
  return `linear-gradient(135deg, ${color}, #3b82f6, #8b5cf6)`;
}

export function getBrandPageTitle(
  pageTitle: string,
  tenant?: ResolvedTenant | null
) {
  const brand = getBrandName(tenant);
  return `${pageTitle} • ${brand}`;
}