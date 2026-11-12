

"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  ClipboardPaste,
  RefreshCw,
  UserRound,
  BookOpen,
  GraduationCap,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../../../../../lib/axios";
import {
  getClassOptions,
  getSubjectOptions,
} from "../../../../../lib/options";

/* =====================================================
   TYPES
===================================================== */

type Row = {
  firstName: string;
  middleName: string;
  lastName: string;

  email: string;
  phone: string;
  employeeId: string;

  qualification: string;
  designation: string;

  subjectIds: string[];
  classIds: string[];

  gender: "male" | "female";

  address: string;
  dateOfBirth: string;
  maritalStatus: string;

  stateOfOrigin: string;
  lga: string;
  nationality: string;

  employmentDate: string;
  employmentType: string;

  emergencyName: string;
  emergencyPhone: string;

  bloodGroup: string;
  genotype: string;
  nin: string;

  isActive: boolean;
  status: "active" | "inactive";

  password: string;
};

type ClassOption = {
  _id: string;
  name: string;
};

type SubjectOption = {
  _id: string;
  name: string;
};

type BulkResult = {
  total?: number;
  created?: number;
  updated?: number;
  failed?: number;
  results?: Array<{
    row: number;
    email?: string;
    employeeId?: string;
    action: "created" | "updated" | "failed";
    error?: string;
  }>;
};

/* =====================================================
   HELPERS
===================================================== */

function createEmptyRow(): Row {
  return {
    firstName: "",
    middleName: "",
    lastName: "",

    email: "",
    phone: "",
    employeeId: "",

    qualification: "",
    designation: "",

    subjectIds: [],
    classIds: [],

    gender: "male",

    address: "",
    dateOfBirth: "",
    maritalStatus: "",

    stateOfOrigin: "",
    lga: "",
    nationality: "Nigerian",

    employmentDate: "",
    employmentType: "full_time",

    emergencyName: "",
    emergencyPhone: "",

    bloodGroup: "",
    genotype: "",
    nin: "",

    isActive: true,
    status: "active",

    password: "",
  };
}

function isFilled(row: Row) {
  return Boolean(
    row.firstName.trim() ||
    row.middleName.trim() ||
    row.lastName.trim() ||
    row.email.trim() ||
    row.phone.trim()
  );
}

/* =====================================================
   REUSABLE INPUT
===================================================== */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || label}
        className="input min-h-[42px] w-full min-w-0"
      />
    </label>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   MAIN PAGE
===================================================== */

