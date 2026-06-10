import { ResolvedTenant } from "../types/tenant-resolver";

export function isTenantInactive(tenant?: ResolvedTenant | null) {
  return tenant?.status === "inactive";
}

export function isTenantExpired(tenant?: ResolvedTenant | null) {
  if (tenant?.subscriptionStatus === "expired") return true;
  if (!tenant?.expiryDate) return false;

  const expiry = new Date(tenant.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;

  return expiry.getTime() < Date.now();
}

export function isTenantBlocked(tenant?: ResolvedTenant | null) {
  return isTenantInactive(tenant) || isTenantExpired(tenant);
}

export function getTenantBlockReason(tenant?: ResolvedTenant | null) {
  if (isTenantInactive(tenant)) {
    return "This school workspace is currently inactive.";
  }

  if (isTenantExpired(tenant)) {
    return "This school subscription has expired.";
  }

  return "";
}