
"use client";

import { useTenant } from "../../components/tenant/TenantProvider";
import TenantLogo from "../../components/tenant/TenantLogo";
import { getBrandColors } from "../../lib/tenant-branding";

export default function TenantDashboardHero() {
  const { tenant } = useTenant();

  if (!tenant) {
    return null;
  }

  const colors = getBrandColors(tenant);

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border p-6 shadow-xl"
      style={{
        borderColor: `${colors.primary}55`,
        background: `linear-gradient(
          135deg,
          ${colors.primary}24,
          ${colors.secondary}ee 65%,
          ${colors.secondary}
        )`,
        color: colors.text,
      }}
    >
      {/* Decorative accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{
          backgroundColor: `${colors.accent}35`,
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* School identity */}
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="shrink-0 rounded-3xl p-1"
            style={{
              backgroundColor: colors.surface,
              border: `2px solid ${colors.accent}`,
            }}
          >
            <TenantLogo
              tenant={tenant}
              size={64}
              roundedClassName="rounded-2xl"
            />
          </div>

          <div className="min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: colors.accent }}
            >
              School Dashboard
            </p>

            <h2
              className="mt-2 break-words text-2xl font-black sm:text-3xl"
              style={{ color: colors.surface }}
            >
              {tenant.schoolName}
            </h2>

            {tenant.principalName && (
              <p
                className="mt-1 text-sm"
                style={{ color: colors.surface }}
              >
                Principal: {tenant.principalName}
              </p>
            )}

            {tenant.motto && (
              <p
                className="mt-2 text-sm italic"
                style={{ color: colors.surface }}
              >
                {tenant.motto}
              </p>
            )}
          </div>
        </div>

        {/* Academic information */}
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[300px]">
          <div
            className="rounded-2xl border px-4 py-3"
            style={{
              backgroundColor: `${colors.surface}12`,
              borderColor: `${colors.surface}30`,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: colors.accent }}
            >
              Academic session
            </p>

            <p
              className="mt-2 text-base font-bold"
              style={{ color: colors.surface }}
            >
              {tenant.currentSession || "Not set"}
            </p>
          </div>

          <div
            className="rounded-2xl border px-4 py-3"
            style={{
              backgroundColor: `${colors.surface}12`,
              borderColor: `${colors.surface}30`,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: colors.accent }}
            >
              Current term
            </p>

            <p
              className="mt-2 text-base font-bold"
              style={{ color: colors.surface }}
            >
              {tenant.currentTerm || "Not set"}
            </p>
          </div>

          <div
            className="rounded-2xl border px-4 py-3 sm:col-span-2"
            style={{
              backgroundColor: `${colors.surface}12`,
              borderColor: `${colors.surface}30`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: colors.accent }}
              >
                Primary brand color
              </span>

              <span
                className="h-5 w-5 rounded-md border"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.surface,
                }}
              />
            </div>

            <p
              className="mt-1 text-sm font-bold"
              style={{ color: colors.surface }}
            >
              {colors.primary.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Brand accent line */}
      <div
        className="relative mt-6 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: `${colors.surface}25` }}
      >
        <div
          className="h-full w-1/3 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
      </div>
    </section>
  );
}

