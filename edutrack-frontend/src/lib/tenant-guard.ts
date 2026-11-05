
import { ResolvedTenant } from "../types/tenant-resolver";

// Only schools deliberately deactivated by the platform
// should be blocked from tenant login resolution.
export function isTenantInactive(
  tenant?: ResolvedTenant | null
) {
  return tenant?.status === "inactive";
}

// Expiry is a billing restriction, not a reason to
// prevent administrators from reaching the login page.
export function isTenantExpired(
  tenant?: ResolvedTenant | null
) {
  if (tenant?.subscriptionStatus === "expired") {
    return true;
  }

  if (!tenant?.expiryDate) return false;

  const expiry = new Date(tenant.expiryDate);

  if (Number.isNaN(expiry.getTime())) return false;

  return expiry.getTime() < Date.now();
}

export function isTenantBlocked(
  tenant?: ResolvedTenant | null
) {
  return isTenantInactive(tenant);
}

export function getTenantBlockReason(
  tenant?: ResolvedTenant | null
) {
  if (isTenantInactive(tenant)) {
    return "This school workspace is currently unavailable. Please contact EduTrack support.";
  }

  return "";
}
