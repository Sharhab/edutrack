"use client";

import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Tenant } from "../../types/tenant";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2, Settings } from "lucide-react";
import PlanBadge from "../../components/tenants/PlanBadge";

type TenantsTableProps = {
  data: Tenant[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onControl: (tenant: Tenant) => void;
};

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
        description="Schools you onboard will appear here."
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
            <div>
              <p className="font-semibold text-white">
                {row.schoolName}
              </p>
              <p className="text-xs text-slate-400">
                {row.adminEmail}
              </p>
            </div>
          ),
        },
        {
          key: "slug",
          title: "Slug",
          render: (row: Tenant) => row.slug || "-",
        },
        {
          key: "adminName",
          title: "Admin",
          render: (row: Tenant) => row.adminName || "-",
        },
        {
          key: "plan",
          title: "Plan",
          render: (row: Tenant) => (
            <PlanBadge plan={row.plan} />
          ),
        },
        {
          key: "status",
          title: "Status",
          render: (row: Tenant) => (
            <Badge
              label={row.status}
              variant={
                row.status === "active"
                  ? "success"
                  : "warning"
              }
            />
          ),
        },
        {
          key: "expiryDate",
          title: "Expiry",
          render: (row: Tenant) =>
            formatDate(row.expiryDate),
        },
        {
          key: "createdAt",
          title: "Created",
          render: (row: Tenant) =>
            formatDate(row.createdAt),
        },
        {
          key: "actions",
          title: "Actions",
          render: (row: Tenant) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onControl(row)}
                className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-300 transition hover:bg-cyan-500/20"
                title="Manage Tenant"
              >
                <Settings size={16} />
              </button>

              <button
                type="button"
                onClick={() => onEdit(row)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                title="Edit Tenant"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(row)}
                className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                title="Delete Tenant"
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