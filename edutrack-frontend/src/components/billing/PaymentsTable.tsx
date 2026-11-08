

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

function isSuccessful(status: string | undefined): boolean {
  return String(status || "").toLowerCase() === "success";
}

function formatAmount(payment: PaymentRecord): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: payment.currency || "NGN",
  }).format(Number(payment.amount || 0));
}

export default function PaymentsTable({ data }: PaymentsTableProps) {
  async function handleDownload(payment: PaymentRecord) {
    try {
      await downloadPaymentReceipt(payment);
    } catch (error) {
      console.error("Unable to download receipt:", error);
      alert("Unable to download receipt. Please try again.");
    }
  }

  async function handleShare(payment: PaymentRecord) {
    try {
      await sharePaymentReceipt(payment);
    } catch (error) {
      console.error("Unable to share receipt:", error);
      alert("Unable to share receipt. Please try again.");
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

  const renderReceiptActions = (payment: PaymentRecord) =>
    isSuccessful(payment.status) ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleDownload(payment)}
          className="inline-flex items-center justify-center rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300"
        >
          Download PDF
        </button>

        <button
          type="button"
          onClick={() => void handleShare(payment)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Share Receipt
        </button>
      </div>
    ) : (
      <span className="text-xs text-slate-500">
        Receipt available after successful payment
      </span>
    );

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
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
              render: (row) => (
                <span className="break-all">
                  {row.reference || "-"}
                </span>
              ),
            },
            {
              key: "amount",
              title: "Amount",
              render: (row) => formatAmount(row),
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
              render: (row) => renderReceiptActions(row),
            },
          ]}
        />
      </div>

      {/* MOBILE PAYMENT CARDS */}
      <div className="space-y-3 md:hidden">
        {data.map((payment) => {
          const schoolName =
            payment.schoolName ||
            (typeof payment.schoolId === "object"
              ? payment.schoolId?.name
              : "") ||
            payment.tenantId ||
            "School";

          return (
            <article
              key={payment._id || payment.reference}
              className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    SCHOOL
                  </p>
                  <p className="mt-1 break-words font-semibold text-white">
                    {schoolName}
                  </p>
                </div>

                <PaymentStatusBadge status={payment.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Amount
                  </p>
                  <p className="mt-1 break-words font-semibold text-white">
                    {formatAmount(payment)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Method
                  </p>
                  <p className="mt-1 break-words text-slate-200">
                    {payment.method || payment.paymentMethod || "-"}
                  </p>
                </div>

                <div className="col-span-2 min-w-0">
                  <p className="text-xs text-slate-400">
                    Reference
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-200">
                    {payment.reference || payment._id || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Paid At
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {formatDate(payment.paidAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Created
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Receipt
                </p>
                {renderReceiptActions(payment)}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
