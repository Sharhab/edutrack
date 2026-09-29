"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import { Subscription } from "../../types/billing";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import PlanBadge from "../../components/tenants/PlanBadge";
import BillingStatusBadge from "../../components/billing/BillingStatusBadge";

type SubscriptionsTableProps = {
  data: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
};

export default function SubscriptionsTable({
  data,
  onEdit,
  onDelete,
}: SubscriptionsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No subscriptions found"
        description="School subscriptions will appear here."
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
          render: (row) => row.schoolName || row.tenantId,
        },
        {
          key: "plan",
          title: "Plan",
          render: (row) => <PlanBadge plan={row.plan} />,
        },
        {
          key: "amount",
          title: "Amount",
          render: (row) => `₦${row.amount.toLocaleString()}`,
        },
        {
          key: "cycle",
          title: "Cycle",
          render: (row) => row.billingCycle,
        },
        {
          key: "status",
          title: "Status",
          render: (row) => <BillingStatusBadge status={row.status} />,
        },
        {
          key: "renewal",
          title: "Renewal",
          render: (row) => formatDate(row.nextRenewalDate),
        },
        {
          key: "expiry",
          title: "Expiry",
          render: (row) => formatDate(row.expiryDate),
        },
        {
          key: "actions",
          title: "Actions",
          render: (row) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(row)}
                className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
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