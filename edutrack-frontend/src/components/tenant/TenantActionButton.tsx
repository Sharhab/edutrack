"use client";

import { ButtonHTMLAttributes } from "react";
import { useTenant } from "../../components/providers/TenantProvider";
import { getTenantButtonStyle } from "../../lib/tenant-ui";

type TenantActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export default function TenantActionButton({
  label,
  className = "",
  ...props
}: TenantActionButtonProps) {
  const { tenant } = useTenant();

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70 ${className}`}
      style={getTenantButtonStyle(tenant)}
    >
      {label}
    </button>
  );
}