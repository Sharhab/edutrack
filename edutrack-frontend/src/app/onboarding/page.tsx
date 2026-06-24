"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import OnboardingForm from "../../components/onboarding/OnboardinForm";
import { OnboardingFormValues } from "../../types/onboarding";
import { useTenant } from "../../components/tenant/TenantProvider";

/**
 * API
 */
const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

export default function OnboardingPage() {
  const { clearTenant } = useTenant();

  /**
   * FORM STATE
   */
  const [form, setForm] = useState<OnboardingFormValues>({
    schoolName: "",
    slug: "",

    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",

    phone: "",
    address: "",

    plan: "starter",
    billingCycle: "monthly",

    adminPassword: "",
    confirmPassword: "",
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /**
   * FREE TRIAL STATE
   */
  const [isTrial, setIsTrial] = useState(false);

  /**
   * CLEAR TENANT
   */
  useEffect(() => {
    clearTenant();
  }, [clearTenant]);

  /**
   * UPDATE FORM
   */
  function updateForm(
    field: keyof OnboardingFormValues,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  /**
   * PRICING
   */
  const pricing = {
    monthly: { starter: 10000, growth: 20000, premium: 40000 },
    quarterly: { starter: 25000, growth: 60000, premium: 120000 },
    yearly: { starter: 100000, growth: 200000, premium: 450000 },
  } as const;

  const amount = useMemo(() => {
    const plan = form.plan as keyof typeof pricing.monthly;

    if (form.billingCycle === "yearly") return pricing.yearly[plan];
    if (form.billingCycle === "quarterly") return pricing.quarterly[plan];

    return pricing.monthly[plan];
  }, [form.plan, form.billingCycle]);

  /**
   * VALIDATION
   */
  function validateStep1() {
    if (!form.schoolName.trim()) return "School name is required";
    if (!form.adminEmail.trim()) return "Admin email is required";
    if (!form.adminFirstName.trim()) return "First name is required";
    if (!form.adminLastName.trim()) return "Last name is required";
    return "";
  }

  function validateStep3() {
    if (!form.adminPassword) return "Password is required";
    if (form.adminPassword.length < 6) return "Password too short";
    if (form.adminPassword !== form.confirmPassword)
      return "Passwords do not match";
    return "";
  }

  /**
   * STEP CONTROL
   */
  function next() {
    setError("");

    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
    }

    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  /**
   * 🚀 SUBMIT (TRIAL + PAYSTACK FLOW)
   */
  async function submit() {
    const err = validateStep3();
    if (err) return setError(err);

    if (!form.schoolName.trim()) {
      setError("School name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

    const payload = {
  schoolName: form.schoolName,
  adminFirstName: form.adminFirstName,
  adminLastName: form.adminLastName,
  adminEmail: form.adminEmail,
  adminPassword: form.adminPassword,
  phone: form.phone,
  address: form.address,
  plan: form.plan, // starter|growth|premium
  billingCycle: form.billingCycle,
  amount,
  isTrial,
  callbackUrl: `${window.location.origin}/onboarding/success`,
};
      console.log("🚀 PAYLOAD:", payload);

      /**
       * =========================
       * FREE TRIAL FLOW
       * =========================
       */
      if (isTrial) {
        const res = await api.post("/onboarding", payload);

        console.log("✅ TRIAL RESPONSE:", res.data);

        window.location.href = "/login";
        return;
      }

      /**
       * =========================
       * PAYSTACK FLOW
       * =========================
       */
      const res = await api.post(
        "/onboarding/paystack/initialize",
        payload
      );

      const url = res.data?.authorizationUrl;

      if (!url) throw new Error("Paystack URL missing");

      window.location.href = url;
    } catch (e: any) {
      console.error("❌ ONBOARDING ERROR:", e);

      setError(
        e?.response?.data?.message ||
          e.message ||
          "Onboarding failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold">
          Create Your School
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-red-200">
            {error}
          </div>
        )}

        {/* 🔥 FREE TRIAL TOGGLE */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 p-4">
          <div>
            <h3 className="font-semibold">
              Start Free Trial
            </h3>
            <p className="text-sm text-slate-400">
              7 days free access, no payment required
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsTrial(!isTrial)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              isTrial
                ? "bg-green-500 text-black"
                : "bg-white/10 text-white"
            }`}
          >
            {isTrial ? "Active" : "Enable"}
          </button>
        </div>

        <OnboardingForm
          values={form}
          onChange={updateForm}
          onSubmit={submit}
          submitting={submitting}
          step={step}
          onNext={next}
          onBack={back}
        />
      </div>
    </div>
  );
}