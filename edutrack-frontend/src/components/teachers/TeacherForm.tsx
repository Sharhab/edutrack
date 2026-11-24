
"use client";

import FormInput from "../../components/ui/FormInput";
import type { TeacherFormValues } from "../../types/teacher";
import type { ClassOption } from "../../types/options";

type Props = {
  values: TeacherFormValues;
  classes: ClassOption[];
  onChange: (field: keyof TeacherFormValues, value: any) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

type SelectOption = {
  value: string;
  label: string;
};

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        id={name}
        name={name}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="input w-full"
      >
        <option value="">Select {label.toLowerCase()}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div>
        <h3 className="font-semibold text-white">{title}</h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

export default function TeacherForm({
  values,
  classes = [],
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save Teacher",
}: Props) {
  function toggleClass(classId: string) {
    const current = values.classIds || [];

    const updated = current.includes(classId)
      ? current.filter((id) => id !== classId)
      : [...current, classId];

    onChange("classIds", updated);
  }

  const field = (
    label: string,
    name: keyof TeacherFormValues,
    type = "text"
  ) => (
    <FormInput
      label={label}
      name={String(name)}
      type={type}
      value={String(values[name] ?? "")}
      onChange={(value) => onChange(name, value)}
    />
  );

  return (
    <div className="space-y-5">

      {/* 1. PERSONAL INFORMATION */}

      <Section
        title="Personal Information"
        description="Basic identification and personal details of the teacher."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("First Name *", "firstName")}
          {field("Middle Name", "middleName")}
          {field("Last Name *", "lastName")}
          {field("Date of Birth", "dateOfBirth", "date")}

          <SelectField
            label="Gender"
            name="gender"
            value={values.gender || "male"}
            onChange={(value) => onChange("gender", value)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />

          <SelectField
            label="Marital Status"
            name="maritalStatus"
            value={values.maritalStatus || ""}
            onChange={(value) => onChange("maritalStatus", value)}
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "divorced", label: "Divorced" },
              { value: "widowed", label: "Widowed" },
            ]}
          />
        </div>
      </Section>

      {/* 2. CONTACT INFORMATION */}

      <Section
        title="Contact Information"
        description="Contact details used for school communication."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Email Address", "email", "email")}
          {field("Phone Number", "phone", "tel")}
        </div>

        {field("Residential Address", "address")}
      </Section>

      {/* 3. LOCATION */}

      <Section
        title="Origin and Nationality"
        description="Teacher's state of origin and residential background."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("State of Origin", "stateOfOrigin")}
          {field("Local Government Area", "lga")}
          {field("Nationality", "nationality")}
        </div>
      </Section>

      {/* 4. EMPLOYMENT */}

      <Section
        title="Employment Information"
        description="Official staff information and employment details."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Employee ID", "employeeId")}
          {field("Designation", "designation")}
          {field("Qualification", "qualification")}

          <SelectField
            label="Staff Category"
            name="staffCategory"
            value={values.staffCategory || ""}
            onChange={(value) => onChange("staffCategory", value)}
            options={[
              { value: "teaching", label: "Teaching Staff" },
              { value: "non_teaching", label: "Non-Teaching Staff" },
              { value: "administrative", label: "Administrative Staff" },
              { value: "support", label: "Support Staff" },
            ]}
          />

          {field("Employment Date", "employmentDate", "date")}

          <SelectField
            label="Employment Type"
            name="employmentType"
            value={values.employmentType || "full_time"}
            onChange={(value) => onChange("employmentType", value)}
            options={[
              { value: "full_time", label: "Full Time" },
              { value: "part_time", label: "Part Time" },
              { value: "contract", label: "Contract" },
              { value: "visiting", label: "Visiting" },
            ]}
          />
        </div>
      </Section>

      {/* 5. CLASS ASSIGNMENT */}

      <Section
        title="Class Assignment"
        description="Select the classes this teacher is permitted to work with. Subject-specific assignments are managed separately."
      >
        {classes.length === 0 ? (
          <p className="text-sm text-amber-400">
            No classes available. Create school classes first.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {classes.map((schoolClass) => {
              const selected = (values.classIds || []).includes(
                schoolClass._id
              );

              return (
                <label
                  key={schoolClass._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                    selected
                      ? "border-purple-400 bg-purple-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleClass(schoolClass._id)}
                    className="h-4 w-4 accent-purple-500"
                  />

                  <span className="text-sm text-slate-200">
                    {schoolClass.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <p className="text-xs text-purple-300">
          {values.classIds?.length || 0} class(es) selected
        </p>
      </Section>

      {/* 6. EMERGENCY CONTACT */}

      <Section
        title="Emergency Contact"
        description="Person the school can contact in an emergency."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Emergency Contact Name", "emergencyName")}
          {field("Emergency Contact Phone", "emergencyPhone", "tel")}
        </div>
      </Section>

      {/* 7. OPTIONAL HEALTH INFORMATION */}

      <Section
        title="Additional Medical Information"
        description="Optional staff records. These details should only be accessible to authorized school administrators."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Blood Group"
            name="bloodGroup"
            value={values.bloodGroup || ""}
            onChange={(value) => onChange("bloodGroup", value)}
            options={[
              { value: "A+", label: "A+" },
              { value: "A-", label: "A-" },
              { value: "B+", label: "B+" },
              { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" },
              { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" },
              { value: "O-", label: "O-" },
            ]}
          />

          <SelectField
            label="Genotype"
            name="genotype"
            value={values.genotype || ""}
            onChange={(value) => onChange("genotype", value)}
            options={[
              { value: "AA", label: "AA" },
              { value: "AS", label: "AS" },
              { value: "SS", label: "SS" },
              { value: "AC", label: "AC" },
              { value: "SC", label: "SC" },
            ]}
          />
        </div>
      </Section>

      {/* 8. IDENTIFICATION */}

      <Section
        title="Identification"
        description="Optional national identification information."
      >
        {field("National Identification Number (NIN)", "nin")}
      </Section>

      {/* 9. ACCOUNT SETTINGS */}

      <Section
        title="Teacher Account"
        description="Login credentials and account access."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          
          
<div className="space-y-4">
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
    <p className="font-semibold text-blue-900">
      Automatic Login Credentials
    </p>
    <p className="mt-1 text-sm text-blue-800">
      EduTrack will automatically generate a secure temporary password
      when this teacher account is created. You can copy or print the
      credentials after saving.
    </p>
  </div>

  {/* Keep your existing account status field here */}
</div>

          <SelectField
            label="Account Status"
            name="status"
            value={values.isActive ? "active" : "inactive"}
            onChange={(value) => {
              const active = value === "active";
              onChange("isActive", active);
              onChange("status", active ? "active" : "inactive");
            }}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        <p className="text-xs text-slate-400">
          When editing an existing teacher, leave the password blank
          to retain the current password. Use Reset Password to change
          it separately.
        </p>
      </Section>

      {/* SUBMIT */}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || classes.length === 0}
        className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Saving Teacher..." : submitLabel}
      </button>
    </div>
  );
}
