
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  ClipboardPaste,
  RefreshCw,
  UserRound,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  ShieldCheck,
  Users,
} from "lucide-react";

import api from "../../../../../lib/axios";
import { getClassOptions } from "../../../../../lib/options";

/* =====================================================
   TYPES
===================================================== */

type Row = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;

  qualification: string;
  designation: string;

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

  status: "active" | "inactive";
};

type ClassOption = {
  _id: string;
  name: string;
};

type BulkResultItem = {
  row: number;
  email?: string | null;
  employeeId?: string;
  action: "created" | "updated" | "failed";
  error?: string;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
  passwordChanged?: boolean;
};

type BulkResult = {
  total?: number;
  created?: number;
  updated?: number;
  failed?: number;
  results?: BulkResultItem[];
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

    qualification: "",
    designation: "",

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

    status: "active",
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-medium text-slate-300">
        {label}
      </span>

      <select
        className="input min-h-[42px] w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

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

  const [pasteText, setPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saveResult, setSaveResult] = useState<BulkResult | null>(null);
  const [copied, setCopied] = useState(false);

  const filledRows = useMemo(
    () => rows.filter(isFilled),
    [rows]
  );

  const createdCredentials = useMemo(
    () =>
      (saveResult?.results || []).filter(
        (item) =>
          item.action === "created" &&
          Boolean(item.temporaryPassword)
      ),
    [saveResult]
  );

  /* =====================================================
     LOAD SCHOOL CLASSES
  ===================================================== */

  async function loadOptions() {
    try {
      setFetching(true);
      setError("");

      const classRes = await getClassOptions();
      setClasses(classRes || []);
    } catch (err: any) {
      console.error("Teacher class options error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load school classes."
      );
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  /* =====================================================
     RESET RESULT
  ===================================================== */

  function clearResult() {
    setSaveResult(null);
    setSuccessMessage("");
    setCopied(false);
  }

  /* =====================================================
     ROW ACTIONS
  ===================================================== */

  function addRow() {
    setRows((previous) => [
      ...previous,
      createEmptyRow(),
    ]);

    setError("");
    clearResult();
  }

  function removeRow(index: number) {
    setRows((previous) => {
      if (previous.length === 1) {
        return [createEmptyRow()];
      }

      return previous.filter((_, i) => i !== index);
    });

    setError("");
    clearResult();
  }

  function updateRow<K extends keyof Row>(
    index: number,
    field: K,
    value: Row[K]
  ) {
    setRows((previous) =>
      previous.map((row, i) =>
        i === index
          ? { ...row, [field]: value }
          : row
      )
    );

    clearResult();
  }

  function toggleClass(index: number, classId: string) {
    setRows((previous) =>
      previous.map((row, i) => {
        if (i !== index) return row;

        const selected = row.classIds.includes(classId);

        return {
          ...row,
          classIds: selected
            ? row.classIds.filter((id) => id !== classId)
            : [...row.classIds, classId],
        };
      })
    );

    clearResult();
  }

  /* =====================================================
     PASTE IMPORT

     First | Middle | Last | Email | Phone |
     Qualification | Designation | Gender | DOB | State
  ===================================================== */

  function importPastedTeachers() {
    setError("");
    setPasteMessage("");
    clearResult();

    if (!pasteText.trim()) {
      setError("Paste teacher records first.");
      return;
    }

    const lines = pasteText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    const firstLine = lines[0]?.toLowerCase() || "";

    const hasHeader =
      firstLine.includes("first") &&
      (firstLine.includes("last") ||
        firstLine.includes("email"));

    const dataLines = hasHeader
      ? lines.slice(1)
      : lines;

    if (!dataLines.length) {
      setError("The pasted content contains only a header.");
      return;
    }

    const importedRows: Row[] = [];

    for (let index = 0; index < dataLines.length; index++) {
      const columns = dataLines[index]
        .split("\t")
        .map((column) => column.trim());

      const genderIndex = columns.findIndex((column) =>
        ["male", "female"].includes(column.toLowerCase())
      );

      if (genderIndex === -1) {
        setError(
          `Row ${index + 1}: Gender must be Male or Female. Check your pasted columns.`
        );
        return;
      }

      if (genderIndex < 6) {
        setError(
          `Row ${index + 1}: Not enough columns were supplied.`
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
      .map((row, index) => ({
        row,
        number: index + 1,
      }))
      .filter(
        ({ row }) =>
          row.firstName.trim().length < 2 ||
          row.lastName.trim().length < 2
      );

    if (invalidRows.length) {
      setError(
        `Rows ${invalidRows
          .map((item) => item.number)
          .join(", ")}: First name and last name are required.`
      );
      return;
    }

    const emails = importedRows
      .map((row) => row.email.trim().toLowerCase())
      .filter(Boolean);

    if (new Set(emails).size !== emails.length) {
      setError(
        "Duplicate email addresses found in the pasted records."
      );
      return;
    }

    setRows((previous) => [
      ...previous.filter(isFilled),
      ...importedRows,
    ]);

    setPasteMessage(
      `${importedRows.length} teacher(s) imported. Assign classes before saving.`
    );

    setPasteText("");
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validate() {
    if (!filledRows.length) {
      return "Add or paste at least one teacher.";
    }

    if (!classes.length) {
      return "No classes are available. Create school classes first.";
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
     API PAYLOAD
  ===================================================== */

  function cleanRow(row: Row) {
    const email = row.email.trim().toLowerCase();

    return {
      firstName: row.firstName.trim(),
      middleName: row.middleName.trim(),
      lastName: row.lastName.trim(),

      ...(email ? { email } : {}),

      phone: row.phone.trim(),
      qualification: row.qualification.trim(),
      designation: row.designation.trim(),

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
    };
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function handleSave() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      clearResult();
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      clearResult();

      const response = await api.post("/teachers/bulk", {
        rows: filledRows.map(cleanRow),
      });

      const result: BulkResult =
        response.data?.data || {};

      setSaveResult(result);

      const failedCount = result.failed || 0;
      const createdCount = result.created || 0;
      const updatedCount = result.updated || 0;

      if (failedCount === 0) {
        setSuccessMessage(
          `${createdCount} teacher account(s) created and ${updatedCount} existing teacher record(s) updated successfully.`
        );

        setRows([createEmptyRow()]);
        setPasteMessage("");
      } else {
        setSuccessMessage(
          "Import completed. Review the results below for successful and failed rows."
        );
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
     GENERATED CREDENTIALS
  ===================================================== */

  function getCredentialsText() {
    return createdCredentials
      .map(
        (item) =>
          [
            `Teacher Row: ${item.row}`,
            `Employee ID: ${item.employeeId || "Not available"}`,
            `Email: ${item.email || "Not provided"}`,
            `Temporary Password: ${item.temporaryPassword || ""}`,
            "",
          ].join("\n")
      )
      .join("\n-----------------------------\n\n");
  }

  async function copyCreatedCredentials() {
    const text = getCredentialsText();

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (copyError) {
      console.error("Credential copy failed:", copyError);
      setError(
        "Unable to copy credentials. Please use the print option."
      );
    }
  }

  function printCreatedCredentials() {
    if (!createdCredentials.length) return;

    const slips = createdCredentials
      .map(
        (item) => `
          <section class="slip">
            <h2>Teacher Login Credentials</h2>
            <p><strong>Employee ID:</strong> ${escapeHtml(
              item.employeeId || ""
            )}</p>
            <p><strong>Email:</strong> ${escapeHtml(
              item.email || "Not provided"
            )}</p>
            <p><strong>Temporary Password:</strong></p>
            <div class="password">${escapeHtml(
              item.temporaryPassword || ""
            )}</div>
            <p class="note">
              Keep these credentials private. You may change your password
              at any time from Account Security.
            </p>
          </section>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError(
        "Allow pop-ups in your browser to print teacher login slips."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teacher Login Slips</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }
            h1 { font-size: 22px; margin-bottom: 20px; }
            h2 { font-size: 17px; margin-top: 0; }
            .slip {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .password {
              border: 1px dashed #64748b;
              border-radius: 6px;
              padding: 12px;
              font-family: monospace;
              font-size: 16px;
              overflow-wrap: anywhere;
            }
            .note {
              color: #475569;
              font-size: 12px;
              line-height: 1.6;
              margin-top: 16px;
            }
            @media print {
              body { padding: 0; }
              .slip { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>EduTrack — Teacher Login Slips</h1>
          ${slips}
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (fetching) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
        Loading school classes...
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10 text-white">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <GraduationCap size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Bulk Teacher Entry
            </h1>

            <p className="text-xs text-slate-400 sm:text-sm">
              Add multiple teachers and create their school login accounts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadOptions()}
          disabled={fetching || loading}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh Classes
        </button>
      </div>

      {/* ACCOUNT SECURITY INFORMATION */}

      <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-cyan-400"
        />

        <div>
          <p className="text-sm font-semibold text-cyan-300">
            Secure teacher account creation
          </p>

          <p className="mt-1 text-xs leading-6 text-slate-300">
            EduTrack automatically generates a secure password for every
            new teacher account. Teachers can log in immediately and may
            change their password whenever they choose.
          </p>
        </div>
      </div>

      {/* QUICK SUMMARY */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Users size={15} />
            <p className="text-xs">Teacher rows</p>
          </div>

          <p className="mt-2 text-2xl font-bold">
            {rows.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 size={15} />
            <p className="text-xs">Ready for entry</p>
          </div>

          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {filledRows.length}
          </p>
        </div>

        <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-slate-400">
            <GraduationCap size={15} />
            <p className="text-xs">School classes</p>
          </div>

          <p className="mt-2 text-2xl font-bold">
            {classes.length}
          </p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* RESULT SUMMARY */}

      {saveResult && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div>
            <h2 className="font-semibold">
              Teacher processing result
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Review the accounts created, updated, and any rows that failed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Total",
                value: saveResult.total || 0,
              },
              {
                label: "Created",
                value: saveResult.created || 0,
              },
              {
                label: "Updated",
                value: saveResult.updated || 0,
              },
              {
                label: "Failed",
                value: saveResult.failed || 0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-slate-950/40 p-3"
              >
                <p className="text-xs text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* GENERATED CREDENTIALS */}

          {createdCredentials.length > 0 && (
            <div className="space-y-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div>
                <h3 className="font-semibold text-cyan-300">
                  Generated Teacher Login Credentials
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  These passwords are displayed only in this creation
                  response. Copy or print them now and deliver them
                  privately to the teachers.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyCreatedCredentials()}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Copy size={16} />
                  {copied ? "Copied" : "Copy All Credentials"}
                </button>

                <button
                  type="button"
                  onClick={printCreatedCredentials}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print Login Slips
                </button>
              </div>

              <div className="space-y-3">
                {createdCredentials.map((item, index) => (
                  <div
                    key={`${item.row}-${index}`}
                    className="rounded-lg border border-white/10 bg-slate-950/50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        Teacher — Row {item.row}
                      </p>

                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                        CREATED
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500">
                          Employee ID
                        </span>
                        <p className="mt-0.5 font-semibold text-white">
                          {item.employeeId || "Not available"}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Email
                        </span>
                        <p className="mt-0.5 text-white">
                          {item.email || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Temporary password
                        </span>
                        <p className="mt-0.5 break-all font-mono text-cyan-300">
                          {item.temporaryPassword}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL RESULTS */}

          {!!saveResult.results?.length && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                All Import Results
              </h3>

              {saveResult.results.map((item, index) => (
                <div
                  key={`${item.row}-${index}`}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-medium text-white">
                      Row {item.row}
                      {item.email ? ` — ${item.email}` : ""}
                    </p>

                    {item.employeeId && (
                      <p className="mt-1 text-slate-400">
                        Employee ID: {item.employeeId}
                      </p>
                    )}

                    {item.action === "updated" && (
                      <p className="mt-1 text-cyan-300">
                        Existing password was not changed.
                      </p>
                    )}

                    {item.error && (
                      <p className="mt-1 text-red-400">
                        {item.error}
                      </p>
                    )}
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 font-semibold ${
                      item.action === "created"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : item.action === "updated"
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {item.action.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* PASTE IMPORT */}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <SectionTitle
          icon={<ClipboardPaste size={18} />}
          title="Paste Teacher Records"
          description="Copy teacher rows from Excel or Google Sheets and paste them here."
        />

        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs leading-6 text-slate-300">
          <p className="font-semibold text-cyan-300">
            Supported column order
          </p>

          First Name | Middle Name | Last Name | Email (optional) |
          Phone | Qualification | Designation | Gender |
          Date of Birth | State of Origin

          <p className="mt-2 text-slate-400">
            Gender must be Male or Female. Date of birth should use
            YYYY-MM-DD. Email may be left blank.
          </p>
        </div>

        <textarea
          rows={6}
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="Paste teacher records copied from Excel here..."
          className="input min-h-[140px] w-full resize-y font-mono text-xs"
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
            <h2 className="text-lg font-bold">
              Teacher Records
            </h2>

            <p className="text-xs text-slate-400">
              Complete teacher information and assign at least one class.
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
                    Employee ID generated when saved
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
                  aria-label={`Remove teacher ${index + 1}`}
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

                  <SelectField
                    label="Gender"
                    value={row.gender}
                    onChange={(value) =>
                      updateRow(
                        index,
                        "gender",
                        value as Row["gender"]
                      )
                    }
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                    ]}
                  />

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

                  <SelectField
                    label="Employment Type"
                    value={row.employmentType}
                    onChange={(value) =>
                      updateRow(index, "employmentType", value)
                    }
                    options={[
                      { label: "Full Time", value: "full_time" },
                      { label: "Part Time", value: "part_time" },
                      { label: "Contract", value: "contract" },
                      { label: "Visiting", value: "visiting" },
                    ]}
                  />

                  <Field
                    label="Employment Date"
                    type="date"
                    value={row.employmentDate}
                    onChange={(value) =>
                      updateRow(index, "employmentDate", value)
                    }
                  />

                  <SelectField
                    label="Account Status"
                    value={row.status}
                    onChange={(value) =>
                      updateRow(
                        index,
                        "status",
                        value as Row["status"]
                      )
                    }
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Inactive", value: "inactive" },
                    ]}
                  />
                </div>
              </div>

              <div className="border-t border-white/10" />

              {/* CLASS ASSIGNMENT */}

              <div className="space-y-3">
                <SectionTitle
                  icon={<GraduationCap size={18} />}
                  title="Class Assignment"
                  description="Select all classes assigned to this teacher. Subject access follows the current class-based arrangement."
                />

                <div className="flex flex-wrap gap-2">
                  {classes.map((schoolClass) => {
                    const selected = row.classIds.includes(
                      schoolClass._id
                    );

                    return (
                      <button
                        key={schoolClass._id}
                        type="button"
                        onClick={() =>
                          toggleClass(index, schoolClass._id)
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
            disabled={loading || fetching || filledRows.length === 0}
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
                Save {filledRows.length} Teacher(s)
              </>
            )}
          </button>
        </div>

        {/* INFORMATION */}

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs leading-6 text-slate-400">
            Employee IDs and secure temporary passwords are generated
            automatically by the backend. Email addresses are optional.
            Every teacher must have at least one assigned class.
          </p>

          <p className="mt-2 text-xs leading-6 text-cyan-300">
            Updating an existing teacher changes their profile and class
            assignments only. Their password is not changed by bulk import.
          </p>
        </div>
      </section>
    </div>
  );
}
