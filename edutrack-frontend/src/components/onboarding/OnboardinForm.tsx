
"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import type { OnboardingFormValues } from "../../types/onboarding";
import PlanSelectCard from "../../components/onboarding/PlanSelectCard";

type Plan = "starter" | "growth" | "premium";
type BillingCycle = "monthly" | "quarterly" | "yearly";

type OnboardingFormProps = {
  values: OnboardingFormValues;
  onChange: (
    field: keyof OnboardingFormValues,
    value: string
  ) => void;
  onSubmit: () => void;
  submitting?: boolean;
  step: number;
  onNext: () => void;
  onBack: () => void;
};

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

const plans: {
  key: Plan;
  title: string;
  description: string;
  features: string[];
}[] = [
  {
    key: "starter",
    title: "Starter",
    description: "Best for small schools",
    features: ["Basic dashboard", "Students", "Results"],
  },
  {
    key: "growth",
    title: "Growth",
    description: "Best for growing schools",
    features: ["Parent portal", "Attendance", "Announcements"],
  },
  {
    key: "premium",
    title: "Premium",
    description: "Best for advanced schools",
    features: ["Analytics", "Priority support", "Full features"],
  },
];

export default function OnboardingForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
  step,
  onNext,
  onBack,
}: OnboardingFormProps) {
  const cycle = (values.billingCycle || "monthly") as BillingCycle;

  return (
    <div className="space-y-6">
      {step === 1 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="School Name"
              name="schoolName"
              value={values.schoolName || ""}
              placeholder="Your school name"
              onChange={(value) => onChange("schoolName", value)}
            />

            <FormInput
              label="School Slug"
              name="slug"
              value={values.slug || ""}
              placeholder="your-school"
              onChange={(value) => onChange("slug", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Admin First Name"
              name="adminFirstName"
              value={values.adminFirstName || ""}
              placeholder="First name"
              onChange={(value) => onChange("adminFirstName", value)}
            />

            <FormInput
              label="Admin Last Name"
              name="adminLastName"
              value={values.adminLastName || ""}
              placeholder="Last name"
              onChange={(value) => onChange("adminLastName", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Admin Email"
              name="email"
              type="email"
              value={values.adminEmail || ""}
              placeholder="admin@school.com"
              onChange={(value) => onChange("adminEmail", value)}
            />

            <FormInput
              label="Phone"
              name="phone"
              value={values.phone || ""}
              placeholder="080..."
              onChange={(value) => onChange("phone", value)}
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            value={values.address || ""}
            placeholder="School address"
            onChange={(value) => onChange("address", value)}
          />

          <button type="button" onClick={onNext} className="btn-primary">
            Continue
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanSelectCard
                key={plan.key}
                title={plan.title}
                price={`₦${pricing[cycle][plan.key].toLocaleString("en-NG")}`}
                description={plan.description}
                features={plan.features}
                active={values.plan === plan.key}
                onClick={() => onChange("plan", plan.key)}
              />
            ))}
          </div>

          <div className="max-w-sm">
            <SelectField
              label="Billing Cycle"
              name="billingCycle"
              value={cycle}
              onChange={(value) =>
                onChange("billingCycle", value)
              }
              options={[
                { label: "Monthly", value: "monthly" },
                { label: "Quarterly", value: "quarterly" },
                { label: "Yearly", value: "yearly" },
              ]}
            />
          </div>

          <p className="text-sm text-slate-400">
            Prices are shown in Nigerian naira for the selected billing period.
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="btn-secondary">
              Back
            </button>
            <button type="button" onClick={onNext} className="btn-primary">
              Continue
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Password"
              name="adminPassword"
              type="password"
              value={values.adminPassword || ""}
              placeholder="Enter password"
              onChange={(value) => onChange("adminPassword", value)}
            />

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={values.confirmPassword || ""}
              placeholder="Confirm password"
              onChange={(value) => onChange("confirmPassword", value)}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-lg font-semibold">Summary</h3>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>School: <strong>{values.schoolName || "-"}</strong></p>
              <p>
                Admin:{" "}
                <strong>
                  {values.adminFirstName || "-"} {values.adminLastName || ""}
                </strong>
              </p>
              <p>
                Plan:{" "}
                <strong className="capitalize">{values.plan}</strong>
              </p>
              <p>
                Billing cycle:{" "}
                <strong className="capitalize">{cycle}</strong>
              </p>
              <p>
                Amount:{" "}
                <strong>
                  {`₦${pricing[cycle][values.plan as Plan].toLocaleString("en-NG")}`}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create School & Continue"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
