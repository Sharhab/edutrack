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
  CalendarRange,
  Clock3,
} from "lucide-react";
import { useTenant } from "../../../components/tenant/TenantProvider";


import TenantStatCard from "../../../components/tenant/TenantStatCard";
import TenantAccentCard from "../../../components/tenant/TenantAccentCard";
import TenantActionButton from "../../../components/tenant/TenantActionButton";
import TenantLiveBrandPanel from "../../../components/tenant/TenantLiveBrandPanel";
import TenantLogo from "../../../components/tenant/TenantLogo";
import { useSchoolAdminDashboard } from "../../../hooks/useSchoolAdminDashboard";
import SubscriptionBanner from "../../../components/subscription/SubscriptionBanner";
import { useBilling } from "../../../hooks/useBillingStatus";



import { useRouter } from "next/navigation";
import { useState } from "react";

type SubscriptionData = {
  plan: string;
  billingCycle?: string;
  subscriptionStatus: string;
  onboardingStatus?: string;
  isActive: boolean;

  daysLeft?: number | null;

  trialStartAt?: string | null;
  trialEndsAt?: string | null;

  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
};


function formatCurrency(amount?: number) {
  return `₦${Number(
    amount || 0
  ).toLocaleString()}`;
}

export default function SchoolAdminDashboardPage() {
  const { tenant } = useTenant();
const brandColor = tenant?.themeColor || "#06b6d4";

  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

const {
  stats = {} as any,
  loading,
  recentAnnouncements,
  recentResults,

  sessions,
  terms,

  selectedSession,
  selectedTerm,

  selectedSessionId,
  selectedTermId,

  setSelectedSessionId,
  setSelectedTermId,

  isCurrentPeriod,
  periodsLoading,
} = useSchoolAdminDashboard();
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
{/* ACADEMIC PERIOD SELECTOR — SCHOOL BRANDED */}
<section
  className="relative isolate overflow-hidden rounded-[2rem] border p-5 shadow-xl sm:p-6"
  style={{
    borderColor: `${brandColor}66`,
    background: `linear-gradient(125deg, ${brandColor}24 0%, rgba(15,23,42,0.98) 48%, rgba(2,6,23,0.98) 100%)`,
    boxShadow: `0 18px 45px -30px ${brandColor}88`,
  }}
>
  {/* Decorative brand glow */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full blur-3xl"
    style={{ backgroundColor: `${brandColor}22` }}
  />

  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
    {/* School identity */}
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/5"
          style={{
            borderColor: `${brandColor}77`,
            color: brandColor,
          }}
        >
          <CalendarRange size={23} />
        </div>

        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.22em]"
            style={{ color: brandColor }}
          >
            School workspace
          </p>

          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Academic Period
          </h2>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <TenantLogo
          tenant={tenant}
          size={42}
          roundedClassName="rounded-xl"
        />

        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {tenant?.schoolName || "Your School"}
          </p>

          <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-400">
            Select a session and term to view the matching school records and finances.
          </p>
        </div>
      </div>

      <span
        className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
        style={{
          borderColor: `${brandColor}66`,
          backgroundColor: `${brandColor}1A`,
          color: "#f8fafc",
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: isCurrentPeriod
              ? "#4ade80"
              : "#fbbf24",
          }}
        />

        {isCurrentPeriod
          ? "Current academic period"
          : "Historical academic period"}
      </span>
    </div>

    {/* Academic period selectors */}
    <div className="grid w-full gap-4 xl:max-w-2xl xl:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <label
          htmlFor="dashboard-session"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"
        >
          <Clock3 size={15} style={{ color: brandColor }} />
          Academic session
        </label>

        <select
          id="dashboard-session"
          value={selectedSessionId}
          disabled={periodsLoading}
          onChange={(event) => {
            setSelectedTermId("");
            setSelectedSessionId(event.target.value);
          }}
          className="w-full rounded-xl border bg-slate-900 px-3 py-3.5 text-sm font-medium text-white outline-none transition focus:ring-2"
          style={{
            borderColor: `${brandColor}55`,
            ["--tw-ring-color" as string]: brandColor,
          }}
        >
          {sessions.map((session) => (
            <option
              key={session._id}
              value={session._id}
              className="bg-slate-900 text-white"
            >
              {session.name}
              {session.isCurrent ? " (Current)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <label
          htmlFor="dashboard-term"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"
        >
          <CalendarRange size={15} style={{ color: brandColor }} />
          Academic term
        </label>

        <select
          id="dashboard-term"
          value={selectedTermId}
          disabled={
            periodsLoading ||
            !selectedSessionId ||
            terms.length === 0
          }
          onChange={(event) =>
            setSelectedTermId(event.target.value)
          }
          className="w-full rounded-xl border bg-slate-900 px-3 py-3.5 text-sm font-medium text-white outline-none transition focus:ring-2"
          style={{
            borderColor: `${brandColor}55`,
            ["--tw-ring-color" as string]: brandColor,
          }}
        >
          {terms.map((term) => (
            <option
              key={term._id}
              value={term._id}
              className="bg-slate-900 text-white"
            >
              {term.name}
              {term.isCurrent ? " (Current)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>

  {/* Selected period indicator */}
  {selectedSession && selectedTerm && (
    <div
      className="relative mt-5 flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderColor: `${brandColor}55`,
        backgroundColor: "rgba(2,6,23,0.48)",
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Viewing records for
        </p>

        <p className="mt-1 font-semibold text-white">
          {selectedSession.name}
          <span style={{ color: brandColor }}> · </span>
          {selectedTerm.name}
        </p>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: brandColor }}
        />

        {loading
          ? "Updating dashboard…"
          : "Dashboard period selected"}
      </span>
    </div>
  )}

  {!periodsLoading && sessions.length === 0 && (
    <p className="relative mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
      No academic sessions were found. Configure a session and term before using the period dashboard.
    </p>
  )}
</section>
      
      <SubscriptionBanner
        daysLeft={subscription?.daysLeft}
      />

      {/* =========================================
          CORE STATS
      ========================================= */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
    
{/* CORE STATS */}

<TenantStatCard
  tenant={tenant}
  title="Students"
  value={loading ? "..." : safeStats.students}
  subtitle="Registered students"
  icon={<GraduationCap size={20} />}
  accentColor="#2563eb"
/>

<TenantStatCard
  tenant={tenant}
  title="Teachers"
  value={loading ? "..." : safeStats.teachers}
  subtitle="Teaching staff"
  icon={<Users size={20} />}
  accentColor="#7c3aed"
/>

<TenantStatCard
  tenant={tenant}
  title="Classes"
  value={loading ? "..." : safeStats.classes}
  subtitle="Available classes"
  icon={<FileText size={20} />}
  accentColor="#0891b2"
/>

<TenantStatCard
  tenant={tenant}
  title="Attendance Today"
  value={loading ? "..." : safeStats.attendance}
  subtitle="Students marked present"
  icon={<CalendarCheck size={20} />}
  accentColor="#059669"
/>

{/* FINANCE STATS */}

<TenantStatCard
  tenant={tenant}
  title="Total Revenue"
  value={loading ? "..." : formatCurrency(safeStats.revenue)}
  subtitle="Successful payments"
  icon={<DollarSign size={20} />}
  accentColor="#16a34a"
/>

<TenantStatCard
  tenant={tenant}
  title="Expected Revenue"
  value={loading ? "..." : formatCurrency(safeStats.expected)}
  subtitle="Generated invoices"
  icon={<ArrowUpRight size={20} />}
  accentColor="#4f46e5"
/>

<TenantStatCard
  tenant={tenant}
  title="Outstanding Fees"
  value={loading ? "..." : formatCurrency(safeStats.outstanding)}
  subtitle="Pending balances"
  icon={<AlertCircle size={20} />}
  accentColor="#dc2626"
/>

<TenantStatCard
  tenant={tenant}
  title="Invoices"
  value={loading ? "..." : safeStats.invoicesTotal}
  subtitle={`${safeStats.invoicesPaid} paid`}
  icon={<CreditCard size={20} />}
  accentColor="#c026d3"
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
