"use client";

import { useTenant } from "../../components/tenant/TenantProvider";
import { getTenantButtonStyle } from "../../lib/tenant-ui";

type TenantColoredLoginButtonProps = {
  loading?: boolean;
};

export default function TenantColoredLoginButton({
  loading = false,
}: TenantColoredLoginButtonProps) {
  const { tenant } = useTenant();

  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
      style={getTenantButtonStyle(tenant)}
    >
      {loading ? "Signing in..." : "Sign in"}
    </button>
  );
}