"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { OnboardingFormValues } from "../../types/onboarding";
import PlanSelectCard from "../../components/onboarding/PlanSelectCard";

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

export default function OnboardingForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
  step,
  onNext,
  onBack,
}: OnboardingFormProps) {
  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="School Name"
              name="schoolName"
              value={values.schoolName || ""}
              placeholder="Globstand International School"
              onChange={(value) =>
                onChange("schoolName", value)
              }
            />

            <FormInput
              label="School Slug"
              name="slug"
              value={values.slug || ""}
              placeholder="globstand-school"
              onChange={(value) =>
                onChange("slug", value)
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Admin First Name"
              name="adminFirstName"
              value={values.adminFirstName || ""}
              placeholder="Sharhabilu"
              onChange={(value) =>
                onChange("adminFirstName", value)
              }
            />

            <FormInput
              label="Admin Last Name"
              name="adminLastName"
              value={values.adminLastName || ""}
              placeholder="Musa"
              onChange={(value) =>
                onChange("adminLastName", value)
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Admin Email"
              name="email"
              type="email"
              value={values.adminEmail || ""}
              placeholder="admin@school.com"
              onChange={(value) =>
                onChange("adminEmail", value)
              }
            />

            <FormInput
              label="Phone"
              name="phone"
              value={values.phone || ""}
              placeholder="080..."
              onChange={(value) =>
                onChange("phone", value)
              }
            />
          </div>

          <div>
            <FormInput
              label="Address"
              name="address"
              value={values.address || ""}
              placeholder="School address"
              onChange={(value) =>
                onChange("address", value)
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onNext}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <PlanSelectCard
              title="Starter"
              price="₦500"
              description="Best for small schools"
              features={[
                "Basic dashboard",
                "Students",
                "Results",
              ]}
              active={values.plan === "starter"}
              onClick={() =>
                onChange("plan", "starter")
              }
            />

            <PlanSelectCard
              title="Growth"
              price="₦25,000"
              description="Best for growing schools"
              features={[
                "Parent portal",
                "Attendance",
                "Announcements",
              ]}
              active={values.plan === "growth"}
              onClick={() =>
                onChange("plan", "growth")
              }
            />

            <PlanSelectCard
              title="Premium"
              price="₦50,000"
              description="Best for advanced schools"
              features={[
                "Analytics",
                "Priority support",
                "Full features",
              ]}
              active={values.plan === "premium"}
              onClick={() =>
                onChange("plan", "premium")
              }
            />
          </div>

          <div className="max-w-sm">
            <SelectField
              label="Billing Cycle"
              name="billingCycle"
              value={values.billingCycle || "monthly"}
              onChange={(value) =>
                onChange(
                  "billingCycle",
                  value as
                    | "monthly"
                    | "quarterly"
                    | "yearly"
                )
              }
              options={[
                {
                  label: "Monthly",
                  value: "monthly",
                },
                {
                  label: "Quarterly",
                  value: "quarterly",
                },
                {
                  label: "Yearly",
                  value: "yearly",
                },
              ]}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Password"
              name="adminPassword"
              type="password"
              value={values.adminPassword || ""}
              placeholder="Enter password"
              onChange={(value) =>
                onChange("adminPassword", value)
              }
            />

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={values.confirmPassword || ""}
              placeholder="Confirm password"
              onChange={(value) =>
                onChange("confirmPassword", value)
              }
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-lg font-semibold text-white">
              Summary
            </h3>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>
                School:{" "}
                <span className="font-semibold">
                  {values.schoolName || "-"}
                </span>
              </p>

              <p>
                Admin:{" "}
                <span className="font-semibold">
                  {values.adminFirstName || "-"}
                </span>
              </p>

              <p>
                Plan:{" "}
                <span className="font-semibold capitalize">
                  {values.plan || "-"}
                </span>
              </p>

              <p>
                Cycle:{" "}
                <span className="font-semibold capitalize">
                  {values.billingCycle || "-"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Creating..."
                : "Create School & Continue"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}