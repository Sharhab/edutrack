"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { Check, Crown, Rocket, School } from "lucide-react";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api",
  withCredentials: true,
});

type PlanType =
  | "starter"
  | "growth"
  | "premium";

type BillingCycle =
  | "monthly"
  | "quarterly"
  | "yearly";

export default function UpgradePage() {
  const [plan, setPlan] =
    useState<PlanType>("starter");

  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("monthly");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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
      setError("");

      const response = await api.post(
        "/billing/paystack/initialize",
        {
          plan,
          billingCycle,
        }
      );

      const url =
        response.data?.data.authorizationUrl;

      if (!url) {
        throw new Error(
          "Payment URL missing from server"
        );
      }

      window.location.href = url;
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to initialize payment"
      );
    } finally {
      setLoading(false);
    }
  }

  const plans = [
    {
      key: "starter" as PlanType,
      title: "Starter",
      icon: School,
      description:
        "Perfect for small schools",
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
      description:
        "Ideal for growing schools",
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
      description:
        "Enterprise school solution",
      features: [
        "Everything in Growth",
        "Custom Branding",
        "Priority Support",
        "Analytics",
        "Unlimited Growth",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold">
            Upgrade Subscription
          </h1>

          <p className="mt-3 text-slate-400">
            Select the plan that best
            fits your school.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* BILLING CYCLE */}
        <div className="mb-10 flex justify-center">
          <div className="flex rounded-2xl border border-slate-800 bg-slate-900 p-1">

            {(
              [
                "monthly",
                "quarterly",
                "yearly",
              ] as BillingCycle[]
            ).map((cycle) => (
              <button
                key={cycle}
                onClick={() =>
                  setBillingCycle(cycle)
                }
                className={`rounded-xl px-6 py-3 text-sm font-medium capitalize transition ${
                  billingCycle === cycle
                    ? "bg-cyan-500 text-black"
                    : "text-slate-300"
                }`}
              >
                {cycle}
              </button>
            ))}

          </div>
        </div>

        {/* PLANS */}
        <div className="grid gap-6 lg:grid-cols-3">

          {plans.map((item) => {
            const Icon = item.icon;

            const selected =
              item.key === plan;

            const price =
              pricing[billingCycle][
                item.key
              ];

            return (
              <button
                key={item.key}
                onClick={() =>
                  setPlan(item.key)
                }
                className={`rounded-3xl border p-6 text-left transition ${
                  selected
                    ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={24} />

                  <h2 className="text-xl font-bold">
                    {item.title}
                  </h2>
                </div>

                <p className="mt-3 text-slate-400">
                  {item.description}
                </p>

                <div className="mt-5">
                  <span className="text-4xl font-bold">
                    ₦
                    {price.toLocaleString()}
                  </span>

                  <span className="ml-2 text-slate-400">
                    /{billingCycle}
                  </span>
                </div>

                <ul className="mt-6 space-y-3">

                  {item.features.map(
                    (feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <Check
                          size={16}
                        />

                        {feature}
                      </li>
                    )
                  )}

                </ul>

                {selected && (
                  <div className="mt-6 rounded-xl bg-cyan-500 py-2 text-center text-sm font-semibold text-black">
                    Selected Plan
                  </div>
                )}
              </button>
            );
          })}

        </div>

        {/* SUMMARY */}
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-8">

          <h3 className="text-2xl font-bold">
            Order Summary
          </h3>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Plan
              </span>

              <span className="font-semibold capitalize">
                {plan}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Billing Cycle
              </span>

              <span className="font-semibold capitalize">
                {billingCycle}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">

                <span className="text-lg">
                  Total Amount
                </span>

                <span className="text-3xl font-bold text-cyan-400">
                  ₦
                  {amount.toLocaleString()}
                </span>

              </div>
            </div>

          </div>

          <button
            onClick={upgrade}
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-cyan-500 px-6 py-4 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Redirecting to Paystack..."
              : `Pay ₦${amount.toLocaleString()} & Upgrade`}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Secure payment powered by
            Paystack.
          </p>

        </div>

      </div>
    </div>
  );
}