// hooks/useBilling.ts

import { useTenant } from "../components/providers/TenantProvider";

export function useBilling() {
  const { tenant } = useTenant();

  const billing = tenant?.billing || {
    status: "unknown",
    isTrial: false,
    daysLeft: null,
  };

  return {
    isTrial: billing.status === "trial",
    isExpired: billing.status === "expired",
    isBlocked: billing.status === "blocked",
    isActive: billing.status === "active",

    daysLeft: billing.daysLeft ?? 0,

    showBanner:
      billing.status === "trial" &&
      billing.daysLeft <= 7,
  };
}