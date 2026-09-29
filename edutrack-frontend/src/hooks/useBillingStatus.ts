// hooks/useBilling.ts

import { useTenant } from "../components/tenant/TenantProvider";

export function useBilling() {
  const { tenant } = useTenant();

  const billing = tenant?.billing || {
    status: "unknown" as const,
    isTrial: false,
    daysLeft: null,
  };

  const daysLeft = billing.daysLeft ?? 0;

  return {
    isTrial: billing.status === "trial",
    isExpired: billing.status === "expired",
    isBlocked: billing.status === "blocked",
    isActive: billing.status === "active",

    daysLeft,

    showBanner:
      billing.status === "trial" &&
      daysLeft <= 7,
  };
}