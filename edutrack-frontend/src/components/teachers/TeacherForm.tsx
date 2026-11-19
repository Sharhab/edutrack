
"use client";

import FormInput from "../../components/ui/FormInput";
import { TeacherFormValues } from "../../types/teacher";
import { ClassOption } from "../../types/options";

type Props = {
  values: TeacherFormValues;
  classes: ClassOption[];
  onChange: (field: keyof TeacherFormValues, value: any) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function TeacherForm({
  values,
  classes = [],
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
}: Props) {
  function toggleClass(classId: string) {
    const current = values.classIds || [];
    const updated = current.includes(classId)
      ? current.filter((id) => id !== classId)
      : [...current, classId];

    onChange("classIds", updated);
  }

  return (
    <div className="space-y-6">
      {/* NAME */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="First Name"
          name="firstName"
          value={values.firstName}
          onChange={(v) => onChange("firstName", v)}
        />

        <FormInput
          label="Middle Name"
          name="middleName"
          value={values.middleName || ""}
          onChange={(v) => onChange("middleName", v)}
        />

        <FormInput
          label="Last Name"
          name="lastName"
          value={values.lastName}
          onChange={(v) => onChange("lastName", v)}
        />
      </div>

      {/* CONTACT */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Email"
          name="email"
          value={values.email}
          onChange={(v) => onChange("email", v)}
        />

        <FormInput
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={values.dateOfBirth || ""}
          onChange={(v) => onChange("dateOfBirth", v)}
        />

        <FormInput
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={(v) => onChange("phone", v)}
        />
      </div>

      {/* EMPLOYMENT */}
      <FormInput
        label="Employee ID"
        name="employeeId"
        value={values.employeeId}
        onChange={(v) => onChange("employeeId", v)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Qualification"
          name="qualification"
          value={values.qualification || ""}
          onChange={(v) => onChange("qualification", v)}
        />

        <FormInput
          label="Designation"
          name="designation"
          value={values.designation || ""}
          onChange={(v) => onChange("designation", v)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Employment Date"
          type="date"
          name="employmentDate"
          value={values.employmentDate || ""}
          onChange={(v) => onChange("employmentDate", v)}
        />

        <label className="block space-y-1">
          <span className="text-sm text-slate-300">Employment Type</span>
          <select
            className="input w-full"
            value={values.employmentType || "full_time"}
            onChange={(e) => onChange("employmentType", e.target.value)}
          >
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="visiting">Visiting</option>
          </select>
        </label>
      </div>

      {/* CLASS ASSIGNMENT */}
      <section className="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4">
        <div>
          <h3 className="font-semibold text-white">Class Assignment</h3>
          <p className="mt-1 text-xs text-slate-400">
            Select every class this teacher is responsible for. The teacher
            will automatically access all active subjects assigned to these
            classes.
          </p>
        </div>

        {classes.length === 0 ? (
          <p className="text-sm text-amber-400">
            No classes available. Create classes before assigning this teacher.
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
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    selected
                      ? "border-purple-400 bg-purple-500/10"
                      : "border-white/10 bg-white/[0.02]"
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
          {values.classIds?.length || 0} class(es) assigned
        </p>
      </section>

      {/* GENDER AND STATUS */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm text-slate-300">Gender</span>
          <select
            value={values.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className="input w-full"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-300">Account Status</span>
          <select
            value={values.isActive ? "true" : "false"}
            onChange={(e) =>
              onChange("isActive", e.target.value === "true")
            }
            className="input w-full"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>

      {/* PASSWORD */}
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={(v) => onChange("password", v)}
      />

      {/* ADDRESS */}
      <FormInput
        label="Address"
        name="address"
        value={values.address}
        onChange={(v) => onChange("address", v)}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || classes.length === 0}
        className="btn-primary w-full disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
