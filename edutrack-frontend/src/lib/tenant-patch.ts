
import type { SchoolProfile } from "../types/settings";
import type { ResolvedTenant } from "../types/tenant-resolver";

const DEFAULT_BRAND_COLORS = {
  primary: "#06b6d4",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#172033",
};

export function mapSchoolProfileToTenantPatch(
  profile: SchoolProfile
): Partial<ResolvedTenant> {
  const brandColors = {
    ...DEFAULT_BRAND_COLORS,
    ...(profile.brandColors || {}),
    primary:
      profile.brandColors?.primary ||
      profile.themeColor ||
      DEFAULT_BRAND_COLORS.primary,
  };

  return {
    schoolName: profile.schoolName,

    // School identity
    logoUrl: profile.logoUrl,
    principalName: profile.principalName,
    motto: profile.motto,

    // Complete school-specific branding
    brandColors,
    themeColor: brandColors.primary,

    // Academic context
    currentSession: profile.currentSession,
    currentTerm: profile.currentTerm,

    // Contact information
    address: profile.address,
    phone: profile.phone,
    email: profile.email,

    // Domain information
    domain: profile.domain,
    slug: profile.slug,
    fullDomain: profile.fullDomain,
  };
}
