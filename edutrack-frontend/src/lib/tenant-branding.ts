
import type { ResolvedTenant } from "../types/tenant-resolver";
import type { SchoolBrandColors } from "../types/settings";

export const DEFAULT_BRAND_NAME = "EduTrack";
export const DEFAULT_THEME_COLOR = "#06b6d4";

export const DEFAULT_BRAND_COLORS: SchoolBrandColors = {
  primary: "#06b6d4",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#172033",
};

export function getBrandName(tenant?: ResolvedTenant | null) {
  return tenant?.schoolName?.trim() || DEFAULT_BRAND_NAME;
}

export function getBrandColors(
  tenant?: ResolvedTenant | null
): SchoolBrandColors {
  return {
    ...DEFAULT_BRAND_COLORS,
    ...(tenant?.brandColors || {}),
    primary:
      tenant?.brandColors?.primary ||
      tenant?.themeColor ||
      DEFAULT_BRAND_COLORS.primary,
  };
}

export function getBrandColor(tenant?: ResolvedTenant | null) {
  return getBrandColors(tenant).primary;
}

export function getBrandSecondaryColor(
  tenant?: ResolvedTenant | null
) {
  return getBrandColors(tenant).secondary;
}

export function getBrandAccentColor(
  tenant?: ResolvedTenant | null
) {
  return getBrandColors(tenant).accent;
}

export function getBrandBackground(
  tenant?: ResolvedTenant | null
) {
  return getBrandColors(tenant).background;
}

export function getBrandSurface(
  tenant?: ResolvedTenant | null
) {
  return getBrandColors(tenant).surface;
}

export function getBrandTextColor(
  tenant?: ResolvedTenant | null
) {
  return getBrandColors(tenant).text;
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
  const colors = getBrandColors(tenant);

  return `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;
}

export function getBrandPageTitle(
  pageTitle: string,
  tenant?: ResolvedTenant | null
) {
  const brand = getBrandName(tenant);
  return `${pageTitle} • ${brand}`;
}
