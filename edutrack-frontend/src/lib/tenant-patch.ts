import { SchoolProfile } from "../types/settings";
import { ResolvedTenant } from "../types/tenant-resolver";

export function mapSchoolProfileToTenantPatch(
  profile: SchoolProfile
): Partial<ResolvedTenant> {
  return {
    schoolName: profile.schoolName,
    logoUrl: profile.logoUrl,
    themeColor: profile.themeColor,

    address: profile.address,
    phone: profile.phone,
    email: profile.email,

    domain: profile.domain,
    slug: profile.slug,
    fullDomain: profile.fullDomain,
  };
}