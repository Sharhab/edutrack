
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Crown, Rocket, School } from "lucide-react";
import api from "../../../../../lib/axios";

type PlanType = "starter" | "growth" | "premium";
type BillingCycle = "monthly" | "quarterly" | "yearly";

type CurrentBilling = {
  plan: PlanType;
  billingCycle: BillingCycle;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string | null;
  trialEndsAt?: string | null;
  isActive: boolean;
};

const pricing: Record<BillingCycle, Record<PlanType, number>> = {
  monthly: {
    starter: 10000,
    growth: 25000,
    premium: 50000,
  },
  quarterly: {
    starter: 27000,
    growth: 67500,
    premium: 135000,
  },
  yearly: {
    starter: 96000,
    growth: 240000,
    premium: 480000,
  },
};

const plans = [
  {
    key: "starter" as PlanType,
    title: "Starter",
    icon: School,
    description: "Perfect for small schools",
    features: [
      "Student Management",
      "Attendance",
      "Results",
      "Basic Reports",
      "School Dashboard",
    ],
  },
  {
    key: "growth" as PlanType,
    title: "Growth",
    icon: Rocket,
    description: "Ideal for growing schools",
    features: [
      "Everything in Starter",
      "Parent Portal",
      "Announcements",
      "SMS Ready",
      "Advanced Reports",
    ],
  },
  {
    key: "premium" as PlanType,
    title: "Premium",
    icon: Crown,
    description: "For schools needing advanced capabilities",
    features: [
      "Everything in Growth",
      "Custom Branding",
      "Priority Support",
      "Analytics",
      "Expanded school management",
    ],
  },
];

export default function UpgradePage() {
  const [plan, setPlan] = useState<PlanType>("starter");
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("monthly");
  const [currentBilling, setCurrentBilling] =
    useState<CurrentBilling | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = useMemo(
    () => pricing[billingCycle][plan],
    [billingCycle, plan]
  );

  useEffect(() => {
    let mounted = true;

    async function loadCurrentBilling() {
      try {
        const response = await api.get("/billing/current");
        const data = response.data?.data;

        if (mounted && data) {
          setCurrentBilling(data);

          if (
            ["starter", "growth", "premium"].includes(data.plan)
          ) {
            setPlan(data.plan);
          }

          if (
            ["monthly", "quarterly", "yearly"].includes(
              data.billingCycle
            )
          ) {
            setBillingCycle(data.billingCycle);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.response?.data?.message ||
              "Could not load your current subscription. You can still select a plan and retry."
          );
        }
      } finally {
        if (mounted) setLoadingBilling(false);
      }
    }

    loadCurrentBilling();

    return () => {
      mounted = false;
    };
  }, []);

  async function startCheckout() {
    try {
      setLoading(true);
      setError("");

      const hasActivePaidSubscription =
        currentBilling?.subscriptionStatus === "active" &&
        currentBilling?.isActive === true &&
        currentBilling?.subscriptionExpiresAt &&
        new Date(currentBilling.subscriptionExpiresAt).getTime() >
          Date.now();

      const isChangingPlan =
        hasActivePaidSubscription &&
        currentBilling?.plan !== plan;

      // Use the upgrade endpoint only when changing an active paid plan.
      // Renewal/new checkout continues using the existing Paystack route.
      const endpoint = isChangingPlan
        ? "/billing/upgrade"
        : "/billing/paystack/initialize";

      const response = await api.post(endpoint, {
        plan,
        billingCycle,
      });

      const checkoutUrl =
        response.data?.data?.authorizationUrl;

      if (!checkoutUrl) {
        throw new Error("The server did not return a Paystack checkout URL.");
      }

      window.location.assign(checkoutUrl);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not initialize subscription payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedPrice = amount.toLocaleString("en-NG");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            EduTrack Billing
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Choose your school plan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Select a plan and billing period. Your payment will be
            verified by EduTrack before the subscription is activated.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200"
          >
            {error}
          </div>
        )}

        {currentBilling && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Current subscription</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold capitalize">
                {currentBilling.plan}
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm capitalize">
                {currentBilling.subscriptionStatus}
              </span>
              {currentBilling.subscriptionExpiresAt && (
                <span className="text-sm text-slate-400">
                  Expires{" "}
                  {new Date(
                    currentBilling.subscriptionExpiresAt
                  ).toLocaleDateString()}
                </span>
              )}
              {currentBilling.trialEndsAt &&
                currentBilling.subscriptionStatus === "trial" && (
                  <span className="text-sm text-slate-400">
                    Trial ends{" "}
                    {new Date(
                      currentBilling.trialEndsAt
                    ).toLocaleDateString()}
                  </span>
                )}
            </div>
          </section>
        )}

        <section
          aria-label="Billing period"
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          {(["monthly", "quarterly", "yearly"] as BillingCycle[]).map(
            (cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                aria-pressed={billingCycle === cycle}
                className={`rounded-xl border px-5 py-3 text-sm font-semibold capitalize transition ${
                  billingCycle === cycle
                    ? "border-cyan-400 bg-cyan-400 text-slate-950"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                }`}
              >
                {cycle}
                {cycle === "quarterly" && (
                  <span className="ml-2 text-xs">Save 10%</span>
                )}
                {cycle === "yearly" && (
                  <span className="ml-2 text-xs">Save 20%</span>
                )}
              </button>
            )
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((item) => {
            const Icon = item.icon;
            const selected = plan === item.key;
            const price = pricing[billingCycle][item.key];

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPlan(item.key)}
                aria-pressed={selected}
                className={`rounded-3xl border p-6 text-left transition ${
                  selected
                    ? "border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={24} className="text-cyan-400" />
                  <h2 className="text-xl font-bold">{item.title}</h2>
                </div>

                <p className="mt-3 min-h-6 text-sm text-slate-400">
                  {item.description}
                </p>

                <div className="mt-6">
                  <span className="text-3xl font-bold sm:text-4xl">
                    ₦{price.toLocaleString("en-NG")}
                  </span>
                  <span className="ml-2 text-sm text-slate-400">
                    / {billingCycle}
                  </span>
                </div>

                <ul className="mt-6 space-y-3">
                  {item.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-cyan-400"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {selected && (
                  <div className="mt-6 rounded-xl bg-cyan-400 py-2 text-center text-sm font-semibold text-slate-950">
                    Selected plan
                  </div>
                )}
              </button>
            );
          })}
        </section>

        <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Order summary</h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Plan</span>
              <span className="font-semibold capitalize">{plan}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Billing period</span>
              <span className="font-semibold capitalize">
                {billingCycle}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-800 pt-4">
              <span className="text-lg">Total</span>
              <span className="text-2xl font-bold text-cyan-400">
                ₦{selectedPrice}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={startCheckout}
            disabled={loading || loadingBilling}
            className="mt-7 w-full rounded-2xl bg-cyan-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Opening secure checkout..."
              : loadingBilling
                ? "Loading subscription..."
                : `Continue to Paystack — ₦${selectedPrice}`}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Your subscription is activated only after successful payment
            verification.
          </p>
        </section>
      </div>
    </main>
  );
}
