"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { StudentFormValues } from "../../types/student";
import { ClassOption, ParentOption } from "../../types/options";

type StudentFormProps = {
  values: StudentFormValues;
  classes: ClassOption[];
  parents: ParentOption[];
  loadingOptions?: boolean;
  onChange: (field: keyof StudentFormValues, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function StudentForm({
  values,
  classes,
  parents,
  loadingOptions = false,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save Student",
}: StudentFormProps) {
  const classOptions = loadingOptions
    ? [{ label: "Loading classes...", value: "" }]
    : (classes || []).length
      ? [
          { label: "Select Class", value: "" },
          ...(classes || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]
      : [{ label: "No classes yet", value: "" }];

  const parentOptions = loadingOptions
    ? [{ label: "Loading parents...", value: "" }]
    : (parents || []).length
      ? [
          { label: "Select Parent", value: "" },
          ...(parents || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]
      : [{ label: "No parents yet", value: "" }];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="First Name"
          name="firstName"
          value={values.firstName}
          onChange={(value) => onChange("firstName", value)}
        />
        <FormInput
          label="Last Name"
          name="lastName"
          value={values.lastName}
          onChange={(value) => onChange("lastName", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Admission Number"
          name="admissionNumber"
          value={values.admissionNumber}
          onChange={(value) => onChange("admissionNumber", value)}
        />
        <SelectField
          label="Gender"
          name="gender"
          value={values.gender}
          onChange={(value) => onChange("gender", value as "male" | "female")}
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={values.dateOfBirth}
          onChange={(value) => onChange("dateOfBirth", value)}
        />
        <div>
          <SelectField
            label="Class"
            name="classId"
            value={values.classId}
            onChange={(value) => onChange("classId", value)}
            options={classOptions}
          />
          {!loadingOptions && !(classes || []).length ? (
            <p className="mt-1 text-xs text-amber-300">
              No classes found yet. Create a class first, then assign it here.
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <SelectField
          label="Parent"
          name="parentId"
          value={values.parentId}
          onChange={(value) => onChange("parentId", value)}
          options={parentOptions}
        />
        {!loadingOptions && !(parents || []).length ? (
          <p className="mt-1 text-xs text-slate-400">
            Parent can be linked later.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(value) => onChange("email", value)}
        />
        <FormInput
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={(value) => onChange("phone", value)}
        />
      </div>

      <FormInput
        label="Address"
        name="address"
        value={values.address}
        onChange={(value) => onChange("address", value)}
      />

      <SelectField
        label="Status"
        name="isActive"
        value={values.isActive}
        onChange={(value) => onChange("isActive", value)}
        options={[
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" },
        ]}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}