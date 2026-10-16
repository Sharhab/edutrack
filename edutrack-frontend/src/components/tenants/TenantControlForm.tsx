
"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { Tenant, TenantControlPayload } from "../../types/tenant";

type Props = {
  tenant: Tenant;
  values: TenantControlPayload;
  onChange: (field: keyof TenantControlPayload, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

function dateValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

export default function TenantControlForm({
  tenant,
  values,
  onChange,
  onSubmit,
  submitting = false,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
        <h3 className="font-semibold text-white">
          {tenant.schoolName}
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          Manage access, trial dates, subscription status, and plan.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Billing: {tenant.billingStatus || "Unknown"} ·
          Subscription: {tenant.subscriptionStatus || "Unknown"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="School Access"
          name="status"
          value={values.status || tenant.status}
          onChange={(v) => onChange("status", v)}
          options={[
            { label: "Enabled", value: "active" },
            { label: "Disabled", value: "inactive" },
          ]}
        />

        <SelectField
          label="Subscription Status"
          name="subscriptionStatus"
          value={values.subscriptionStatus || tenant.subscriptionStatus || "trial"}
          onChange={(v) => onChange("subscriptionStatus", v)}
          options={[
            { label: "Free Trial", value: "trial" },
            { label: "Active Paid", value: "active" },
            { label: "Pending Payment", value: "pending" },
            { label: "Payment Due", value: "past_due" },
            { label: "Expired", value: "expired" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Inactive", value: "inactive" },
          ]}
        />

        <SelectField
          label="Plan"
          name="plan"
          value={values.plan || tenant.plan}
          onChange={(v) => onChange("plan", v)}
          options={[
            { label: "Starter", value: "starter" },
            { label: "Growth", value: "growth" },
            { label: "Premium", value: "premium" },
          ]}
        />

        <SelectField
          label="Billing Cycle"
          name="billingCycle"
          value={values.billingCycle || tenant.billingCycle || "monthly"}
          onChange={(v) => onChange("billingCycle", v)}
          options={[
            { label: "Monthly", value: "monthly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Yearly", value: "yearly" },
          ]}
        />

        <FormInput
          label="Trial Start Date"
          name="trialStartAt"
          type="date"
          value={dateValue(values.trialStartAt ?? tenant.trialStartAt)}
          onChange={(v) => onChange("trialStartAt", v)}
        />

        <FormInput
          label="Trial End Date"
          name="trialEndsAt"
          type="date"
          value={dateValue(values.trialEndsAt ?? tenant.trialEndsAt)}
          onChange={(v) => onChange("trialEndsAt", v)}
        />

        <div className="md:col-span-2">
          <FormInput
            label="Paid Subscription Expiry"
            name="expiryDate"
            type="date"
            value={dateValue(values.expiryDate ?? tenant.subscriptionExpiresAt)}
            onChange={(v) => onChange("expiryDate", v)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
        Changing a status or date should update the school's access and
        billing records on the server. Saving these controls alone must not
        be treated as proof of payment.
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving changes..." : "Save Tenant Controls"}
      </button>
    </div>
  );
}
