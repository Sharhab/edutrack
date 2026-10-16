
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import OnboardingForm from "../../components/onboarding/OnboardinForm";
import type { OnboardingFormValues } from "../../types/onboarding";
import { useTenant } from "../../components/tenant/TenantProvider";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edutrack-dpui.onrender.com/api",
  withCredentials: true,
});

type Plan = "starter" | "growth" | "premium";
type BillingCycle = "monthly" | "quarterly" | "yearly";

const pricing: Record<BillingCycle, Record<Plan, number>> = {
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

export default function OnboardingPage() {
  const { clearTenant } = useTenant();

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
  const [isTrial, setIsTrial] = useState(false);

  useEffect(() => {
    clearTenant();
  }, [clearTenant]);

  function updateForm(
    field: keyof OnboardingFormValues,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  const amount = useMemo(() => {
    const plan = form.plan as Plan;
    const cycle = form.billingCycle as BillingCycle;

    return pricing[cycle][plan];
  }, [form.plan, form.billingCycle]);

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

    if (form.adminPassword !== form.confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  }

  function next() {
    setError("");

    if (step === 1) {
      const validationError = validateStep1();

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  function back() {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function submit() {
    const validationError = validateStep3();

    if (validationError) {
      setError(validationError);
      return;
    }

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
        plan: form.plan,
        billingCycle: form.billingCycle,
        amount,
        isTrial,
        callbackUrl: `${window.location.origin}/onboarding/success`,
      };

      if (isTrial) {
        await api.post("/onboarding", payload);
        window.location.href = "/login";
        return;
      }

      const response = await api.post(
        "/onboarding/paystack/initialize",
        payload
      );

      const checkoutUrl = response.data?.authorizationUrl;

      if (!checkoutUrl) {
        throw new Error("Paystack URL missing");
      }

      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      const errorObject = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        errorObject.response?.data?.message ||
          errorObject.message ||
          "Onboarding failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">
          Create Your School
        </h1>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-500/20 p-3 text-red-200"
          >
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 p-4">
          <div>
            <h3 className="font-semibold">Start Free Trial</h3>
            <p className="text-sm text-slate-400">
              7 days free access, no payment required
            </p>
          </div>

          <button
            type="button"
            aria-pressed={isTrial}
            onClick={() => setIsTrial((current) => !current)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              isTrial
                ? "bg-green-500 text-black"
                : "bg-white/10 text-white"
            }`}
          >
            {isTrial ? "Enabled" : "Enable"}
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
    </main>
  );
}
