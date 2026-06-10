"use client";

import { ReactNode } from "react";
import { useTenant } from "../providers/TenantProvider";
import TenantBlockedState from "./TenantBlockedState";
import {
  isTenantBlocked,
  getTenantBlockReason,
} from "../../lib/tenant-guard";

type TenantGuardProps = {
  children: ReactNode;
};

export default function TenantGuard({ children }: TenantGuardProps) {
  const { tenant } = useTenant();

  // If no tenant (e.g. super admin), allow access
  if (!tenant) {
    return <>{children}</>;
  }

  // If tenant is blocked (inactive or expired), stop access
  if (isTenantBlocked(tenant)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <TenantBlockedState
          title="Workspace Unavailable"
          description={getTenantBlockReason(tenant)}
        />
      </div>
    );
  }

  // Otherwise allow access
  return <>{children}</>;
}