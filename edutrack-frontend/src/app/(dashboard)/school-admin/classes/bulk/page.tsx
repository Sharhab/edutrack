
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import api from "../../../../../lib/axios";

type ClassRow = {
  name: string;
  level: string;
  code: string;
  capacity: string;
  isActive: string;
};

const createEmptyRow = (): ClassRow => ({
  name: "",
  level: "",
  code: "",
  capacity: "40",
  isActive: "true",
});

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to save classes. Please check your entries and try again."
    );
  }

  return "An unexpected error occurred while saving classes.";
}

export default function BulkClassPage() {
  const [rows, setRows] = useState<ClassRow[]>([createEmptyRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 const [pasteText, setPasteText] = useState("");
const [pasteMessage, setPasteMessage] = useState("");
  
  function updateRow(
    index: number,
    field: keyof ClassRow,
    value: string
  ) {
    setRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );

    setError("");
    setSuccess("");
  }

  function addRow() {
    setRows((previous) => [...previous, createEmptyRow()]);
    setError("");
    setSuccess("");
  }

  function removeRow(index: number) {
    setRows((previous) => {
      if (previous.length === 1) {
        return [createEmptyRow()];
      }

      return previous.filter((_, rowIndex) => rowIndex !== index);
    });

    setError("");
    setSuccess("");
  }

  function validateRows(): string {
    const filledRows = rows.filter((row) => row.name.trim());

    if (filledRows.length === 0) {
      return "Enter at least one class name.";
    }

    const names = new Set<string>();

    for (let index = 0; index < filledRows.length; index += 1) {
      const row = filledRows[index];
      const rowNumber = index + 1;
      const name = row.name.trim();
      const level = row.level.trim();
      const code = row.code.trim();
      const capacity = Number(row.capacity);

      if (name.length < 2 || name.length > 100) {
        return `Class ${rowNumber}: name must contain between 2 and 100 characters.`;
      }

      if (!level || level.length > 50) {
        return `Class ${rowNumber}: enter a level of no more than 50 characters.`;
      }

      if (code.length > 30) {
        return `Class ${rowNumber}: code cannot exceed 30 characters.`;
      }

      if (
        row.capacity.trim() === "" ||
        !Number.isInteger(capacity) ||
        capacity < 0 ||
        capacity > 10000
      ) {
        return `Class ${rowNumber}: capacity must be a whole number between 0 and 10000.`;
      }

      const normalizedName = name.toLowerCase();

      if (names.has(normalizedName)) {
        return `Duplicate class name "${name}" found in this bulk entry.`;
      }

      names.add(normalizedName);
    }

    return "";
  }
  
function pasteClasses() {
  setError("");
  setSuccess("");
  setPasteMessage("");

  const text = pasteText.trim();

  if (!text) {
    setPasteMessage("Paste class data from Excel first.");
    return;
  }

  const matrix = text
    .split(/\r?\n/)
    .map((line) => line.split("\t").map((cell) => cell.trim()))
    .filter((cells) => cells.some(Boolean));

  if (!matrix.length) {
    setPasteMessage("No class data found.");
    return;
  }

  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const aliases: Record<string, string> = {
    classname: "name",
    name: "name",
    class: "name",
    level: "level",
    classlevel: "level",
    classcode: "code",
    code: "code",
    arm: "code",
    classarm: "code",
    capacity: "capacity",
    studentcapacity: "capacity",
    status: "isActive",
    isactive: "isActive",
  };

  const headerIndex = matrix.findIndex((cells) =>
    cells.some((cell) => ["classname", "name", "class"].includes(normalize(cell)))
  );

  if (headerIndex < 0) {
    setPasteMessage(
      "Could not find a Class Name header. Copy the column headers with the class rows."
    );
    return;
  }

  const headers = matrix[headerIndex].map(
    (cell) => aliases[normalize(cell)]
  );

  const nameIndex = headers.indexOf("name");

  if (nameIndex < 0) {
    setPasteMessage("A Class Name column is required.");
    return;
  }

  const imported: ClassRow[] = [];
  const errors: string[] = [];

  matrix.slice(headerIndex + 1).forEach((cells, index) => {
    if (!cells.some(Boolean)) return;

    const values: Record<string, string> = {};

    headers.forEach((header, columnIndex) => {
      if (header) values[header] = cells[columnIndex] || "";
    });

    const name = values.name?.trim();

    if (!name) {
      errors.push(`Row ${index + 1}: class name is missing.`);
      return;
    }

    const match = name.match(/^(NURSERY|BASIC)\s*(\d+)/i);
    const level =
      values.level?.trim() ||
      (match ? `${match[1].toUpperCase()} ${match[2]}` :
        /^SS\s*\d+/i.test(name) ? name.match(/^SS\s*\d+/i)?.[0] || "" : "");

    if (!level) {
      errors.push(
        `Row ${index + 1}: provide a Level for "${name}".`
      );
      return;
    }

    const rawCapacity = values.capacity?.trim();
    const capacity = rawCapacity ? Number(rawCapacity) : 40;

    if (
      !Number.isInteger(capacity) ||
      capacity < 0 ||
      capacity > 10000
    ) {
      errors.push(`Row ${index + 1}: invalid capacity for "${name}".`);
      return;
    }

    const status = values.isActive?.trim().toLowerCase();

    imported.push({
      name,
      level,
      code: values.code?.trim() || name.replace(/\s+/g, "-").toUpperCase(),
      capacity: String(capacity),
      isActive:
        status === "inactive" || status === "false" ? "false" : "true",
    });
  });

  if (!imported.length) {
    setPasteMessage(errors[0] || "No valid class rows found.");
    return;
  }

  setRows((previous) => [
    ...previous.filter((row) => row.name.trim()),
    ...imported,
  ]);

  setPasteText("");
  setPasteMessage(
    `${imported.length} class(es) added to the table.` +
      (errors.length ? ` ${errors.length} row(s) skipped. ${errors[0]}` : "")
  );
}
  async function saveAll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const validationError = validateRows();

    if (validationError) {
      setError(validationError);
      return;
    }

    const classes = rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        level: row.level.trim(),
        code: row.code.trim() || undefined,
        capacity: Number(row.capacity),
        isActive: row.isActive === "true",
      }));

    try {
      setLoading(true);

      const response = await api.post("/classes/bulk-upsert", {
        classes,
      });

      setSuccess(
        response.data?.message || "Classes saved successfully."
      );

      setRows([createEmptyRow()]);
    } catch (requestError: unknown) {
      console.error("Bulk class save failed:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Bulk Class Entry
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Create or update multiple classes at once using the same core
          details available in the single-class form.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}
      
<section className="space-y-3 rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4">
  <div>
    <h2 className="text-lg font-semibold text-white">
      Import Classes from Excel
    </h2>
    <p className="mt-1 text-sm text-slate-400">
      Copy class rows and their column headers from Excel, then paste below.
      Existing table rows are preserved.
    </p>
  </div>

  <textarea
    value={pasteText}
    onChange={(event) => setPasteText(event.target.value)}
    placeholder={"Class Name\nBASIC 7A\nBASIC 7B"}
    rows={7}
    className="input w-full font-mono text-sm"
  />

  {pasteMessage && (
    <p role="status" className="text-sm text-cyan-300">
      {pasteMessage}
    </p>
  )}

  <button
    type="button"
    onClick={pasteClasses}
    disabled={!pasteText.trim() || loading}
    className="btn-primary disabled:opacity-50"
  >
    Add Pasted Classes to Table
  </button>
</section>
      
      <form onSubmit={saveAll} className="space-y-4">
        {rows.map((row, index) => (
          <section
            key={index}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">
                  Class {index + 1}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Fields marked * are required.
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={loading}
                aria-label={`Remove class ${index + 1}`}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={16} />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Class Name *
                </span>

                <input
                  required
                  maxLength={100}
                  value={row.name}
                  onChange={(event) =>
                    updateRow(index, "name", event.target.value)
                  }
                  placeholder="e.g. Primary 3"
                  className="input w-full"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Level *
                </span>

                <input
                  required
                  maxLength={50}
                  value={row.level}
                  onChange={(event) =>
                    updateRow(index, "level", event.target.value)
                  }
                  placeholder="e.g. Primary"
                  className="input w-full"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Class Code / Arm
                </span>

                <input
                  maxLength={30}
                  value={row.code}
                  onChange={(event) =>
                    updateRow(index, "code", event.target.value)
                  }
                  placeholder="e.g. PRI3A or A"
                  className="input w-full"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Student Capacity *
                </span>

                <input
                  required
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  value={row.capacity}
                  onChange={(event) =>
                    updateRow(index, "capacity", event.target.value)
                  }
                  className="input w-full"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Status
                </span>

                <select
                  value={row.isActive}
                  onChange={(event) =>
                    updateRow(index, "isActive", event.target.value)
                  }
                  className="input w-full"
                  disabled={loading}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>
          </section>
        ))}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
          <button
            type="button"
            onClick={addRow}
            disabled={loading}
            className="btn-secondary inline-flex items-center justify-center disabled:opacity-50"
          >
            <Plus size={16} className="mr-2" />
            Add Another Class
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving Classes..." : "Save All Classes"}
          </button>
        </div>
      </form>
    </main>
  );
} 

