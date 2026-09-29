"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import StatCard from "../../../components/ui/statCard";
import SectionCard from "../../../components/ui/SectionCard";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

import { getParentPortalOverview } from "../../../lib/parent-portal";
import api from "../../../lib/axios";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

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
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * =========================================
   * SOURCE OF TRUTH = STUDENT FEES
   * =========================================
   */
  const studentFees = useMemo(() => {
    return data?.studentFees || [];
  }, [data]);

  const upcomingInvoices = useMemo(() => {
    return studentFees.filter(
      (fee: any) => Number(fee.balance || 0) > 0
    );
  }, [studentFees]);

  const paidInvoices = useMemo(() => {
    return studentFees.filter(
      (fee: any) => Number(fee.balance || 0) <= 0
    );
  }, [studentFees]);

  /**
   * =========================================
   * PAYSTACK PAYMENT
   * =========================================
   */
 const initializePayment = async (fee: any) => {
  try {
    setPayingFeeId(fee._id);

    console.log("🔥 INIT PAYMENT CLICKED", fee);

    const res = await api.post(
      "/finance/paystack/initialize",
      {
        studentFeeId: fee._id,
      }
    );

    console.log("PAYSTACK RESPONSE:", res.data);

    const paymentData = res.data?.data;

    if (!paymentData?.authorizationUrl) {
      alert("Missing authorization URL");
      return;
    }

    window.location.href =
      paymentData.authorizationUrl;
  } catch (err: any) {
    console.error("PAYMENT ERROR:", err);

    alert(
      err?.response?.data?.message ||
        err.message ||
        "Payment failed (check backend)"
    );
  } finally {
    setPayingFeeId(null);
  }
};

  if (loading) return <PageLoader />;

  if (error)
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error}
      />
    );

  if (!data)
    return (
      <EmptyState
        title="No dashboard data"
        description="No parent dashboard information found."
      />
    );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, {data.parent?.firstName}
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Parent ERP dashboard overview
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary">
              <CreditCard size={16} className="mr-2" />
              Pay Fees
            </button>

            <button className="btn-secondary">
              <Bell size={16} className="mr-2" />
              Notifications
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Children"
          value={data.stats?.totalChildren || 0}
        />

        <StatCard
          title="Total Paid"
          value={`₦${data.stats?.totalPaid || 0}`}
        />

        <StatCard
          title="Outstanding"
          value={`₦${data.stats?.totalOutstanding || 0}`}
        />

        <StatCard
          title="Upcoming Fees"
          value={upcomingInvoices.length}
        />
      </div>

      {/* CHILDREN + FINANCE */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* CHILDREN */}
        <div className="xl:col-span-2">
          <SectionCard
            title="My Children"
            subtitle="Attendance, finance, and academic overview"
          >
            <div className="space-y-4">

              {data.children?.map((child: any) => {

                const childFees =
                  studentFees.filter((f: any) => {
                    const sid =
                      typeof f.studentId === "object"
                        ? f.studentId?._id
                        : f.studentId;

                    return String(sid) === String(child._id);
                  });

                const outstanding = childFees.reduce(
                  (sum: number, i: any) =>
                    sum + Number(i.balance || 0),
                  0
                );

                const paid = childFees.reduce(
                  (sum: number, i: any) =>
                    sum + Number(i.amountPaid || 0),
                  0
                );

                const paymentStatus =
                  outstanding <= 0
                    ? "paid"
                    : paid > 0
                    ? "partial"
                    : "unpaid";

                return (
                  <div
                    key={child._id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {child.firstName} {child.lastName}
                        </h3>

                        <div className="mt-2 space-y-1 text-sm text-slate-300">

                          <p>
                            Admission: {child.admissionNumber || "N/A"}
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

                          {/* SESSION + TERM FIX */}
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

                      <div className="flex flex-col gap-3">

                        <div
                          className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                            paymentStatus === "paid"
                              ? "bg-green-500/20 text-green-300"
                              : paymentStatus === "partial"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {paymentStatus.toUpperCase()}
                        </div>

                        <p className="text-slate-300 text-sm">
                          Paid: ₦{paid}
                        </p>

                        <p className="text-red-400 text-sm">
                          Outstanding: ₦{outstanding}
                        </p>

                        {childFees
                          .filter((f: any) => Number(f.balance || 0) > 0)
                          .slice(0, 1)
                          .map((fee: any) => (
                            <button
                              key={fee._id}
                              onClick={() => initializePayment(fee)}
                              disabled={payingFeeId === fee._id}
                              className="btn-primary"
                            >
                              <Wallet size={16} className="mr-2" />
                              {payingFeeId === fee._id
                                ? "Processing..."
                                : "Pay Now"}
                            </button>
                          ))}

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          </SectionCard>
        </div>

        {/* RIGHT SIDEBAR (UNCHANGED STRUCTURE) */}
        <div className="space-y-6">

          <SectionCard title="Announcements" subtitle="School updates">
            <div className="space-y-4">

              {data.announcements?.length === 0 ? (
                <EmptyState
                  title="No announcements"
                  description="No school announcements available."
                />
              ) : (
                data.announcements?.map((item: any) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <h4 className="font-semibold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.message}
                    </p>
                  </div>
                ))
              )}

            </div>
          </SectionCard>

          <SectionCard title="Upcoming Fees" subtitle="Pending invoice reminders">
            <div className="space-y-3">

              {upcomingInvoices.length === 0 ? (
                <EmptyState
                  title="No pending fees"
                  description="All invoices are settled."
                />
              ) : (
                upcomingInvoices.slice(0, 5).map((fee: any) => (
                  <div
                    key={fee._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {fee.title || "School Fees"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {fee.session || "No Session"} •{" "}
                          {fee.term || "No Term"}
                        </p>
                      </div>

                      <p className="text-red-400 font-bold">
                        ₦{fee.balance || 0}
                      </p>
                    </div>
                  </div>
                ))
              )}

            </div>
          </SectionCard>

        </div>

      </div>
    </div>
  );
}