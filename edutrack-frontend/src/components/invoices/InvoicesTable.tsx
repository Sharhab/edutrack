"use client";

import Link from "next/link";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import InvoiceStatusBadge from "../../components/invoices/InvoiceStatusBadge";
import { Invoice } from "../../types/invoice";
import { formatDate } from "../../lib/utils";

type InvoicesTableProps = {
  data: Invoice[];
};

export default function InvoicesTable({ data }: InvoicesTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No invoices found"
        description="Invoices will appear here after billing records are created."
      />
    );
  }

  return (
    <DataTable
      data={data}
      columns={[
        {
          key: "invoiceNumber",
          title: "Invoice No.",
          render: (row) => (
            <div>
              <p className="font-semibold text-white">{row.invoiceNumber}</p>
              <p className="text-xs text-slate-400">{row.schoolName || "-"}</p>
            </div>
          ),
        },
        {
          key: "plan",
          title: "Plan",
          render: (row) => row.plan,
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
          render: (row) => <InvoiceStatusBadge status={row.status} />,
        },
        {
          key: "dueDate",
          title: "Due Date",
          render: (row) => formatDate(row.dueDate),
        },
        {
          key: "issuedAt",
          title: "Issued",
          render: (row) => formatDate(row.issuedAt),
        },
        {
          key: "view",
          title: "View",
          render: (row) => (
            <Link
              href={`/super-admin/invoices/${row._id}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Open
            </Link>
          ),
        },
      ]}
    />
  );
}