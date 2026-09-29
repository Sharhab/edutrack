"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import api from "../../../../lib/axios";

import {
  Receipt,
  RefreshCcw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CreditCard,
  Eye,
} from "lucide-react";

import TenantAccentCard from "../../../../components/tenant/TenantAccentCard";

function formatCurrency(v?: number) {
  return `₦${Number(v || 0).toLocaleString()}`;
}

function getStudentName(student: any) {
  if (!student) return "Unknown Student";

  if (typeof student === "object") {
    return `${student.firstName || ""} ${
      student.lastName || ""
    }`.trim();
  }

  return String(student);
}

export default function InvoicesPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [invoices, setInvoices] =
    useState<any[]>([]);

  const [filter, setFilter] =
    useState("all");

  /* =========================================
     LOAD INVOICES
  ========================================= */
  async function loadInvoices() {
    try {
      setLoading(true);

      const res = await api.get(
        "/finance/fees/invoices"
      );

      console.log(
        "INVOICES RESPONSE:",
        res.data
      );

      setInvoices(
        res.data?.data || []
      );
    } catch (err) {
      console.error(
        "INVOICE LOAD ERROR:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     INIT
  ========================================= */
  useEffect(() => {
    loadInvoices();
  }, []);

  /* =========================================
     FILTERED DATA
  ========================================= */
  const filteredInvoices =
    useMemo(() => {
      if (filter === "all") {
        return invoices;
      }

      return invoices.filter(
        (invoice: any) =>
          invoice.status === filter
      );
    }, [filter, invoices]);

  /* =========================================
     STATS
  ========================================= */
  const totalInvoices =
    invoices.length;

  const paidInvoices =
    invoices.filter(
      (i: any) =>
        i.status === "paid"
    ).length;

  const partialInvoices =
    invoices.filter(
      (i: any) =>
        i.status === "partial"
    ).length;

  const unpaidInvoices =
    invoices.filter(
      (i: any) =>
        i.status === "unpaid"
    ).length;

  const totalRevenue =
    invoices.reduce(
      (
        sum: number,
        invoice: any
      ) =>
        sum +
        Number(
          invoice.amountPaid || 0
        ),
      0
    );

  return (
    <div className="space-y-6 p-6 text-white">
      {/* =========================================
          HEADER
      ========================================= */}
      <TenantAccentCard
        title="Invoices"
        description="Generated fee invoices & balances"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadInvoices}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            onClick={() =>
              router.push(
                "/school-admin/payments"
              )
            }
            className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-black hover:bg-cyan-400"
          >
            <CreditCard size={16} />
            Payments
          </button>
        </div>
      </TenantAccentCard>

      {/* =========================================
          STATS
      ========================================= */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <Receipt className="text-cyan-400" />

            <div>
              <p className="text-sm text-slate-400">
                Total Invoices
              </p>

              <h2 className="text-2xl font-bold">
                {totalInvoices}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-400" />

            <div>
              <p className="text-sm text-slate-400">
                Paid
              </p>

              <h2 className="text-2xl font-bold">
                {paidInvoices}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-400" />

            <div>
              <p className="text-sm text-slate-400">
                Partial
              </p>

              <h2 className="text-2xl font-bold">
                {partialInvoices}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" />

            <div>
              <p className="text-sm text-slate-400">
                Unpaid
              </p>

              <h2 className="text-2xl font-bold">
                {unpaidInvoices}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="text-cyan-400" />

            <div>
              <p className="text-sm text-slate-400">
                Revenue
              </p>

              <h2 className="text-xl font-bold">
                {formatCurrency(
                  totalRevenue
                )}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          FILTERS
      ========================================= */}
      <div className="flex flex-wrap gap-3">
        {[
          "all",
          "paid",
          "partial",
          "unpaid",
        ].map((item) => (
          <button
            key={item}
            onClick={() =>
              setFilter(item)
            }
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              filter === item
                ? "bg-cyan-500 text-black"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {/* =========================================
          INVOICE LIST
      ========================================= */}
      <TenantAccentCard
        title="Invoice Records"
        description="All generated student fee invoices"
      >
        {loading ? (
          <div className="py-10 text-slate-400">
            Loading invoices...
          </div>
        ) : filteredInvoices.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-400">
            No invoices found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map(
              (invoice: any) => {
                const studentName =
                  getStudentName(
                    invoice.studentId
                  );

                return (
                  <div
                    key={invoice._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* LEFT */}
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-lg font-semibold">
                            {invoice.title ||
                              "School Fee"}
                          </h2>

                          <p className="text-sm text-slate-400">
                            Student:{" "}
                            {
                              studentName
                            }
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-slate-300">
                            Total:{" "}
                            {formatCurrency(
                              invoice.totalAmount
                            )}
                          </span>

                          <span className="text-green-400">
                            Paid:{" "}
                            {formatCurrency(
                              invoice.amountPaid
                            )}
                          </span>

                          <span className="text-red-400">
                            Balance:{" "}
                            {formatCurrency(
                              invoice.balance
                            )}
                          </span>
                        </div>

                        {(invoice.session ||
                          invoice.term) && (
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            {invoice.session && (
                              <span>
                                Session:{" "}
                                {
                                  invoice.session
                                }
                              </span>
                            )}

                            {invoice.term && (
                              <span>
                                Term:{" "}
                                {
                                  invoice.term
                                }
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RIGHT */}
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            invoice.status ===
                            "paid"
                              ? "bg-green-500/20 text-green-400"
                              : invoice.status ===
                                  "partial"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {invoice.status?.toUpperCase()}
                        </span>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/school-admin/invoices/${invoice._id}`
                              )
                            }
                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                          >
                            <Eye size={15} />
                            View
                          </button>

                          {Number(
                            invoice.balance ||
                              0
                          ) > 0 && (
                            <button
                              onClick={() =>
                                router.push(
                                  "/school-admin/payments"
                                )
                              }
                              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
                            >
                              <CreditCard
                                size={15}
                              />
                              Pay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </TenantAccentCard>
    </div>
  );
}