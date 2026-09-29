"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import { PaymentRecord } from "../../types/billing";
import { formatDate } from "../../lib/utils";
import PaymentStatusBadge from "../../components/billing/PaymentStatusBadge";

type PaymentsTableProps = {
  data: PaymentRecord[];
};

export default function PaymentsTable({ data }: PaymentsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No payment records found"
        description="Payment transactions will appear here."
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
          key: "reference",
          title: "Reference",
          render: (row) => row.reference || "-",
        },
        {
          key: "amount",
          title: "Amount",
          render: (row) => `₦${row.amount.toLocaleString()}`,
        },
        {
          key: "method",
          title: "Method",
          render: (row) => row.paymentMethod || "-",
        },
        {
          key: "status",
          title: "Status",
          render: (row) => <PaymentStatusBadge status={row.status} />,
        },
        {
          key: "paidAt",
          title: "Paid At",
          render: (row) => formatDate(row.paidAt),
        },
        {
          key: "createdAt",
          title: "Created",
          render: (row) => formatDate(row.createdAt),
        },
      ]}
    />
  );
}