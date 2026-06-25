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
        ...classes.map((item) => ({
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
        ...parents.map((item) => ({
          label: item.name,
          value: item._id,
        })),
      ]
    : [{ label: "No parents yet", value: "" }];

  // ✅ FULL SAFE NORMALIZATION (IMPORTANT FIX)
  const safeValues = {
    ...values,

    middleName: values.middleName ?? "",
    entryType: values.entryType ?? "",
    previousSchool: values.previousSchool ?? "",
    stateOfOrigin: values.stateOfOrigin ?? "",
    lga: values.lga ?? "",

    parentId: values.parentId ?? "",
    emergencyName: values.emergencyName ?? "",
    emergencyPhone: values.emergencyPhone ?? "",

    bloodGroup: values.bloodGroup ?? "",
    genotype: values.genotype ?? "",

    email: values.email ?? "",
    phone: values.phone ?? "",
    address: values.address ?? "",

    dateOfBirth: values.dateOfBirth ?? "",
    classId: values.classId ?? "",
  };

  return (
    <div className="space-y-4">

      {/* ================= PERSONAL INFO ================= */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormInput
          label="First Name"
          name="firstName"
          value={values.firstName}
          onChange={(value) => onChange("firstName", value)}
        />

        <FormInput
          label="Middle Name"
          name="middleName"
          value={safeValues.middleName}
          onChange={(value) => onChange("middleName", value)}
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
          onChange={(value) =>
            onChange("gender", value as "male" | "female")
          }
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
          value={safeValues.dateOfBirth}
          onChange={(value) => onChange("dateOfBirth", value)}
        />

        <SelectField
          label="Class"
          name="classId"
          value={safeValues.classId}
          onChange={(value) => onChange("classId", value)}
          options={classOptions}
        />
      </div>

      {/* ================= ACADEMIC INFO ================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Entry Type"
          name="entryType"
          value={safeValues.entryType}
          onChange={(value) => onChange("entryType", value)}
          options={[
            { label: "New Admission", value: "new" },
            { label: "Transfer", value: "transfer" },
            { label: "Promotion", value: "promotion" },
            { label: "Re-entry", value: "reentry" },
          ]}
        />

        <FormInput
          label="Previous School"
          name="previousSchool"
          value={safeValues.previousSchool}
          onChange={(value) => onChange("previousSchool", value)}
        />
      </div>

      {/* ================= LOCATION ================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="State of Origin"
          name="stateOfOrigin"
          value={safeValues.stateOfOrigin}
          onChange={(value) => onChange("stateOfOrigin", value)}
        />

        <FormInput
          label="Local Government Area"
          name="lga"
          value={safeValues.lga}
          onChange={(value) => onChange("lga", value)}
        />
      </div>

      {/* ================= PARENT ================= */}
      <SelectField
        label="Parent"
        name="parentId"
        value={safeValues.parentId}
        onChange={(value) => onChange("parentId", value)}
        options={parentOptions}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Emergency Contact Name"
          name="emergencyName"
          value={safeValues.emergencyName}
          onChange={(value) => onChange("emergencyName", value)}
        />

        <FormInput
          label="Emergency Contact Phone"
          name="emergencyPhone"
          value={safeValues.emergencyPhone}
          onChange={(value) => onChange("emergencyPhone", value)}
        />
      </div>

      {/* ================= CONTACT ================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={safeValues.email}
          onChange={(value) => onChange("email", value)}
        />

        <FormInput
          label="Phone"
          name="phone"
          value={safeValues.phone}
          onChange={(value) => onChange("phone", value)}
        />
      </div>

      <FormInput
        label="Address"
        name="address"
        value={safeValues.address}
        onChange={(value) => onChange("address", value)}
      />

      {/* ================= HEALTH ================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Blood Group"
          name="bloodGroup"
          value={safeValues.bloodGroup}
          onChange={(value) => onChange("bloodGroup", value)}
          options={[
            { label: "A+", value: "A+" },
            { label: "A-", value: "A-" },
            { label: "B+", value: "B+" },
            { label: "O+", value: "O+" },
            { label: "AB+", value: "AB+" },
          ]}
        />

        <SelectField
          label="Genotype"
          name="genotype"
          value={safeValues.genotype}
          onChange={(value) => onChange("genotype", value)}
          options={[
            { label: "AA", value: "AA" },
            { label: "AS", value: "AS" },
            { label: "SS", value: "SS" },
            { label: "AC", value: "AC" },
          ]}
        />
      </div>

      {/* ================= STATUS ================= */}
      <SelectField
        label="Status"
        name="status"
        value={values.status}
        onChange={(value) => onChange("status", value)}
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "Suspended", value: "suspended" },
          { label: "Graduated", value: "graduated" },
        ]}
      />

      {/* ================= SUBMIT ================= */}
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