"use client";

import FormInput from "../../components/ui/FormInput";
import { TeacherFormValues } from "../../types/teacher";
import { ClassOption, SubjectOption } from "../../types/options";

type Props = {
  values: TeacherFormValues;
  classes: ClassOption[];
  subjects: SubjectOption[];
  onChange: (field: keyof TeacherFormValues, value: any) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function TeacherForm({
  values,
  classes = [],
  subjects = [],
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
}: Props) {
  return (
    <div className="space-y-6">

      {/* ================= NAME ================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="First Name"
          name="firstName"
          value={values.firstName}
          onChange={(v) => onChange("firstName", v)}
        />
         
         <div className="grid gap-4 md:grid-cols-2">
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

      {/* ================= CONTACT ================= */}
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
</div>

        <FormInput
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={(v) => onChange("phone", v)}
        />
      </div>

      {/* ================= EMPLOYEE ID ================= */}
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

  <select
    className="input"
    value={values.employmentType || "full_time"}
    onChange={(e) =>
      onChange("employmentType", e.target.value)
    }
  >
    <option value="full_time">Full Time</option>
    <option value="part_time">Part Time</option>
    <option value="contract">Contract</option>
    <option value="visiting">Visiting</option>
  </select>
</div>
      {/* ================= SUBJECTS ================= */}
      <div>
        <label className="text-sm text-slate-300 mb-2 block">
          Assign Subjects
        </label>

        <select
          multiple
          value={values.subjectIds || []}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (opt) => opt.value
            );
            onChange("subjectIds", selected);
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {subjects.length === 0 && (
            <option disabled>No subjects available</option>
          )}

          {subjects.map((sub) => {
            const isSelected = values.subjectIds?.includes(sub._id);

            return (
              <option
                key={sub._id}
                value={sub._id}
                className={`text-black ${
                  isSelected ? "font-bold" : ""
                }`}
              >
                {sub.name}
              </option>
            );
          })}
        </select>

        {values.subjectIds?.length > 0 && (
          <p className="text-xs text-green-400 mt-1">
            {values.subjectIds.length} subject(s) selected
          </p>
        )}
      </div>

      {/* ================= CLASSES ================= */}
      <div>
        <label className="text-sm text-slate-300 mb-2 block">
          Assign Classes
        </label>

        <select
          multiple
          value={values.classIds || []}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (opt) => opt.value
            );
            onChange("classIds", selected);
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {classes.length === 0 && (
            <option disabled>No classes available</option>
          )}

          {classes.map((cls) => {
            const isSelected = values.classIds?.includes(cls._id);

            return (
              <option
                key={cls._id}
                value={cls._id}
                className={`text-black ${
                  isSelected ? "font-bold" : ""
                }`}
              >
                {cls.name}
              </option>
            );
          })}
        </select>

        {values.classIds?.length > 0 && (
          <p className="text-xs text-green-400 mt-1">
            {values.classIds.length} class(es) selected
          </p>
        )}
      </div>

      {/* ================= GENDER + STATUS ================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={values.gender}
          onChange={(e) => onChange("gender", e.target.value)}
          className="input"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select
  value={values.isActive ? "true" : "false"}
  onChange={(e) =>
    onChange(
      "isActive",
      e.target.value === "true"
    )
  }
  className="input"
>
  <option value="true">Active</option>
  <option value="false">Inactive</option>
</select>
      </div>

      {/* ================= PASSWORD ================= */}
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={(v) => onChange("password", v)}
      />

      {/* ================= ADDRESS ================= */}
      <FormInput
        label="Address"
        name="address"
        value={values.address}
        onChange={(v) => onChange("address", v)}
      />

      {/* ================= SUBMIT ================= */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary w-full"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}