export default function TeacherBulkEntryPage() {
  const [rows, setRows] = useState<Row[]>([createEmptyRow()]);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [pasteText, setPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [error, setError] = useState("");
  const [saveResult, setSaveResult] = useState<BulkResult | null>(null);

  /* =====================================================
     LOAD OPTIONS
  ===================================================== */

  async function loadOptions() {
    try {
      setFetching(true);
      setError("");

      const [classRes, subjectRes] = await Promise.all([
        getClassOptions(),
        getSubjectOptions(),
      ]);

      setClasses(classRes || []);
      setSubjects(subjectRes || []);
    } catch (err: any) {
      console.error("Teacher options error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load school classes and subjects."
      );
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  /* =====================================================
     ROW ACTIONS
  ===================================================== */

  function addRow() {
    setRows((previous) => [...previous, createEmptyRow()]);
    setError("");
    setSaveResult(null);
  }

  function removeRow(index: number) {
    setRows((previous) => {
      if (previous.length === 1) {
        return [createEmptyRow()];
      }

      return previous.filter((_, i) => i !== index);
    });

    setError("");
    setSaveResult(null);
  }

  function updateRow<K extends keyof Row>(
    index: number,
    field: K,
    value: Row[K]
  ) {
    setRows((previous) =>
      previous.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );

    setSaveResult(null);
  }

  function toggleMultiSelect(
    index: number,
    field: "classIds" | "subjectIds",
    value: string
  ) {
    setRows((previous) =>
      previous.map((row, i) => {
        if (i !== index) return row;

        const selected = row[field].includes(value);

        return {
          ...row,
          [field]: selected
            ? row[field].filter((id) => id !== value)
            : [...row[field], value],
        };
      })
    );

    setSaveResult(null);
  }

  /* =====================================================
     PASTE IMPORT

     First | Middle | Last | Email (Optional) | Phone |
     Qualification | Designation | Gender | DOB | State
  ===================================================== */

function importPastedTeachers() {
  setError("");
  setPasteMessage("");
  setSaveResult(null);

  if (!pasteText.trim()) {
    setError("Paste teacher records first.");
    return;
  }

  const lines = pasteText
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    setError("No teacher records found.");
    return;
  }

  const firstLine = lines[0].toLowerCase();

  const hasHeader =
    firstLine.includes("first") &&
    (firstLine.includes("last") || firstLine.includes("email"));

  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (!dataLines.length) {
    setError("The pasted content contains only a header.");
    return;
  }

  const importedRows: Row[] = [];

  for (let index = 0; index < dataLines.length; index++) {
    const columns = dataLines[index]
      .split("\t")
      .map((column) => column.trim());

    // Find the actual gender column instead of assuming its position.
    const genderIndex = columns.findIndex(
      (column) => ["male", "female"].includes(column.toLowerCase())
    );

    if (genderIndex === -1) {
      setError(
        `Row ${index + 1}: Gender must be Male or Female. Check your pasted columns.`
      );
      return;
    }

    if (genderIndex < 6) {
      setError(
        `Row ${index + 1}: The teacher data does not contain enough columns.`
      );
      return;
    }

    const hasEmailColumn = genderIndex >= 7;

    const email = hasEmailColumn
      ? columns[3] || ""
      : "";

    const phoneIndex = hasEmailColumn ? 4 : 3;
    const qualificationIndex = hasEmailColumn ? 5 : 4;
    const designationIndex = hasEmailColumn ? 6 : 5;

    const dateOfBirth = columns[genderIndex + 1] || "";
    const stateOfOrigin = columns[genderIndex + 2] || "";

    if (
      dateOfBirth &&
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
    ) {
      setError(
        `Row ${index + 1}: Invalid date of birth "${dateOfBirth}". Use YYYY-MM-DD or leave it blank.`
      );
      return;
    }

    importedRows.push({
      ...createEmptyRow(),

      firstName: columns[0] || "",
      middleName: columns[1] || "",
      lastName: columns[2] || "",

      email,
      phone: columns[phoneIndex] || "",

      qualification: columns[qualificationIndex] || "",
      designation: columns[designationIndex] || "",

      gender:
        columns[genderIndex].toLowerCase() === "female"
          ? "female"
          : "male",

      dateOfBirth,
      stateOfOrigin,
    });
  }

  const invalidRows = importedRows
    .map((row, index) => ({ row, number: index + 1 }))
    .filter(
      ({ row }) =>
        row.firstName.length < 2 ||
        row.lastName.length < 2
    );

  if (invalidRows.length) {
    setError(
      `Rows ${invalidRows.map((item) => item.number).join(", ")}: First name and last name are required.`
    );
    return;
  }

  const emails = importedRows
    .map((row) => row.email.trim().toLowerCase())
    .filter(Boolean);

  if (new Set(emails).size !== emails.length) {
    setError("Duplicate email addresses found in the pasted records.");
    return;
  }

  setRows((previous) => [
    ...previous.filter(isFilled),
    ...importedRows,
  ]);

  setPasteMessage(
    `${importedRows.length} teacher(s) imported. Assign subjects, classes and passwords below.`
  );

  setPasteText("");
}

  
  /* =====================================================
     VALIDATION
  ===================================================== */

  function validate() {
    const filledRows = rows.filter(isFilled);

    if (!filledRows.length) {
      return "Add or paste at least one teacher.";
    }

    if (!classes.length) {
      return "No classes are available. Create school classes first.";
    }

    if (!subjects.length) {
      return "No subjects are available. Create school subjects first.";
    }

    for (let index = 0; index < filledRows.length; index++) {
      const row = filledRows[index];
      const rowNumber = index + 1;

      if (row.firstName.trim().length < 2) {
        return `Row ${rowNumber}: First name must contain at least 2 characters.`;
      }

      if (row.lastName.trim().length < 2) {
        return `Row ${rowNumber}: Last name must contain at least 2 characters.`;
      }

      const email = row.email.trim();

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return `Row ${rowNumber}: Enter a valid email or leave it blank.`;
      }

      if (!row.password.trim()) {
        return `Row ${rowNumber}: Password is required.`;
      }

      if (row.password.length < 6) {
        return `Row ${rowNumber}: Password must contain at least 6 characters.`;
      }

      if (!row.subjectIds.length) {
        return `Row ${rowNumber}: Select at least one subject.`;
      }

      if (!row.classIds.length) {
        return `Row ${rowNumber}: Select at least one class.`;
      }
    }

    const emails = filledRows
      .map((row) => row.email.trim().toLowerCase())
      .filter(Boolean);

    if (new Set(emails).size !== emails.length) {
      return "Duplicate email addresses found. Each supplied email must be unique.";
    }

    return "";
  }

  /* =====================================================
     PAYLOAD
  ===================================================== */

  function cleanRow(row: Row) {
    const email = row.email.trim().toLowerCase();

    return {
      firstName: row.firstName.trim(),
      middleName: row.middleName.trim(),
      lastName: row.lastName.trim(),

      ...(email ? { email } : {}),

      phone: row.phone.trim(),

      // Employee ID is generated by the backend.
      qualification: row.qualification.trim(),
      designation: row.designation.trim(),

      subjectIds: row.subjectIds,
      classIds: row.classIds,

      gender: row.gender,

      address: row.address.trim(),
      dateOfBirth: row.dateOfBirth || null,
      maritalStatus: row.maritalStatus,

      stateOfOrigin: row.stateOfOrigin.trim(),
      lga: row.lga.trim(),
      nationality: row.nationality,

      employmentDate: row.employmentDate || null,
      employmentType: row.employmentType,

      emergencyName: row.emergencyName.trim(),
      emergencyPhone: row.emergencyPhone.trim(),

      bloodGroup: row.bloodGroup,
      genotype: row.genotype,
      nin: row.nin.trim(),

      isActive: row.status === "active",
      status: row.status,

      password: row.password,
    };
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function handleSave() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      setSaveResult(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSaveResult(null);

      const validRows = rows.filter(isFilled);

      const response = await api.post("/teachers/bulk", {
        rows: validRows.map(cleanRow),
      });

      const result: BulkResult = response.data?.data || {};

      setSaveResult(result);

      const failed = result.failed || 0;

      if (failed === 0) {
        setRows([createEmptyRow()]);
        setPasteMessage("");
      }

    } catch (err: any) {
      console.error("Bulk teacher save failed:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save teachers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (fetching) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
        Loading school classes and subjects...
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  const filledCount = rows.filter(isFilled).length;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10 text-white">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <GraduationCap size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Bulk Teacher Entry
              </h1>

              <p className="text-xs text-slate-400 sm:text-sm">
                Import teacher records and create their school accounts.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadOptions}
          disabled={fetching}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh Classes & Subjects
        </button>
      </div>

      {/* QUICK SUMMARY */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-400">Teacher rows</p>
          <p className="mt-1 text-2xl font-bold">{rows.length}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-400">Ready for entry</p>
          <p className="mt-1 text-2xl font-bold text-cyan-400">
            {filledCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-400">School classes</p>
          <p className="mt-1 text-2xl font-bold">{classes.length}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-400">School subjects</p>
          <p className="mt-1 text-2xl font-bold">{subjects.length}</p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* RESULT */}

      {saveResult && (
        <section className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={20} />

            <h2 className="font-semibold text-emerald-300">
              Teacher processing result
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: saveResult.total || 0 },
              { label: "Created", value: saveResult.created || 0 },
              { label: "Updated", value: saveResult.updated || 0 },
              { label: "Failed", value: saveResult.failed || 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-slate-950/40 p-3"
              >
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {saveResult.results?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Generated Employee IDs and results
              </h3>

              {saveResult.results.map((item, index) => (
                <div
                  key={`${item.row}-${index}`}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="text-slate-400">
                      Row {item.row}
                    </span>

                    {item.email && (
                      <span className="ml-2 text-slate-300">
                        {item.email}
                      </span>
                    )}

                    {item.employeeId && (
                      <span className="ml-2 font-semibold text-cyan-300">
                        {item.employeeId}
                      </span>
                    )}
                  </div>

                  <span
                    className={
                      item.action === "failed"
                        ? "text-red-400"
                        : "text-emerald-400"
                    }
                  >
                    {item.action.toUpperCase()}
                    {item.error ? ` — ${item.error}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* PASTE IMPORT */}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <SectionTitle
          icon={<ClipboardPaste size={19} />}
          title="Import from Excel or Google Sheets"
          description="Copy multiple teacher rows and paste them here."
        />

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
          <p className="text-xs font-semibold text-cyan-300">
            Spreadsheet column order
          </p>

          <p className="mt-2 break-words text-xs leading-6 text-slate-300">
            First Name | Middle Name | Last Name | Email (Optional) |
            Phone | Qualification | Designation | Gender | Date of Birth |
            State of Origin
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Do not include Employee ID. EduTrack generates it.
            Subjects, classes and passwords are assigned below.
          </p>
        </div>

        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          rows={6}
          placeholder={`First Name\tMiddle Name\tLast Name\tEmail\tPhone\tQualification\tDesignation\tGender\tDOB\tState
Fatima\t\tAbdulqadir\t\t08012345678\tNCE\tClass Teacher 1\tFemale\t\tKatsina`}
          className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={importPastedTeachers}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ClipboardPaste size={16} />
            Import Pasted Rows
          </button>

          <button
            type="button"
            onClick={() => {
              setPasteText("");
              setPasteMessage("");
            }}
            className="text-sm text-slate-400 hover:text-white"
          >
            Clear Paste Box
          </button>
        </div>

        {pasteMessage && (
          <p className="text-sm text-emerald-400">
            {pasteMessage}
          </p>
        )}
      </section>

      {/* TEACHER RECORDS */}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Teacher Records</h2>
            <p className="text-xs text-slate-400">
              Complete the details for each teacher before saving.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Teacher
          </button>
        </div>

        {rows.map((row, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
          >
            {/* CARD HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <UserRound size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Teacher {index + 1}
                    {row.firstName || row.lastName
                      ? ` — ${row.firstName} ${row.lastName}`.trim()
                      : ""}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Employee ID: Generated when saved
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    row.status === "active"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-slate-500/10 text-slate-300"
                  }`}
                >
                  {row.status.toUpperCase()}
                </span>

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                  title="Remove teacher"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-4 sm:p-5">

              {/* PERSONAL INFORMATION */}

              <div className="space-y-3">
                <SectionTitle
                  icon={<UserRound size={18} />}
                  title="Personal and Contact Information"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <Field
                    label="First Name"
                    required
                    value={row.firstName}
                    onChange={(value) =>
                      updateRow(index, "firstName", value)
                    }
                  />

                  <Field
                    label="Middle Name"
                    value={row.middleName}
                    onChange={(value) =>
                      updateRow(index, "middleName", value)
                    }
                  />

                  <Field
                    label="Last Name"
                    required
                    value={row.lastName}
                    onChange={(value) =>
                      updateRow(index, "lastName", value)
                    }
                  />

                  <Field
                    label="Email (Optional)"
                    type="email"
                    value={row.email}
                    onChange={(value) =>
                      updateRow(index, "email", value)
                    }
                    placeholder="teacher@example.com"
                  />

                  <Field
                    label="Phone Number"
                    value={row.phone}
                    onChange={(value) =>
                      updateRow(index, "phone", value)
                    }
                  />

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      Gender
                    </span>

                    <select
                      className="input min-h-[42px] w-full"
                      value={row.gender}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "gender",
                          event.target.value as Row["gender"]
                        )
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </label>

                  <Field
                    label="Date of Birth"
                    type="date"
                    value={row.dateOfBirth}
                    onChange={(value) =>
                      updateRow(index, "dateOfBirth", value)
                    }
                  />

                  <Field
                    label="Address"
                    value={row.address}
                    onChange={(value) =>
                      updateRow(index, "address", value)
                    }
                  />

                  <Field
                    label="State of Origin"
                    value={row.stateOfOrigin}
                    onChange={(value) =>
                      updateRow(index, "stateOfOrigin", value)
                    }
                  />

                  <Field
                    label="LGA"
                    value={row.lga}
                    onChange={(value) =>
                      updateRow(index, "lga", value)
                    }
                  />

                  <Field
                    label="Nationality"
                    value={row.nationality}
                    onChange={(value) =>
                      updateRow(index, "nationality", value)
                    }
                  />

                  <Field
                    label="Marital Status"
                    value={row.maritalStatus}
                    onChange={(value) =>
                      updateRow(index, "maritalStatus", value)
                    }
                  />
                </div>
              </div>

              <div className="border-t border-white/10" />

              {/* EMPLOYMENT */}

              <div className="space-y-3">
                <SectionTitle
                  icon={<GraduationCap size={18} />}
                  title="Employment Information"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      Employee ID
                    </span>

                    <div className="flex min-h-[42px] items-center rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 px-3 text-xs text-cyan-300">
                      Automatically generated
                    </div>
                  </div>

                  <Field
                    label="Qualification"
                    value={row.qualification}
                    onChange={(value) =>
                      updateRow(index, "qualification", value)
                    }
                    placeholder="e.g. B.Ed, NCE"
                  />

                  <Field
                    label="Designation"
                    value={row.designation}
                    onChange={(value) =>
                      updateRow(index, "designation", value)
                    }
                    placeholder="e.g. Class Teacher"
                  />

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      Employment Type
                    </span>

                    <select
                      className="input min-h-[42px] w-full"
                      value={row.employmentType}
                      onChange={(event) =>
                        updateRow(index, "employmentType", event.target.value)
                      }
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="visiting">Visiting</option>
                    </select>
                  </label>

                  <Field
                    label="Employment Date"
                    type="date"
                    value={row.employmentDate}
                    onChange={(value) =>
                      updateRow(index, "employmentDate", value)
                    }
                  />

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      Account Status
                    </span>

                    <select
                      className="input min-h-[42px] w-full"
                      value={row.status}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "status",
                          event.target.value as Row["status"]
                        )
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="border-t border-white/10" />

              {/* SUBJECT ASSIGNMENT */}

              <div className="space-y-3">
                <SectionTitle
                  icon={<BookOpen size={18} />}
                  title="Subject Assignment"
                  description="Select all subjects this teacher will teach."
                />

                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => {
                    const selected = row.subjectIds.includes(subject._id);

                    return (
                      <button
                        key={subject._id}
                        type="button"
                        onClick={() =>
                          toggleMultiSelect(index, "subjectIds", subject._id)
                        }
                        className={`rounded-lg border px-3 py-2 text-xs transition ${
                          selected
                            ? "border-cyan-400 bg-cyan-500/15 text-cyan-300"
                            : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-cyan-500/50"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {subject.name}
                      </button>
                    );
                  })}

                  {!subjects.length && (
                    <p className="text-xs text-amber-400">
                      No subjects found. Create subjects first.
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {row.subjectIds.length} subject(s) selected
                </p>
              </div>

              <div className="border-t border-white/10" />

              {/* CLASS ASSIGNMENT */}

              <div className="space-y-3">
                <SectionTitle
                  icon={<GraduationCap size={18} />}
                  title="Class Assignment"
                  description="Select all classes assigned to this teacher."
                />

                <div className="flex flex-wrap gap-2">
                  {classes.map((schoolClass) => {
                    const selected = row.classIds.includes(schoolClass._id);

                    return (
                      <button
                        key={schoolClass._id}
                        type="button"
                        onClick={() =>
                          toggleMultiSelect(index, "classIds", schoolClass._id)
                        }
                        className={`rounded-lg border px-3 py-2 text-xs transition ${
                          selected
                            ? "border-purple-400 bg-purple-500/15 text-purple-300"
                            : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-purple-500/50"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {schoolClass.name}
                      </button>
                    );
                  })}

                  {!classes.length && (
                    <p className="text-xs text-amber-400">
                      No classes found. Create classes first.
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {row.classIds.length} class(es) selected
                </p>
              </div>

              <div className="border-t border-white/10" />

              {/* ADDITIONAL PROFILE */}

              <details className="group rounded-xl border border-white/10 bg-white/[0.02]">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-300">
                  Additional Profile Information
                  <span className="ml-2 text-xs text-slate-500">
                    Emergency contact and identification
                  </span>
                </summary>

                <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <Field
                    label="Emergency Contact Name"
                    value={row.emergencyName}
                    onChange={(value) =>
                      updateRow(index, "emergencyName", value)
                    }
                  />

                  <Field
                    label="Emergency Contact Phone"
                    value={row.emergencyPhone}
                    onChange={(value) =>
                      updateRow(index, "emergencyPhone", value)
                    }
                  />

                  <Field
                    label="Blood Group"
                    value={row.bloodGroup}
                    onChange={(value) =>
                      updateRow(index, "bloodGroup", value)
                    }
                  />

                  <Field
                    label="Genotype"
                    value={row.genotype}
                    onChange={(value) =>
                      updateRow(index, "genotype", value)
                    }
                  />

                  <Field
                    label="NIN"
                    value={row.nin}
                    onChange={(value) =>
                      updateRow(index, "nin", value)
                    }
                  />
                </div>
              </details>

              <div className="border-t border-white/10" />

              {/* PASSWORD */}

              <div className="space-y-3">
                <SectionTitle
                  icon={<LockKeyhole size={18} />}
                  title="Teacher Login Password"
                  description="Set an initial password for this teacher."
                />

                <div className="max-w-md">
                  <Field
                    label="Password"
                    type="password"
                    required
                    value={row.password}
                    onChange={(value) =>
                      updateRow(index, "password", value)
                    }
                    placeholder="At least 6 characters"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Passwords are sent securely to the backend and should
                    be hashed before storage.
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}

        {/* PAGE ACTIONS */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addRow}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Another Teacher
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || fetching}
            className="btn-primary inline-flex min-h-[46px] items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving Teachers...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Save {filledCount} Teacher(s)
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs leading-6 text-slate-400">
            Employee IDs are generated by the backend. Email addresses are
            optional. Each teacher must have a password and at least one
            subject and class. The backend must validate assignments against
            the current school before saving.
          </p>
        </div>
      </section>
    </div>
  );
}
