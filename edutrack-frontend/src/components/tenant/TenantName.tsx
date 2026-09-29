"use client";

import { Tenant } from "../../types/tenant";

type TenantNameProps = {
  tenant?: Tenant | null;
  className?: string;
};

export default function TenantName({
  tenant,
  className = "",
}: TenantNameProps) {
  const name = tenant?.schoolName;

  if (!name) {
    return (
      <span className={`text-slate-400 ${className}`}>
        Unknown Tenant
      </span>
    );
  }

  return (
    <span className={`font-semibold text-white ${className}`}>
      {name}
    </span>
  );
}