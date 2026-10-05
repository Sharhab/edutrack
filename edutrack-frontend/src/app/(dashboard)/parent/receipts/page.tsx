"use client";

import { useEffect, useState } from "react";
import SectionCard from "../../../../components/ui/SectionCard";
import api from "../../../../lib/axios";

type Student = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  admissionNumber?: string;
};

type Receipt = {
  _id: string;
  receiptNumber?: string;
  paymentId?: string;
  studentId?: Student;
  amount?: number;
  amountPaid?: number;
  method?: string;
  status?: string;
  reference?: string;
  title?: string;
  session?: string;
  term?: string;
  issuedAt?: string;
  createdAt?: string;
};

type ReceiptDetails = {
  receiptId?: string;
  receiptNumber?: string;
  paymentId?: string;
  amount?: number;
  amountPaid?: number;
  method?: string;
  status?: string;
  reference?: string;
  title?: string;
  totalAmount?: number;
  balance?: number;
  session?: string;
  term?: string;
  createdAt?: string;
  issuedAt?: string;

  student?: Student;

  school?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
    themeColor?: string;
  };
};

export default function ParentReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReceipt, setSelectedReceipt] =
    useState<ReceiptDetails | null>(null);

  const [loadingReceipt, setLoadingReceipt] =
    useState(false);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  /* =========================================
     LOAD PARENT RECEIPTS
  ========================================= */

  async function loadReceipts() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/receipts");

      setReceipts(response.data?.data || []);
    } catch (err: any) {
      console.error(
        "PARENT RECEIPTS LOAD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Could not load your receipts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReceipts();
  }, []);

  /* =========================================
     VIEW RECEIPT
  ========================================= */

  async function viewReceipt(
    paymentId?: string
  ) {
    if (!paymentId) {
      return;
    }

    try {
      setLoadingReceipt(true);
      setError("");

      const response = await api.get(
        `/receipts/payment/${paymentId}`
      );

      setSelectedReceipt(
        response.data?.data || null
      );
    } catch (err: any) {
      console.error(
        "VIEW RECEIPT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Could not load this receipt."
      );
    } finally {
      setLoadingReceipt(false);
    }
  }

  /* =========================================
     DOWNLOAD / PRINT RECEIPT
  ========================================= */

  async function downloadReceipt(
    paymentId?: string
  ) {
    if (!paymentId) {
      return;
    }

    try {
      setDownloadingId(paymentId);
      setError("");

      const response = await api.get(
        `/receipts/download/${paymentId}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers[
              "content-type"
            ] || "text/html",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `receipt-${paymentId}.html`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(
        "DOWNLOAD RECEIPT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Could not download this receipt."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  /* =========================================
     HELPERS
  ========================================= */

  function formatMoney(
    amount?: number
  ) {
    return Number(
      amount || 0
    ).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(
    date?: string
  ) {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function paymentMethod(
    method?: string
  ) {
    if (!method) return "-";

    return method
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-6">
      <SectionCard
        title="My Receipts"
        subtitle="View and download receipts for your children's successful school-fee payments"
      >
        {error ? (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-10 text-center text-slate-400">
            Loading your receipts...
          </div>
        ) : receipts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-white">
              No receipts yet
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Receipts will appear here after
              your child's school-fee payment
              has been successfully recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => {
              const student =
                receipt.studentId;

              const amount =
                receipt.amountPaid ??
                receipt.amount ??
                0;

              return (
                <div
                  key={receipt._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* RECEIPT INFORMATION */}

                    <div>
                      <p className="font-semibold text-white">
                        {student?.firstName || ""}{" "}
                        {student?.lastName || ""}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Receipt{" "}
                        {receipt.receiptNumber ||
                          "-"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>
                          ₦
                          {formatMoney(
                            amount
                          )}
                        </span>

                        <span>
                          {paymentMethod(
                            receipt.method
                          )}
                        </span>

                        <span>
                          {receipt.session ||
                            "-"}{" "}
                          •{" "}
                          {receipt.term ||
                            "-"}
                        </span>

                        <span>
                          {formatDate(
                            receipt.issuedAt ||
                              receipt.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          viewReceipt(
                            receipt.paymentId
                          )
                        }
                        disabled={
                          loadingReceipt ||
                          !receipt.paymentId
                        }
                        className="rounded-xl border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingReceipt
                          ? "Loading..."
                          : "View Receipt"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadReceipt(
                            receipt.paymentId
                          )
                        }
                        disabled={
                          downloadingId ===
                            receipt.paymentId ||
                          !receipt.paymentId
                        }
                        className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloadingId ===
                        receipt.paymentId
                          ? "Preparing..."
                          : "Download"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* =========================================
          RECEIPT PREVIEW
      ========================================= */}

      {selectedReceipt ? (
        <ReceiptPreview
          receipt={selectedReceipt}
          onClose={() =>
            setSelectedReceipt(null)
          }
          onDownload={() =>
            downloadReceipt(
              selectedReceipt.paymentId
            )
          }
        />
      ) : null}
    </div>
  );
}

/* =========================================
   RECEIPT PREVIEW
========================================= */

function ReceiptPreview({
  receipt,
  onClose,
  onDownload,
}: {
  receipt: ReceiptDetails;
  onClose: () => void;
  onDownload: () => void;
}) {
  const color =
    receipt.school?.themeColor ||
    "#06b6d4";

  const student =
    receipt.student || {};

  const amount =
    receipt.amountPaid ??
    receipt.amount ??
    0;

  const studentName =
    `${student.firstName || ""} ${
      student.lastName || ""
    }`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-950 shadow-2xl">
        {/* HEADER */}

        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4"
        >
          <div>
            <h2 className="font-semibold text-white">
              Payment Receipt
            </h2>

            <p className="text-xs text-slate-400">
              {receipt.receiptNumber ||
                "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* RECEIPT */}

        <div className="p-5">
          <div
            className="overflow-hidden rounded-xl bg-white text-slate-900"
            style={{
              borderTop:
                `8px solid ${color}`,
            }}
          >
            {/* SCHOOL HEADER */}

            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
              {receipt.school?.logo ? (
                <img
                  src={receipt.school.logo}
                  alt="School logo"
                  className="h-20 w-20 rounded-lg object-contain"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-lg text-2xl font-bold text-white"
                  style={{
                    backgroundColor:
                      color,
                  }}
                >
                  {(
                    receipt.school?.name ||
                    "S"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <h1
                  className="text-2xl font-bold"
                  style={{
                    color,
                  }}
                >
                  {receipt.school?.name ||
                    "School"}
                </h1>

                {receipt.school
                  ?.address ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {receipt.school.address}
                  </p>
                ) : null}

                <p className="text-sm text-slate-500">
                  {receipt.school?.phone ||
                    ""}
                  {receipt.school?.email
                    ? ` • ${receipt.school.email}`
                    : ""}
                </p>
              </div>

              <div className="sm:text-right">
                <p
                  className="font-bold uppercase"
                  style={{
                    color,
                  }}
                >
                  Cash Receipt
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Receipt No:{" "}
                  {receipt.receiptNumber ||
                    "-"}
                </p>
              </div>
            </div>

            {/* DETAILS */}

            <div className="p-6">
              <div
                className="grid overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-2"
              >
                <ReceiptDetail
                  label="Received From"
                  value={
                    studentName || "-"
                  }
                />

                <ReceiptDetail
                  label="Admission Number"
                  value={
                    student.admissionNumber ||
                    "-"
                  }
                />

                <ReceiptDetail
                  label="Session"
                  value={
                    receipt.session ||
                    "-"
                  }
                />

                <ReceiptDetail
                  label="Term"
                  value={
                    receipt.term || "-"
                  }
                />

                <ReceiptDetail
                  label="Payment Method"
                  value={paymentMethodText(
                    receipt.method
                  )}
                />

                <ReceiptDetail
                  label="Date"
                  value={formatReceiptDate(
                    receipt.issuedAt ||
                      receipt.createdAt
                  )}
                />
              </div>

              {/* AMOUNT */}

              <div
                className="mt-5 rounded-xl border-2 p-5"
                style={{
                  borderColor: color,
                }}
              >
                <p className="text-xs uppercase text-slate-500">
                  Amount Paid
                </p>

                <p
                  className="mt-1 text-3xl font-black"
                  style={{
                    color,
                  }}
                >
                  ₦
                  {Number(
                    amount || 0
                  ).toLocaleString(
                    "en-NG",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>

              {/* PURPOSE */}

              <div
                className="mt-5 rounded-lg bg-slate-50 p-4"
                style={{
                  borderLeft:
                    `4px solid ${color}`,
                }}
              >
                <p className="text-xs uppercase text-slate-500">
                  Being payment for
                </p>

                <p className="mt-1 font-semibold">
                  {receipt.title ||
                    "School Fees"}
                </p>
              </div>

              {/* REFERENCE */}

              {receipt.reference ? (
                <p className="mt-4 text-xs text-slate-500">
                  Payment Reference:{" "}
                  <span className="font-medium text-slate-700">
                    {receipt.reference}
                  </span>
                </p>
              ) : null}

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="font-semibold text-green-700">
                    ✓ PAYMENT RECEIVED
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Thank you for your
                    payment.
                  </p>
                </div>

                <div className="w-40 text-center">
                  <div className="mb-2 border-t border-slate-500" />

                  <p className="text-xs text-slate-500">
                    Authorized Signature
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-slate-950 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              backgroundColor: color,
            }}
          >
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   DETAIL COMPONENT
========================================= */

function ReceiptDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-200 p-4 even:sm:border-l">
      <p className="text-[11px] font-medium uppercase text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

/* =========================================
   FORMAT HELPERS
========================================= */

function paymentMethodText(
  method?: string
) {
  if (!method) return "-";

  return method
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

function formatReceiptDate(
  date?: string
) {
  if (!date) return "-";

  return new Date(
    date
  ).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
