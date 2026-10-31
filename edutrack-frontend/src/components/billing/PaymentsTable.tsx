
"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import PaymentStatusBadge from "../../components/billing/PaymentStatusBadge";
import { formatDate } from "../../lib/utils";
import {
  downloadPaymentReceipt,
  sharePaymentReceipt,
} from "../../lib/payment-receipt";
import type { PaymentRecord } from "../../types/billing";

type PaymentsTableProps = {
  data: PaymentRecord[];
};

export default function PaymentsTable({
  data,
}: PaymentsTableProps) {
  async function handleShareReceipt(payment: PaymentRecord) {
    try {
      await sharePaymentReceipt(payment);
    } catch (error) {
      // The user may cancel the native sharing dialog.
      console.error("Unable to share payment receipt:", error);
    }
  }

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
          render: (row) => {
            if (row.schoolName) return row.schoolName;

            if (
              row.schoolId &&
              typeof row.schoolId === "object"
            ) {
              return row.schoolId.name || "-";
            }

            return row.tenantId || "-";
          },
        },
        {
          key: "reference",
          title: "Reference",
          render: (row) => row.reference || "-",
        },
        {
          key: "amount",
          title: "Amount",
          render: (row) =>
            new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: row.currency || "NGN",
            }).format(Number(row.amount || 0)),
        },
        {
          key: "method",
          title: "Method",
          render: (row) =>
            row.method || row.paymentMethod || "-",
        },
        {
          key: "status",
          title: "Status",
          render: (row) => (
            <PaymentStatusBadge status={row.status} />
          ),
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
        {
          key: "receiptActions",
          title: "Receipt",
          render: (row) =>
            row.status === "success" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      downloadPaymentReceipt(row);
                    } catch (error) {
                      console.error(
                        "Unable to download receipt:",
                        error
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/10 dark:text-cyan-300"
                >
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleShareReceipt(row);
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Share Receipt
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                Not available
              </span>
            ),
        },
      ]}
    />
  );
}
