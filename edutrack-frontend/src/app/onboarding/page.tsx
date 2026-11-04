

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

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

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

  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoError, setLogoError] = useState("");

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
    return pricing[form.billingCycle][form.plan];
  }, [form.plan, form.billingCycle]);

  function validateStep1() {
    if (!form.schoolName.trim()) {
      return "School name is required.";
    }

    const slug = form.slug.trim();

    if (!slug) {
      return "School portal address is required.";
    }

    if (
      slug.length < 3 ||
      slug.length > 50 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return "Use 3–50 lowercase letters or numbers, with single hyphens between words.";
    }

    if (!form.adminFirstName.trim()) {
      return "Administrator first name is required.";
    }

    if (!form.adminLastName.trim()) {
      return "Administrator last name is required.";
    }

    if (!form.adminEmail.trim()) {
      return "Administrator email is required.";
    }

    return "";
  }

  function validateStep3() {
    if (!form.adminPassword) {
      return "Password is required.";
    }

    if (form.adminPassword.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (form.adminPassword !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  }

  async function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setLogoError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Logo must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Could not read the image."));
            }
          };

          reader.onerror = () => {
            reject(new Error("Could not read the selected logo."));
          };

          reader.readAsDataURL(file);
        }
      );

      setLogoDataUrl(dataUrl);
      setLogoFileName(file.name);
    } catch {
      setLogoError("Could not load this image. Please try another.");
      setLogoDataUrl("");
      setLogoFileName("");
      event.target.value = "";
    }
  }

  function removeLogo() {
    setLogoDataUrl("");
    setLogoFileName("");
    setLogoError("");

    const input = document.getElementById(
      "school-logo"
    ) as HTMLInputElement | null;

    if (input) input.value = "";
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
    const validationError = validateStep1() || validateStep3();

    if (validationError) {
      setError(validationError);

      if (validateStep1()) {
        setStep(1);
      } else {
        setStep(3);
      }

      return;
    }

    if (logoError) {
      setError(logoError);
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        schoolName: form.schoolName.trim(),
        slug: form.slug.trim(),
        adminFirstName: form.adminFirstName.trim(),
        adminLastName: form.adminLastName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
        phone: form.phone.trim(),
        address: form.address.trim(),
        plan: form.plan,
        billingCycle: form.billingCycle,
        amount,
        isTrial,
        callbackUrl: `${window.location.origin}/onboarding/success`,

        // The backend must be updated to save this field.
        schoolLogo: logoDataUrl || undefined,
      };

      if (isTrial) {
        const response = await api.post(
          "/onboarding/trial",
          payload
        );

        const publicUrl =
          response.data?.data?.publicUrl ||
          response.data?.data?.landingPage;

        if (!publicUrl) {
          throw new Error(
            "School was created, but its public portal URL was not returned."
          );
        }

        window.location.assign(publicUrl);
        return;
      }

      const response = await api.post(
        "/onboarding/paystack/initialize",
        payload
      );

      const checkoutUrl = response.data?.authorizationUrl;

      if (!checkoutUrl) {
        throw new Error("Paystack checkout URL was not returned.");
      }

      window.location.assign(checkoutUrl);
    } catch (err: unknown) {
      const errorObject = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

      setError(
        errorObject.response?.data?.message ||
          errorObject.message ||
          "Registration could not continue. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            EduTrack School Management
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Create Your School
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Set up your school portal, add your school branding,
            choose a plan, and create your administrator account.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05]">
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="School logo preview"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="px-2 text-center">
                  <span className="text-3xl text-cyan-400">+</span>
                  <p className="text-xs text-slate-400">
                    School logo
                  </p>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">
                Add Your School Logo
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Use your school’s official logo to help identify
                your school on its portal and school documents.
                PNG, JPG, and WebP images up to 2 MB are supported.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label
                  htmlFor="school-logo"
                  className="inline-flex cursor-pointer items-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  {logoDataUrl ? "Choose another logo" : "Upload logo"}
                </label>

                <input
                  id="school-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="sr-only"
                />

                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5"
                  >
                    Remove logo
                  </button>
                )}
              </div>

              {logoFileName && (
                <p className="mt-2 break-all text-xs text-slate-400">
                  Selected: {logoFileName}
                </p>
              )}

              {logoError && (
                <p role="alert" className="mt-2 text-sm text-red-300">
                  {logoError}
                </p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                You can continue without a logo and add one later.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Start a 7-Day Free Trial</h2>
              <p className="mt-1 text-sm text-slate-400">
                Create your school account without paying now.
              </p>
            </div>

            <button
              type="button"
              aria-pressed={isTrial}
              onClick={() => {
                setIsTrial((current) => !current);
                setError("");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
                isTrial
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {isTrial ? "Free trial enabled" : "Enable free trial"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3].map((number) => (
              <div key={number} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step >= number
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {number}
                </div>

                <span className="hidden text-xs text-slate-400 sm:inline">
                  {number === 1
                    ? "School details"
                    : number === 2
                      ? "Plan"
                      : "Account"}
                </span>

                {number < 3 && (
                  <div className="h-px flex-1 bg-white/10" />
                )}
              </div>
            ))}
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
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          By creating your school account, you confirm that you are
          authorized to register this school on EduTrack.
        </p>
      </div>
    </main>
  );
}
