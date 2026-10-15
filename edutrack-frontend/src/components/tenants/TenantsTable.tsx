
"use client";

import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Tenant } from "../../types/tenant";
import { formatDate } from "../../lib/utils";
import {
  Pencil,
  Trash2,
  Settings,
  ExternalLink,
} from "lucide-react";
import PlanBadge from "../../components/tenants/PlanBadge";

type TenantsTableProps = {
  data: Tenant[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onControl: (tenant: Tenant) => void;
};

function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();

  const variant =
    ["active", "paid", "connected", "verified"].includes(normalized)
      ? "success"
      : [
          "expired",
          "cancelled",
          "inactive",
          "not connected",
          "unverified",
        ].includes(normalized)
        ? "warning"
        : "neutral";

  return (
    <Badge
      label={label.replaceAll("_", " ")}
      variant={variant}
    />
  );
}

function getTenantWarnings(row: Tenant): string[] {
  const warnings: string[] = [];
  const now = new Date();

  const subscriptionExpiry = row.subscriptionExpiresAt
    ? new Date(row.subscriptionExpiresAt)
    : null;

  const trialExpiry = row.trialEndsAt
    ? new Date(row.trialEndsAt)
    : null;

  if (
    subscriptionExpiry &&
    !Number.isNaN(subscriptionExpiry.getTime()) &&
    subscriptionExpiry < now &&
    row.subscriptionStatus === "active"
  ) {
    warnings.push("Subscription expired, but status is active");
  }

  if (
    trialExpiry &&
    !Number.isNaN(trialExpiry.getTime()) &&
    trialExpiry < now &&
    row.subscriptionStatus === "trial"
  ) {
    warnings.push("Trial has expired");
  }

  if (
    row.subscriptionStatus === "active" &&
    !row.isActive
  ) {
    warnings.push("Subscription active, but access is disabled");
  }

  if (
    row.billingStatus === "pending_payment" &&
    row.subscriptionStatus === "active"
  ) {
    warnings.push("Active subscription has pending billing");
  }

  return warnings;
}

export default function TenantsTable({
  data,
  onEdit,
  onDelete,
  onControl,
}: TenantsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No tenants found"
        description="No schools match your search. Clear the search or onboard a school."
      />
    );
  }

  return (
    <DataTable
      data={data}
      columns={[
        {
          key: "school",
          title: "School",
          render: (row: Tenant) => (
            <div className="min-w-44">
              <p className="font-semibold capitalize text-white">
                {row.schoolName}
              </p>
              <p className="text-xs text-slate-400">
                {row.email || row.adminEmail || "No email"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {row.phone || "No phone"}
              </p>
            </div>
          ),
        },
        {
          key: "domain",
          title: "School Domain",
          render: (row: Tenant) =>
            row.domain ? (
              <a
                href={
                  row.domain.startsWith("http")
                    ? row.domain
                    : `https://${row.domain}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-52 items-center gap-1 break-all text-cyan-300 hover:text-cyan-200"
              >
                {row.domain}
                <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-slate-500">
                Not configured
              </span>
            ),
        },
        {
          key: "adminName",
          title: "Principal / Admin",
          render: (row: Tenant) =>
            row.principalName || row.adminName || "Not provided",
        },
        {
          key: "plan",
          title: "Plan",
          render: (row: Tenant) => (
            <PlanBadge plan={row.plan} />
          ),
        },
        {
          key: "access",
          title: "Access",
          render: (row: Tenant) => (
            <StatusBadge
              label={row.isActive ? "active" : "inactive"}
            />
          ),
        },
        {
          key: "subscriptionStatus",
          title: "Subscription",
          render: (row: Tenant) => (
            <div className="space-y-1">
              <StatusBadge
                label={row.subscriptionStatus || "unknown"}
              />
              <p className="text-xs text-slate-500">
                {row.billingCycle || "monthly"}
              </p>
            </div>
          ),
        },
        {
          key: "billingStatus",
          title: "Billing",
          render: (row: Tenant) => (
            <StatusBadge
              label={row.billingStatus || "unknown"}
            />
          ),
        },
        {
          key: "trialEndsAt",
          title: "Trial Ends",
          render: (row: Tenant) => (
            <span className="whitespace-nowrap">
              {row.trialEndsAt
                ? formatDate(row.trialEndsAt)
                : "—"}
            </span>
          ),
        },
        {
          key: "subscriptionExpiresAt",
          title: "Subscription Expires",
          render: (row: Tenant) => (
            <span className="whitespace-nowrap">
              {row.subscriptionExpiresAt
                ? formatDate(row.subscriptionExpiresAt)
                : "No expiry set"}
            </span>
          ),
        },
        {
          key: "paystack",
          title: "School Paystack",
          render: (row: Tenant) => (
            <div className="min-w-32 space-y-1">
              <StatusBadge
                label={
                  row.paystackConnected
                    ? "connected"
                    : "not connected"
                }
              />
              {row.paystackConnected && (
                <StatusBadge
                  label={
                    row.paystackVerified
                      ? "verified"
                      : "unverified"
                  }
                />
              )}
              {row.settlementBank && (
                <p className="text-xs text-slate-400">
                  {row.settlementBank}
                </p>
              )}
              {row.accountNumberLast4 && (
                <p className="text-xs text-slate-500">
                  Account ending {row.accountNumberLast4}
                </p>
              )}
            </div>
          ),
        },
        {
          key: "warnings",
          title: "Alerts",
          render: (row: Tenant) => {
            const warnings = getTenantWarnings(row);

            return warnings.length > 0 ? (
              <div className="max-w-64 space-y-1">
                {warnings.map((warning) => (
                  <p
                    key={warning}
                    className="text-xs text-amber-300"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                No detected issues
              </span>
            );
          },
        },
        {
          key: "createdAt",
          title: "Registered",
          render: (row: Tenant) => (
            <span className="whitespace-nowrap">
              {row.createdAt
                ? formatDate(row.createdAt)
                : "—"}
            </span>
          ),
        },
        {
          key: "actions",
          title: "Manage",
          render: (row: Tenant) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onControl(row)}
                className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-300 transition hover:bg-cyan-500/20"
                title="Manage access and subscription"
                aria-label={`Manage ${row.schoolName}`}
              >
                <Settings size={16} />
              </button>

              <button
                type="button"
                onClick={() => onEdit(row)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                title="Edit tenant"
                aria-label={`Edit ${row.schoolName}`}
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(row)}
                className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                title="Delete tenant"
                aria-label={`Delete ${row.schoolName}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ]}
    />
  );
}
