"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { Tenant, TenantControlPayload } from "../../types/tenant";

type TenantControlFormProps = {
  tenant: Tenant;
  values: TenantControlPayload;
  onChange: (field: keyof TenantControlPayload, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export default function TenantControlForm({
  tenant,
  values,
  onChange,
  onSubmit,
  submitting = false,
}: TenantControlFormProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-300">
          Update tenant access controls for{" "}
          <span className="font-semibold text-white">{tenant.schoolName}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Tenant Status"
          name="status"
          value={values.status || tenant.status}
          onChange={(value) => onChange("status", value)}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />

        <SelectField
          label="Subscription Status"
          name="subscriptionStatus"
          value={values.subscriptionStatus || tenant.subscriptionStatus || "active"}
          onChange={(value) => onChange("subscriptionStatus", value)}
          options={[
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Expired", value: "expired" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
      </div>

      <FormInput
        label="Expiry Date"
        name="expiryDate"
        type="date"
        value={
          values.expiryDate ||
          (tenant.expiryDate
            ? new Date(tenant.expiryDate).toISOString().slice(0, 10)
            : "")
        }
        onChange={(value) => onChange("expiryDate", value)}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? "Updating..." : "Apply Control Changes"}
      </button>
    </div>
  );
}