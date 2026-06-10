"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CalendarCheck,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Receipt,
  Users,
  Wallet,
  Layers3,
  BadgeDollarSign,
} from "lucide-react";

import { useTenant } from "../../../components/providers/TenantProvider";

import TenantDashboardHero from "../../../components/tenant/TenantDashboardHero";
import TenantStatCard from "../../../components/tenant/TenantStatCard";
import TenantAccentCard from "../../../components/tenant/TenantAccentCard";
import TenantActionButton from "../../../components/tenant/TenantActionButton";
import TenantLiveBrandPanel from "../../../components/tenant/TenantLiveBrandPanel";

import { useSchoolAdminDashboard } from "../../../hooks/useSchoolAdminDashboard";
import SubscriptionBanner from "../../../components/subscription/SubscriptionBanner";
import { useBilling } from "../../../hooks/useBillingStatus";



import { useRouter } from "next/navigation";

function formatCurrency(amount?: number) {
  return `₦${Number(
    amount || 0
  ).toLocaleString()}`;
}

export default function SchoolAdminDashboardPage() {
  const { tenant } = useTenant();

  const router = useRouter();

  const {
    stats = {},
    loading,
    recentAnnouncements = [],
    recentResults = [],
  } = useSchoolAdminDashboard();
  const { showBanner, daysLeft } = useBilling();


  /* =========================================
     SAFE FINANCE ALIGNMENT
     (Aligned with StudentFee invoice system)
  ========================================= */
  const safeStats = {
    students:
      Number(stats.students) || 0,

    teachers:
      Number(stats.teachers) || 0,

    classes:
      Number(stats.classes) || 0,

    attendance:
      Number(stats.attendance) || 0,

    revenue:
      Number(stats.revenue) || 0,

    expected:
      Number(stats.expected) || 0,

    outstanding:
      Number(stats.outstanding) || 0,

    invoicesTotal:
      Number(
        stats.invoicesTotal
      ) || 0,

    invoicesPaid:
      Number(
        stats.invoicesPaid
      ) || 0,

    invoicesPending:
      Number(
        stats.invoicesPending
      ) || 0,

    paymentsTotal:
      Number(
        stats.paymentsTotal
      ) || 0,
  };

  return (
    <div className="space-y-6">
      {/* =========================================
          HERO
      ========================================= */}
      <TenantDashboardHero />

       {showBanner && (
  <SubscriptionBanner daysLeft={daysLeft} />
)}
      {/* =========================================
          CORE STATS
      ========================================= */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <TenantStatCard
          tenant={tenant}
          title="Students"
          value={
            loading
              ? "..."
              : safeStats.students
          }
          subtitle="Registered students"
          icon={
            <GraduationCap
              size={20}
            />
          }
        />

        <TenantStatCard
          tenant={tenant}
          title="Teachers"
          value={
            loading
              ? "..."
              : safeStats.teachers
          }
          subtitle="Teaching staff"
          icon={<Users size={20} />}
        />

        <TenantStatCard
          tenant={tenant}
          title="Classes"
          value={
            loading
              ? "..."
              : safeStats.classes
          }
          subtitle="Available classes"
          icon={
            <FileText size={20} />
          }
        />

        <TenantStatCard
          tenant={tenant}
          title="Attendance Today"
          value={
            loading
              ? "..."
              : safeStats.attendance
          }
          subtitle="Students marked present"
          icon={
            <CalendarCheck
              size={20}
            />
          }
        />
      </div>

      {/* =========================================
          FINANCE STATS
      ========================================= */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <TenantStatCard
          tenant={tenant}
          title="Total Revenue"
          value={
            loading
              ? "..."
              : formatCurrency(
                  safeStats.revenue
                )
          }
          subtitle="Successful payments"
          icon={
            <DollarSign size={20} />
          }
        />

        <TenantStatCard
          tenant={tenant}
          title="Expected Revenue"
          value={
            loading
              ? "..."
              : formatCurrency(
                  safeStats.expected
                )
          }
          subtitle="Generated invoices"
          icon={
            <ArrowUpRight
              size={20}
            />
          }
        />

        <TenantStatCard
          tenant={tenant}
          title="Outstanding Fees"
          value={
            loading
              ? "..."
              : formatCurrency(
                  safeStats.outstanding
                )
          }
          subtitle="Pending balances"
          icon={
            <AlertCircle
              size={20}
            />
          }
        />

        <TenantStatCard
          tenant={tenant}
          title="Invoices"
          value={
            loading
              ? "..."
              : safeStats.invoicesTotal
          }
          subtitle={`${safeStats.invoicesPaid} paid`}
          icon={
            <CreditCard
              size={20}
            />
          }
        />
      </div>

      {/* =========================================
          ENTERPRISE FINANCE PANEL
      ========================================= */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* FINANCE OVERVIEW */}
        <TenantAccentCard
          tenant={tenant}
          title="Finance & Fees"
          description="Student fee invoice management"
        >
          <div className="space-y-4">
            <div className="grid gap-3">
              {/* PAID */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Paid Invoices
                  </p>

                  <Receipt
                    size={16}
                    className="text-green-400"
                  />
                </div>

                <p className="mt-2 text-2xl font-bold text-white">
                  {
                    safeStats.invoicesPaid
                  }
                </p>
              </div>

              {/* PENDING */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Pending Invoices
                  </p>

                  <Wallet
                    size={16}
                    className="text-yellow-400"
                  />
                </div>

                <p className="mt-2 text-2xl font-bold text-white">
                  {
                    safeStats.invoicesPending
                  }
                </p>
              </div>

              {/* PAYMENTS */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Total Payments
                  </p>

                  <BadgeDollarSign
                    size={16}
                    className="text-cyan-400"
                  />
                </div>

                <p className="mt-2 text-2xl font-bold text-white">
                  {
                    safeStats.paymentsTotal
                  }
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-3 pt-2">
              <TenantActionButton
                label="Manage Fees"
                onClick={() =>
                  router.push(
                    "/school-admin/fees"
                  )
                }
              />

              <TenantActionButton
                label="Invoices"
                onClick={() =>
                  router.push(
                    "/school-admin/invoices"
                  )
                }
              />

              <TenantActionButton
                label="Payments"
                onClick={() =>
                  router.push(
                    "/school-admin/payments"
                  )
                }
              />
            </div>
          </div>
        </TenantAccentCard>

        {/* =========================================
            ANNOUNCEMENTS
        ========================================= */}
        <TenantAccentCard
          tenant={tenant}
          title="Recent Announcements"
          description="Latest school updates"
        >
          <div className="space-y-3">
            {recentAnnouncements.length >
            0 ? (
              recentAnnouncements.map(
                (
                  item: any,
                  i: number
                ) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="font-medium text-white">
                      {
                        item.title
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {item.message ||
                        item.description}
                    </p>
                  </div>
                )
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
                No announcements
                available
              </div>
            )}
          </div>
        </TenantAccentCard>

        {/* =========================================
            RESULTS
        ========================================= */}
        <TenantAccentCard
  tenant={tenant}
  title="Academic Results"
  description="Recent result uploads"
>
  <div className="space-y-3">
    {recentResults.length > 0 ? (
      recentResults.map((item: any, i: number) => (
        <div
          key={item._id || i}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <p className="font-medium text-white">
            {item.studentId
              ? `${item.studentId.firstName || ""} ${
                  item.studentId.lastName || ""
                }`
              : "Unknown Student"}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {item.subjectId?.name || "Unknown Subject"}
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              Score: {item.total ?? 0}
            </span>

            <span>
              Grade: {item.grade || "-"}
            </span>

            <span>
              Status: {item.status || "-"}
            </span>
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
        No results uploaded yet
      </div>
    )}
  </div>
</TenantAccentCard>
      </div>

      {/* =========================================
          QUICK ACTIONS
      ========================================= */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* ACTIONS */}
        <TenantAccentCard
          tenant={tenant}
          title="School Actions"
          description="Quick management tools"
        >
          <div className="flex flex-wrap gap-3">
            <TenantActionButton
              label="Add Student"
              onClick={() =>
                router.push(
                  "/school-admin/students"
                )
              }
            />

            <TenantActionButton
              label="Fee Plans"
              onClick={() =>
                router.push(
                  "/school-admin/fees"
                )
              }
            />

            <TenantActionButton
              label="Manual Payment"
              onClick={() =>
                router.push(
                  "/school-admin/payments"
                )
              }
            />

            <TenantActionButton
              label="Invoices"
              onClick={() =>
                router.push(
                  "/school-admin/invoices"
                )
              }
            />

            <TenantActionButton
              label="Publish Notice"
              onClick={() =>
                router.push(
                  "/school-admin/announcements"
                )
              }
            />
          </div>
        </TenantAccentCard>

        {/* =========================================
            SYSTEM OVERVIEW
        ========================================= */}
        <TenantAccentCard
          tenant={tenant}
          title="Enterprise Finance Tools"
          description="Advanced billing & accounting"
        >
          <div className="space-y-4">
            {/* FEE PLANS */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <Layers3
                  className="text-cyan-400"
                  size={18}
                />

                <div>
                  <p className="font-medium text-white">
                    Fee Plans
                  </p>

                  <p className="text-sm text-slate-400">
                    Reusable fee
                    structure system
                  </p>
                </div>
              </div>
            </div>

            {/* AUTOMATION */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <CreditCard
                  className="text-green-400"
                  size={18}
                />

                <div>
                  <p className="font-medium text-white">
                    Invoice Automation
                  </p>

                  <p className="text-sm text-slate-400">
                    Auto invoice
                    generation during
                    assignment
                  </p>
                </div>
              </div>
            </div>

            {/* LEDGER */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <Receipt
                  className="text-yellow-400"
                  size={18}
                />

                <div>
                  <p className="font-medium text-white">
                    Payment Ledger
                  </p>

                  <p className="text-sm text-slate-400">
                    Tracks invoices,
                    balances &
                    payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TenantAccentCard>
      </div>

      {/* =========================================
          BRAND PANEL
      ========================================= */}
      <TenantLiveBrandPanel />
    </div>
  );
}