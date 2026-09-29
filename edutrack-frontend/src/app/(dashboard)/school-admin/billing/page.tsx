"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../../lib/axios";
import SubscriptionBanner from "../../../../components/subscription/SubscriptionBanner";

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

type TimelineItem = {
  type: "payment" | "subscription" | "invoice";
  data: {
    _id: string;
    amount?: number;
    plan?: string;
    status?: string;
    reference?: string;
    invoiceNumber?: string;
    createdAt: string;
  };
};

type BillingSummary = {
  totalPayments: number;
  totalSubscriptions: number;
  totalInvoices: number;
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [summary, setSummary] = useState<BillingSummary>({
    totalPayments: 0,
    totalSubscriptions: 0,
    totalInvoices: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    try {
      setLoading(true);

      const [subRes, historyRes] = await Promise.all([
        api.get("/billing/current"),
        api.get("/billing/history"),
      ]);

      setSubscription(subRes.data?.data || null);
      setTimeline(historyRes.data?.data?.timeline || []);
      setSummary(
        historyRes.data?.data?.summary || {
          totalPayments: 0,
          totalSubscriptions: 0,
          totalInvoices: 0,
        }
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-500 animate-pulse">
        Loading billing information...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="mt-2 text-slate-500">
          Manage your school subscription and payment history.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

       {/* BANNER */}
<SubscriptionBanner
  daysLeft={subscription?.daysLeft}
/>

{/* PREMIUM HERO */}
<div className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 p-8 text-white shadow-xl">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

    <div>
      <p className="text-sm uppercase tracking-wider text-cyan-100">
        Current Subscription
      </p>

      <h2 className="mt-2 text-4xl font-bold capitalize">
        {subscription?.plan || "Starter"}
      </h2>

      <p className="mt-3 text-cyan-100">
        {subscription?.subscriptionStatus === "trial"
          ? `Trial ends in ${subscription?.daysLeft ?? 0} days`
          : subscription?.subscriptionStatus}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">

        <span className="rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur">
          {subscription?.billingCycle || "monthly"}
        </span>

        <span className="rounded-full bg-white/20 px-4 py-1 text-sm capitalize backdrop-blur">
          {subscription?.subscriptionStatus || "inactive"}
        </span>

        {subscription?.trialEndsAt && (
          <span className="rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur">
            Ends{" "}
            {new Date(
              subscription.trialEndsAt
            ).toLocaleDateString()}
          </span>
        )}

      </div>
    </div>

    <Link
      href="/school-admin/billing/upgrade"
      className="rounded-2xl bg-white px-6 py-3 text-center font-semibold text-cyan-700 transition hover:scale-105"
    >
      Upgrade Plan
    </Link>

  </div>
</div>

{/* IMPORTANT STATS ONLY */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

  <div className="rounded-3xl border bg-white p-6 shadow-sm">
    <p className="text-sm text-slate-500">
      Current Plan
    </p>
    <h3 className="mt-2 text-2xl font-bold capitalize">
      {subscription?.plan}
    </h3>
  </div>

  <div className="rounded-3xl border bg-white p-6 shadow-sm">
    <p className="text-sm text-slate-500">
      Status
    </p>
    <h3 className="mt-2 text-2xl font-bold capitalize">
      {subscription?.subscriptionStatus}
    </h3>
  </div>

  <div className="rounded-3xl border bg-white p-6 shadow-sm">
    <p className="text-sm text-slate-500">
      Days Left
    </p>
    <h3 className="mt-2 text-2xl font-bold text-amber-600">
      {subscription?.daysLeft ?? 0}
    </h3>
  </div>

  <div className="rounded-3xl border bg-white p-6 shadow-sm">
    <p className="text-sm text-slate-500">
      Trial Ends
    </p>
    <h3 className="mt-2 text-lg font-bold">
      {subscription?.trialEndsAt
        ? new Date(
            subscription.trialEndsAt
          ).toLocaleDateString()
        : "-"}
    </h3>
  </div>

</div>

{/* SUBSCRIPTION DETAILS */}
<div className="rounded-3xl border bg-white p-6 shadow-sm">

  <h3 className="mb-5 text-lg font-semibold">
    Subscription Details
  </h3>

  <div className="grid gap-6 md:grid-cols-2">

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Started On
      </p>

      <p className="mt-2 font-semibold">
        {subscription?.subscriptionStartedAt
          ? new Date(
              subscription.subscriptionStartedAt
            ).toLocaleString()
          : "Not Started"}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Trial End Date
      </p>

      <p className="mt-2 font-semibold">
        {subscription?.trialEndsAt
          ? new Date(
              subscription.trialEndsAt
            ).toLocaleString()
          : "-"}
      </p>
    </div>

  </div>

</div>


      {/* TIMELINE */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Billing Timeline</h2>

        {timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No billing activity yet.
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item) => (
              <div
                key={`${item.type}-${item.data._id}`}
                className="flex items-center justify-between border-b pb-4"
              >
                {/* LEFT */}
                <div>
                  <div className="font-medium">
                    {item.type === "subscription" &&
                      `Subscription (${item.data.plan})`}
                    {item.type === "payment" && "Payment Received"}
                    {item.type === "invoice" && "Invoice Generated"}
                  </div>

                  <div className="text-xs text-slate-500">
                    {new Date(item.data.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right">
                  {item.data.amount && (
                    <div className="font-semibold">
                      ₦{item.data.amount.toLocaleString()}
                    </div>
                  )}

                  {item.data.plan && (
                    <div className="text-sm text-slate-500 capitalize">
                      {item.data.plan}
                    </div>
                  )}

                  {item.data.reference && (
                    <div className="text-xs font-mono">
                      {item.data.reference}
                    </div>
                  )}

                  {item.data.invoiceNumber && (
                    <div className="text-xs">
                      {item.data.invoiceNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}