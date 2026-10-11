
"use client";

import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Tenant } from "../../types/tenant";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2, Settings, ExternalLink } from "lucide-react";
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
    normalized === "active" || normalized === "paid"
      ? "success"
      : normalized === "expired" ||
          normalized === "cancelled" ||
          normalized === "inactive"
        ? "warning"
        : "neutral";

  return <Badge label={label.replaceAll("_", " ")} variant={variant} />;
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
              <span className="text-slate-500">Not configured</span>
            ),
        },
        {
          key: "adminName",
          title: "Principal / Admin",
          render: (row: Tenant) => row.adminName || "Not provided",
        },
        {
          key: "plan",
          title: "Plan",
          render: (row: Tenant) => <PlanBadge plan={row.plan} />,
        },
        {
          key: "access",
          title: "Access",
          render: (row: Tenant) => (
            <StatusBadge label={row.isActive ? "active" : "inactive"} />
          ),
        },
        {
          key: "subscriptionStatus",
          title: "Subscription",
          render: (row: Tenant) => (
            <div className="space-y-1">
              <StatusBadge label={row.subscriptionStatus || "unknown"} />
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
            <StatusBadge label={row.billingStatus || "unknown"} />
          ),
        },
        {
          key: "expiryDate",
          title: "Expires / Trial Ends",
          render: (row: Tenant) => (
            <span className="whitespace-nowrap">
              {formatDate(row.expiryDate)}
            </span>
          ),
        },
        {
          key: "createdAt",
          title: "Registered",
          render: (row: Tenant) => (
            <span className="whitespace-nowrap">
              {formatDate(row.createdAt)}
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
