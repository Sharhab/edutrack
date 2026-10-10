
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Wallet,
  X,
} from "lucide-react";

import StatCard from "../../../components/ui/statCard";
import SectionCard from "../../../components/ui/SectionCard";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

import { getParentPortalOverview } from "../../../lib/parent-portal";
import { initializeStudentFeePaystack } from "../../../lib/student-fee-paystack";

type PaymentMode =
  | "full_only"
  | "flexible_partial"
  | "fixed_installment";

type FeePolicy = {
  mode?: PaymentMode;
  minimumPaymentAmount?: number | null;
  installmentAmount?: number | null;
};

type StudentFee = {
  _id: string;
  studentId: string | { _id: string };
  title?: string;
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
  status?: string;
  session?: string;
  term?: string;
  feePlanId?: {
    _id?: string;
    paymentPolicy?: FeePolicy;
  } | string | null;
};

const money = (value: unknown) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function getStudentId(fee: StudentFee) {
  return typeof fee.studentId === "object"
    ? fee.studentId?._id
    : fee.studentId;
}

function getPolicy(fee: StudentFee): FeePolicy {
  if (
    fee.feePlanId &&
    typeof fee.feePlanId === "object"
  ) {
    return fee.feePlanId.paymentPolicy || {
      mode: "full_only",
    };
  }

  return { mode: "full_only" };
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingFeeId, setPayingFeeId] = useState<string | null>(
    null
  );

  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(
    null
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await getParentPortalOverview();

        if (mounted) {
          setData(result);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load parent dashboard."
          );
        } else {
          setError("Failed to load parent dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const studentFees = useMemo<StudentFee[]>(() => {
    return Array.isArray(data?.studentFees)
      ? data.studentFees
      : [];
  }, [data]);

  const upcomingFees = useMemo(
    () =>
      studentFees.filter(
        (fee) => Number(fee.balance || 0) > 0
      ),
    [studentFees]
  );

  const paidFees = useMemo(
    () =>
      studentFees.filter(
        (fee) => Number(fee.balance || 0) <= 0
      ),
    [studentFees]
  );

  function openPaymentDialog(fee: StudentFee) {
    const balance = Number(fee.balance || 0);
    const policy = getPolicy(fee);
    const mode = policy.mode || "full_only";

    if (balance <= 0) {
      return;
    }

    let initialAmount = balance;

    if (mode === "fixed_installment") {
      const installment = Number(
        policy.installmentAmount || 0
      );

      initialAmount = Math.min(installment, balance);
    }

    setSelectedFee(fee);
    setPaymentAmount(String(initialAmount));
    setPaymentError("");
  }

  function closePaymentDialog() {
    if (payingFeeId) {
      return;
    }

    setSelectedFee(null);
    setPaymentAmount("");
    setPaymentError("");
  }

  function validatePaymentAmount(
    fee: StudentFee,
    amount: number
  ): string {
    const balance = Number(fee.balance || 0);
    const policy = getPolicy(fee);
    const mode = policy.mode || "full_only";

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Enter a valid payment amount greater than zero.";
    }

    if (amount > balance) {
      return "The payment cannot exceed the outstanding balance.";
    }

    if (mode === "full_only" && amount !== balance) {
      return "This fee requires full payment.";
    }

    if (mode === "fixed_installment") {
      const installment = Number(
        policy.installmentAmount || 0
      );

      if (installment <= 0) {
        return "The school's installment amount is not configured correctly. Please contact the school.";
      }

      const expectedAmount = Math.min(installment, balance);

      if (amount !== expectedAmount) {
        return `The required installment is ${money(expectedAmount)}.`;
      }
    }

    if (mode === "flexible_partial") {
      const minimum = Number(
        policy.minimumPaymentAmount || 0
      );

      // The remaining balance may be paid even when it is
      // smaller than the configured minimum.
      if (
        minimum > 0 &&
        amount < minimum &&
        amount !== balance
      ) {
        return `The minimum payment is ${money(minimum)}. You may also pay the full remaining balance.`;
      }
    }

    return "";
  }

  async function initializePayment(
    fee: StudentFee,
    amount: number
  ) {
    const validationMessage = validatePaymentAmount(
      fee,
      amount
    );

    if (validationMessage) {
      setPaymentError(validationMessage);
      return;
    }

    try {
      setPayingFeeId(fee._id);
      setPaymentError("");

      const response = await initializeStudentFeePaystack(
        fee._id,
        amount
      );

      const authorizationUrl =
        response?.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error(
          response?.message ||
            "Paystack did not return a payment link."
        );
      }

      // Keep the existing hosted Paystack checkout flow.
      window.location.assign(authorizationUrl);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPaymentError(
          err.response?.data?.message ||
            "Payment initialization failed. Please try again."
        );
      } else {
        setPaymentError(
          err instanceof Error
            ? err.message
            : "Payment initialization failed. Please try again."
        );
      }

      setPayingFeeId(null);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data"
        description="No parent dashboard information was found."
      />
    );
  }

  const selectedBalance = Number(
    selectedFee?.balance || 0
  );

  const selectedPolicy = selectedFee
    ? getPolicy(selectedFee)
    : {};

  const selectedMode =
    selectedPolicy.mode || "full_only";

  const selectedAmount = Number(paymentAmount);

  const remainingAfterPayment = Math.max(
    selectedBalance -
      (Number.isFinite(selectedAmount) ? selectedAmount : 0),
    0
  );

  const selectedChildName = selectedFee
    ? (() => {
        const child = data.children?.find(
          (item: any) =>
            String(item._id) === String(getStudentId(selectedFee))
        );

        return child
          ? `${child.firstName || ""} ${child.lastName || ""}`.trim()
          : "Student";
      })()
    : "";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, {data.parent?.firstName || "Parent"}
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Manage your children's school fees and stay up to date
              with school announcements.
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {data.currentSession || "Current session not set"}
              {" • "}
              {data.currentTerm || "Current term not set"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#upcoming-fees"
              className="btn-primary inline-flex items-center"
            >
              <CreditCard size={16} className="mr-2" />
              Pay Fees
            </a>

            <a
              href="#announcements"
              className="btn-secondary inline-flex items-center"
            >
              <Bell size={16} className="mr-2" />
              Announcements
            </a>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Children"
          value={data.stats?.totalChildren || data.children?.length || 0}
        />

        <StatCard
          title="Total Paid"
          value={money(data.stats?.totalPaid)}
        />

        <StatCard
          title="Outstanding"
          value={money(data.stats?.totalOutstanding)}
        />

        <StatCard
          title="Pending Fees"
          value={upcomingFees.length}
        />
      </div>

      {/* CHILDREN AND SIDEBAR */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="My Children"
            subtitle="Student details and fee payment status"
          >
            <div className="space-y-4">
              {!data.children?.length ? (
                <EmptyState
                  title="No linked children"
                  description="No students are currently linked to your parent account. Please contact the school."
                />
              ) : (
                data.children.map((child: any) => {
                  const childFees = studentFees.filter(
                    (fee) =>
                      String(getStudentId(fee)) ===
                      String(child._id)
                  );

                  const outstanding = childFees.reduce(
                    (sum, fee) =>
                      sum + Number(fee.balance || 0),
                    0
                  );

                  const paid = childFees.reduce(
                    (sum, fee) =>
                      sum + Number(fee.amountPaid || 0),
                    0
                  );

                  const status =
                    outstanding <= 0
                      ? "paid"
                      : paid > 0
                        ? "partial"
                        : "unpaid";

                  const firstOutstandingFee = childFees.find(
                    (fee) => Number(fee.balance || 0) > 0
                  );

                  return (
                    <div
                      key={child._id}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {child.firstName} {child.lastName}
                          </h3>

                          <div className="mt-2 space-y-1 text-sm text-slate-300">
                            <p>
                              Admission:{" "}
                              {child.admissionNumber || "N/A"}
                            </p>

                            <p>
                              Class:{" "}
                              {typeof child.className === "object"
                                ? child.className?.name || "N/A"
                                : child.className || "N/A"}
                            </p>

                            <p>
                              Attendance:{" "}
                              <span className="text-green-400">
                                {child.attendanceRate || 0}%
                              </span>
                            </p>

                            <p>
                              Session:{" "}
                              {child.session || data.currentSession || "N/A"}
                            </p>

                            <p>
                              Term:{" "}
                              {child.term || data.currentTerm || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex min-w-44 flex-col gap-3">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-3 py-2 text-xs font-semibold ${
                              status === "paid"
                                ? "bg-green-500/20 text-green-300"
                                : status === "partial"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {status.toUpperCase()}
                          </span>

                          <p className="text-sm text-slate-300">
                            Paid: {money(paid)}
                          </p>

                          <p className="text-sm font-semibold text-red-400">
                            Outstanding: {money(outstanding)}
                          </p>

                          {firstOutstandingFee && (
                            <button
                              type="button"
                              onClick={() =>
                                openPaymentDialog(firstOutstandingFee)
                              }
                              className="btn-primary inline-flex items-center justify-center"
                            >
                              <Wallet size={16} className="mr-2" />
                              Pay Fees
                            </button>
                          )}

                          {!firstOutstandingFee && (
                            <p className="inline-flex items-center text-sm text-green-400">
                              <CheckCircle2
                                size={16}
                                className="mr-2"
                              />
                              Fees settled
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <div id="announcements">
            <SectionCard
              title="Announcements"
              subtitle="Updates from your school"
            >
              <div className="space-y-4">
                {!data.announcements?.length ? (
                  <EmptyState
                    title="No announcements"
                    description="There are no school announcements available."
                  />
                ) : (
                  data.announcements.map((item: any) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <h4 className="font-semibold text-white">
                        {item.title}
                      </h4>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                        {item.message}
                      </p>

                      {item.createdAt && (
                        <p className="mt-3 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <div id="upcoming-fees">
            <SectionCard
              title="Upcoming Fees"
              subtitle="Outstanding student fee balances"
            >
              <div className="space-y-3">
                {upcomingFees.length === 0 ? (
                  <EmptyState
                    title="No pending fees"
                    description="All listed student fees have been settled."
                  />
                ) : (
                  upcomingFees.slice(0, 8).map((fee) => {
                    const child = data.children?.find(
                      (item: any) =>
                        String(item._id) === String(getStudentId(fee))
                    );

                    return (
                      <div
                        key={fee._id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">
                              {fee.title || "School Fees"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {child
                                ? `${child.firstName || ""} ${child.lastName || ""}`.trim()
                                : "Student"}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {fee.session || "No session"}
                              {" • "}
                              {fee.term || "No term"}
                            </p>
                          </div>

                          <p className="whitespace-nowrap font-bold text-red-400">
                            {money(fee.balance)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openPaymentDialog(fee)}
                          className="btn-secondary mt-3 w-full"
                        >
                          Choose Payment
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Payment Summary"
            subtitle="Your recorded fee totals"
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Total billed</span>
                <span className="font-semibold text-white">
                  {money(data.stats?.totalBilled)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Paid fees</span>
                <span className="font-semibold text-green-400">
                  {paidFees.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Outstanding fees</span>
                <span className="font-semibold text-red-400">
                  {upcomingFees.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center text-slate-400">
                  <CalendarDays size={15} className="mr-2" />
                  Current term
                </span>
                <span className="text-right text-white">
                  {data.currentTerm || "Not set"}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      {selectedFee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentDialog();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-dialog-title"
            className="my-auto w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="payment-dialog-title"
                  className="text-xl font-bold text-white"
                >
                  Choose Fee Payment
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {selectedChildName}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close payment dialog"
                disabled={Boolean(payingFeeId)}
                onClick={closePaymentDialog}
                className="rounded-xl p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">
                {selectedFee.title || "School Fees"}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">
                  Outstanding balance
                </span>

                <span className="text-lg font-bold text-white">
                  {money(selectedBalance)}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Payment policy
                </p>

                <p className="mt-1 font-medium text-cyan-300">
                  {selectedMode === "flexible_partial"
                    ? "Flexible partial payment"
                    : selectedMode === "fixed_installment"
                      ? "Fixed installment"
                      : "Full payment required"}
                </p>
              </div>
            </div>

            {selectedMode === "flexible_partial" && (
              <div className="mt-5">
                <label
                  htmlFor="payment-amount"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Amount to pay (₦)
                </label>

                <input
                  id="payment-amount"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max={selectedBalance}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => {
                    setPaymentAmount(event.target.value);
                    setPaymentError("");
                  }}
                  disabled={Boolean(payingFeeId)}
                  className="w-full rounded-xl border border-white/15 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Enter payment amount"
                />

                {Number(selectedPolicy.minimumPaymentAmount || 0) > 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    Minimum payment:{" "}
                    {money(selectedPolicy.minimumPaymentAmount)}
                    {" • "}
                    You may pay a smaller amount if it clears the full
                    remaining balance.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(String(selectedBalance));
                    setPaymentError("");
                  }}
                  className="mt-3 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Pay full balance instead
                </button>
              </div>
            )}

            {selectedMode === "fixed_installment" && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">
                  Required installment
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {money(
                    Math.min(
                      Number(selectedPolicy.installmentAmount || 0),
                      selectedBalance
                    )
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {selectedBalance <
                  Number(selectedPolicy.installmentAmount || 0)
                    ? "This is the final remaining balance."
                    : "The school requires this installment amount."}
                </p>
              </div>
            )}

            {selectedMode === "full_only" && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">
                  Amount payable
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {money(selectedBalance)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  This fee plan does not allow partial payments.
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="text-sm text-slate-400">
                Balance after payment
              </span>

              <span className="font-semibold text-white">
                {money(remainingAfterPayment)}
              </span>
            </div>

            {paymentError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {paymentError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePaymentDialog}
                disabled={Boolean(payingFeeId)}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  initializePayment(
                    selectedFee,
                    Number(paymentAmount)
                  )
                }
                disabled={Boolean(payingFeeId)}
                className="btn-primary inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CreditCard size={16} className="mr-2" />
                {payingFeeId === selectedFee._id
                  ? "Connecting to Paystack..."
                  : "Continue to Paystack"}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Your payment will be completed securely through Paystack.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
