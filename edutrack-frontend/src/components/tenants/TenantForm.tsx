"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { TenantFormValues } from "../../types/tenant";

type TenantFormProps = {
  values: TenantFormValues;
  onChange: (field: keyof TenantFormValues, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function TenantForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save Tenant",
}: TenantFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="School Name"
          name="name"
          value={values.name}
          placeholder="Globstand International School"
          onChange={(value) => onChange("name", value)}
        />

        <FormInput
          label="School Email"
          name="email"
          type="email"
          value={values.email}
          placeholder="school@example.com"
          onChange={(value) => onChange("email", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Phone"
          name="phone"
          value={values.phone}
          placeholder="080..."
          onChange={(value) => onChange("phone", value)}
        />

        <FormInput
          label="Address"
          name="address"
          value={values.address}
          placeholder="School address"
          onChange={(value) => onChange("address", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Admin First Name"
          name="adminFirstName"
          value={values.adminFirstName}
          placeholder="Super"
          onChange={(value) => onChange("adminFirstName", value)}
        />

        <FormInput
          label="Admin Last Name"
          name="adminLastName"
          value={values.adminLastName}
          placeholder="Admin"
          onChange={(value) => onChange("adminLastName", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Admin Email"
          name="adminEmail"
          type="email"
          value={values.adminEmail}
          placeholder="admin@school.com"
          onChange={(value) => onChange("adminEmail", value)}
        />

        <FormInput
          label="Admin Password"
          name="adminPassword"
          type="password"
          value={values.adminPassword}
          placeholder="Enter admin password"
          onChange={(value) => onChange("adminPassword", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Plan"
          name="plan"
          value={values.plan}
          onChange={(value) => onChange("plan", value)}
          options={[
            { label: "Starter", value: "starter" },
            { label: "Standard", value: "standard" },
            { label: "Premium", value: "premium" },
          ]}
        />

        <SelectField
          label="Status"
          name="status"
          value={values.status}
          onChange={(value) => onChange("status", value)}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Expiry Date"
          name="expiryDate"
          type="date"
          value={values.expiryDate}
          onChange={(value) => onChange("expiryDate", value)}
        />

        <FormInput
          label="Slug (optional)"
          name="slug"
          value={values.slug || ""}
          placeholder="globstand-school"
          onChange={(value) => onChange("slug", value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}