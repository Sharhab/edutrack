
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../../lib/axios";
import SubscriptionBanner from "../../../../components/subscription/SubscriptionBanner";

type SubscriptionData = {
  plan: string;
  billingCycle?: string;
  subscriptionStatus: string;
  billingStatus?: string;
  onboardingStatus?: string;
  isActive: boolean;
  isTrial?: boolean;
  daysLeft?: number | null;
  trialStartAt?: string | null;
  trialEndsAt?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
};

type TimelineItem = {
  type: "payment" | "subscription" | "invoice";
  data: {
    _id: string;
    amount?: number;
    plan?: string;
    status?: string;
    reference?: string;
    invoiceNumber?: string;
    billingCycle?: string;
    dueDate?: string | null;
    createdAt: string;
    paidAt?: string | null;
  };
};

type BillingSummary = {
  totalPayments: number;
  totalSubscriptions: number;
  totalInvoices: number;
};

const emptySummary: BillingSummary = {
  totalPayments: 0,
  totalSubscriptions: 0,
  totalInvoices: 0,
};

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

function money(value?: number) {
  if (value === undefined || value === null) return "—";
  return `₦${Number(value).toLocaleString("en-NG")}`;
}

function statusClass(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "success":
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "trial":
    case "pending":
    case "processing":
      return "bg-amber-100 text-amber-800";
    case "failed":
    case "expired":
    case "past_due":
    case "cancelled":
    case "abandoned":
    case "suspended":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [summary, setSummary] =
    useState<BillingSummary>(emptySummary);
  const [error, setError] = useState("");

  const loadBilling = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [subRes, historyRes] = await Promise.all([
        api.get("/billing/current"),
        api.get("/billing/history"),
      ]);

      setSubscription(subRes.data?.data || null);
      setTimeline(historyRes.data?.data?.timeline || []);
      setSummary({
        ...emptySummary,
        ...(historyRes.data?.data?.summary || {}),
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load billing information. Please retry."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  if (loading) {
    return (
      <div className="animate-pulse p-6 text-slate-500">
        Loading billing information...
      </div>
    );
  }

  const isTrial = subscription?.subscriptionStatus === "trial";
  const status = subscription?.subscriptionStatus || "unknown";
  const expiry = isTrial
    ? subscription?.trialEndsAt
    : subscription?.subscriptionExpiresAt;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Billing & Subscription
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your plan, expiry date and subscription payment history.
          </p>
        </div>

        <Link
          href="/school-admin/billing/upgrade"
          className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700"
        >
          {status === "active" ? "Renew or change plan" : "Choose a plan"}
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadBilling()}
            className="rounded-lg border border-red-300 px-3 py-2 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <SubscriptionBanner
        daysLeft={subscription?.daysLeft}
        subscriptionStatus={status}
      />

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-cyan-100">
              Current subscription
            </p>
            <h2 className="mt-2 text-3xl font-bold capitalize sm:text-4xl">
              {subscription?.plan || "Not selected"}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm capitalize">
                {subscription?.billingCycle || "No billing cycle"}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm capitalize">
                {status.replaceAll("_", " ")}
              </span>
            </div>

            <p className="mt-5 text-sm text-cyan-100">
              {isTrial
                ? `Trial ${
                    subscription?.daysLeft === null ||
                    subscription?.daysLeft === undefined
                      ? "end date unavailable"
                      : subscription.daysLeft === 0
                        ? "ends today or has ended"
                        : `ends in ${subscription.daysLeft} day(s)`
                  }`
                : status === "active"
                  ? `Subscription expiry: ${formatDate(expiry)}`
                  : "A current paid subscription is not confirmed."}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 sm:min-w-56">
            <p className="text-sm text-cyan-100">
              {isTrial ? "Trial end date" : "Paid subscription expiry"}
            </p>
            <p className="mt-2 text-xl font-bold">
              {formatDate(expiry)}
            </p>
            <p className="mt-3 text-sm text-cyan-100">
              Started: {formatDate(subscription?.subscriptionStartedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current plan" value={subscription?.plan || "—"} />
        <StatCard
          label="Subscription status"
          value={status.replaceAll("_", " ")}
          capitalize
        />
        <StatCard
          label="Days remaining"
          value={
            subscription?.daysLeft === null ||
            subscription?.daysLeft === undefined
              ? "—"
              : String(subscription.daysLeft)
          }
        />
        <StatCard label="Billing cycle" value={subscription?.billingCycle || "—"} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Payment records" value={String(summary.totalPayments)} />
        <StatCard
          label="Subscription records"
          value={String(summary.totalSubscriptions)}
        />
        <StatCard label="Invoices" value={String(summary.totalInvoices)} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Subscription details
        </h2>

        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail
            label="Billing status"
            value={subscription?.billingStatus || "Not available"}
          />
          <Detail
            label="Started on"
            value={formatDate(subscription?.subscriptionStartedAt, true)}
          />
          <Detail
            label={isTrial ? "Trial ends on" : "Subscription expires on"}
            value={formatDate(expiry, true)}
          />
          {isTrial && (
            <Detail
              label="Trial started"
              value={formatDate(subscription?.trialStartAt, true)}
            />
          )}
          <Detail
            label="School access"
            value={subscription?.isActive ? "Active" : "Restricted"}
          />
          <Detail
            label="Onboarding status"
            value={subscription?.onboardingStatus || "Not available"}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Billing timeline
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Subscription changes, recorded payments and invoices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBilling()}
            className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 sm:self-auto"
          >
            Refresh
          </button>
        </div>

        {timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No billing activity has been recorded yet.
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {timeline.map((item) => {
              const data = item.data;
              const title =
                item.type === "subscription"
                  ? `Subscription${data.plan ? ` — ${data.plan}` : ""}`
                  : item.type === "payment"
                    ? "Subscription payment"
                    : "Invoice";

              return (
                <article
                  key={`${item.type}-${data._id}`}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Created: {formatDate(data.createdAt, true)}
                    </p>
                    {data.paidAt && (
                      <p className="mt-1 text-sm text-slate-500">
                        Paid: {formatDate(data.paidAt, true)}
                      </p>
                    )}
                    {data.reference && (
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        Reference: {data.reference}
                      </p>
                    )}
                    {data.invoiceNumber && (
                      <p className="mt-1 text-xs text-slate-500">
                        Invoice: {data.invoiceNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="font-bold text-slate-900">
                      {money(data.amount)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                        data.status
                      )}`}
                    >
                      {data.status || item.type}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-2 break-words text-xl font-bold text-slate-900 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words font-medium text-slate-900">{value}</dd>
    </div>
  );
}
