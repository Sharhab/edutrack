
"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { SubscriptionFormValues } from "../../types/billing";
import { Tenant } from "../../types/tenant";

type SubscriptionFormProps = {
  values: SubscriptionFormValues;
  tenants: Tenant[];
  onChange: (field: keyof SubscriptionFormValues, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function SubscriptionForm({
  values,
  tenants,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save Subscription",
}: SubscriptionFormProps) {
  return (
    <div className="space-y-5">
      <SelectField
        label="Tenant / School"
        name="tenantId"
        value={values.tenantId}
        onChange={(value) => onChange("tenantId", value)}
        options={[
          { label: "Select Tenant", value: "" },
          ...tenants.map((tenant) => ({
            label: tenant.schoolName,
            value: tenant._id,
          })),
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Plan"
          name="plan"
          value={values.plan}
          onChange={(value) => onChange("plan", value)}
          options={[
            { label: "Starter", value: "starter" },
            { label: "Growth", value: "growth" },
            { label: "Premium", value: "premium" },
          ]}
        />

        <FormInput
          label="Amount (₦)"
          name="amount"
          type="number"
          value={values.amount}
          placeholder="10000"
          onChange={(value) => onChange("amount", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Status"
          name="status"
          value={values.status}
          onChange={(value) => onChange("status", value)}
          options={[
            { label: "Trial", value: "trial" },
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Past Due", value: "past_due" },
            { label: "Expired", value: "expired" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Suspended", value: "suspended" },
          ]}
        />

        <SelectField
          label="Billing Cycle"
          name="billingCycle"
          value={values.billingCycle}
          onChange={(value) => onChange("billingCycle", value)}
          options={[
            { label: "Monthly", value: "monthly" },
            { label: "Quarterly (10% discount)", value: "quarterly" },
            { label: "Yearly (20% discount)", value: "yearly" },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormInput
          label="Start Date"
          name="startDate"
          type="date"
          value={values.startDate}
          onChange={(value) => onChange("startDate", value)}
        />

        <FormInput
          label="Next Renewal"
          name="nextRenewalDate"
          type="date"
          value={values.nextRenewalDate}
          onChange={(value) => onChange("nextRenewalDate", value)}
        />

        <FormInput
          label="Expiry Date"
          name="expiryDate"
          type="date"
          value={values.expiryDate}
          onChange={(value) => onChange("expiryDate", value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
