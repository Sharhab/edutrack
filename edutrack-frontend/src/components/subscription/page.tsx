"use client";

import { useMemo, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api",
  withCredentials: true,
});

type PlanKey =
  | "starter"
  | "growth"
  | "premium";

export default function SubscriptionPage() {
  const [plan, setPlan] =
    useState<PlanKey>("starter");

  const [billingCycle, setBillingCycle] =
    useState<
      "monthly" | "quarterly" | "yearly"
    >("monthly");

  const [loading, setLoading] =
    useState(false);

  const pricing = {
    monthly: {
      starter: 10000,
      growth: 20000,
      premium: 40000,
    },
    quarterly: {
      starter: 25000,
      growth: 60000,
      premium: 120000,
    },
    yearly: {
      starter: 100000,
      growth: 200000,
      premium: 450000,
    },
  };

  const amount = useMemo(() => {
    return pricing[billingCycle][plan];
  }, [plan, billingCycle]);

  async function upgrade() {
    try {
      setLoading(true);

      const res = await api.post(
        "/finance/paystack/initialize",
        {
          plan,
          billingCycle,
        }
      );

      const url =
        res.data?.authorizationUrl;

      if (!url) {
        throw new Error(
          "Payment URL missing"
        );
      }

      window.location.href = url;
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Upgrade failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const plans = [
    {
      key: "starter",
      title: "Starter",
      description:
        "Perfect for small schools",
      features: [
        "Students Management",
        "Attendance",
        "Results",
        "Basic Reports",
      ],
    },
    {
      key: "growth",
      title: "Growth",
      description:
        "Best for growing schools",
      features: [
        "Everything in Starter",
        "Parent Portal",
        "Announcements",
        "SMS Ready",
      ],
    },
    {
      key: "premium",
      title: "Premium",
      description:
        "Enterprise-grade features",
      features: [
        "Everything in Growth",
        "Advanced Analytics",
        "Priority Support",
        "Custom Branding",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Subscription Center
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your school's plan,
            billing and subscription.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="font-semibold text-amber-300">
            Trial Expiring Soon
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            Upgrade now to avoid
            interruption of service.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {["monthly", "quarterly", "yearly"].map(
            (cycle) => (
              <button
                key={cycle}
                onClick={() =>
                  setBillingCycle(
                    cycle as any
                  )
                }
                className={`rounded-xl px-5 py-2 ${
                  billingCycle === cycle
                    ? "bg-cyan-500 text-black"
                    : "bg-slate-800"
                }`}
              >
                {cycle}
              </button>
            )
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-4">

          <div className="lg:col-span-3">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((item) => {
                const selected =
                  plan === item.key;

                const price =
                  pricing[
                    billingCycle
                  ][
                    item.key as PlanKey
                  ];

                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      setPlan(
                        item.key as PlanKey
                      )
                    }
                    className={`rounded-3xl border p-6 text-left transition ${
                      selected
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-800"
                    }`}
                  >
                    <h2 className="text-xl font-bold">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-slate-400">
                      {
                        item.description
                      }
                    </p>

                    <p className="mt-4 text-3xl font-bold">
                      ₦
                      {price.toLocaleString()}
                    </p>

                    <ul className="mt-5 space-y-2 text-sm text-slate-300">
                      {item.features.map(
                        (
                          feature
                        ) => (
                          <li
                            key={
                              feature
                            }
                          >
                            ✓ {feature}
                          </li>
                        )
                      )}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="sticky top-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">

              <h3 className="text-lg font-semibold">
                Order Summary
              </h3>

              <div className="mt-6 space-y-4">

                <div>
                  <p className="text-sm text-slate-400">
                    Plan
                  </p>

                  <p className="capitalize font-medium">
                    {plan}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Billing
                  </p>

                  <p className="capitalize font-medium">
                    {billingCycle}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Amount
                  </p>

                  <p className="text-2xl font-bold text-cyan-400">
                    ₦
                    {amount.toLocaleString()}
                  </p>
                </div>

              </div>

              <button
                onClick={upgrade}
                disabled={loading}
                className="mt-8 w-full rounded-2xl bg-cyan-500 px-5 py-4 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {loading
                  ? "Redirecting..."
                  : "Upgrade Subscription"}
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}