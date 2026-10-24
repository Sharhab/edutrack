
"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, BookOpen, ClipboardPaste, RefreshCw } from "lucide-react";
import api from "../../../../lib/axios";

type SubjectRow = {
  name: string;
  code: string;
  category: string;
  isCore: boolean;
  isActive: boolean;
};

type Subject = SubjectRow & {
  _id: string;
};

type ImportStats = {
  total: number;
  created: number;
  skipped: number;
  failed: number;
};

const emptyRow: SubjectRow = {
  name: "",
  code: "",
  category: "general",
  isCore: false,
  isActive: true,
};

const categories = [
  { value: "general", label: "General" },
  { value: "core", label: "Core" },
  { value: "science", label: "Science" },
  { value: "commercial", label: "Commercial" },
  { value: "arts", label: "Arts" },
  { value: "vocational", label: "Vocational" },
  { value: "elective", label: "Elective" },
];

const normalizeHeader = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

function parseBoolean(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase();

  if (["true", "yes", "1", "active", "core"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "0", "inactive", "noncore", "non-core"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function SubjectsPage() {
  const [rows, setRows] = useState<SubjectRow[]>([
    { ...emptyRow },
  ]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);

      const response = await api.get("/subjects");
      const data = response?.data?.data;

      if (Array.isArray(data)) {
        setSubjects(data);
      } else if (Array.isArray(data?.subjects)) {
        setSubjects(data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (err: any) {
      console.error("Failed to load subjects", err);
      setError(getErrorMessage(err, "Failed to load subjects."));
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  function addRow() {
    setRows((previous) => [...previous, { ...emptyRow }]);
    setError("");
    setSuccess("");
  }

  function removeRow(index: number) {
    setRows((previous) =>
      previous.length === 1
        ? [{ ...emptyRow }]
        : previous.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function updateRow(
    index: number,
    field: keyof SubjectRow,
    value: string | boolean
  ) {
    setRows((previous) =>
      previous.map((row, currentIndex) =>
        currentIndex === index
          ? { ...row, [field]: value }
          : row
      )
    );
  }

  // =====================================================
  // PASTE SUBJECTS FROM EXCEL
  // =====================================================

  function pasteSubjects() {
    setError("");
    setSuccess("");
    setPasteMessage("");

    if (!pasteText.trim()) {
      setPasteMessage("Copy your subject data from Excel and paste it here.");
      return;
    }

    const matrix = pasteText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.split("\t").map((cell) => cell.trim()))
      .filter((cells) => cells.some(Boolean));

    if (!matrix.length) {
      setPasteMessage("No subject data was found.");
      return;
    }

    const aliases: Record<string, keyof SubjectRow> = {
      name: "name",
      subject: "name",
      subjectname: "name",
      code: "code",
      subjectcode: "code",
      category: "category",
      subjectcategory: "category",
      iscore: "isCore",
      core: "isCore",
      coresubject: "isCore",
      status: "isActive",
      isactive: "isActive",
      active: "isActive",
    };

    // Find a header row rather than assuming the first row is the header.
    const headerIndex = matrix.findIndex((cells) =>
      cells.some((cell) => {
        const header = normalizeHeader(cell);
        return ["subject", "subjectname", "name"].includes(header);
      })
    );

    if (headerIndex < 0) {
      setPasteMessage(
        "Could not find a Subject Name header. Include a header row such as Subject Name, Subject Code, Category, Core, Status."
      );
      return;
    }

    const headers = matrix[headerIndex].map(
      (cell) => aliases[normalizeHeader(cell)]
    );

    const nameIndex = headers.indexOf("name");

    if (nameIndex < 0) {
      setPasteMessage("A Subject Name column is required.");
      return;
    }

    const imported: SubjectRow[] = [];
    const errors: string[] = [];
    const batchNames = new Set<string>();

    matrix.slice(headerIndex + 1).forEach((cells, index) => {
      if (!cells.some(Boolean)) return;

      const values: Partial<Record<keyof SubjectRow, string>> = {};

      headers.forEach((header, columnIndex) => {
        if (header) {
          values[header] = cells[columnIndex] || "";
        }
      });

      const name = (values.name || "").trim();

      if (!name) {
        errors.push(`Data row ${index + 1}: subject name is missing.`);
        return;
      }

      const nameKey = name.toLowerCase();

      if (batchNames.has(nameKey)) {
        errors.push(`Data row ${index + 1}: duplicate subject "${name}" was skipped.`);
        return;
      }

      const categoryValue = (values.category || "general").trim().toLowerCase();
      const validCategory = categories.some(
        (category) => category.value === categoryValue
      );

      if (!validCategory) {
        errors.push(
          `Data row ${index + 1}: invalid category "${categoryValue}" for "${name}".`
        );
        return;
      }

      batchNames.add(nameKey);

      imported.push({
        name,
        code: (values.code || "").trim(),
        category: categoryValue,
        isCore: parseBoolean(values.isCore || "", false),
        isActive: parseBoolean(values.isActive || "", true),
      });
    });

    if (!imported.length) {
      setPasteMessage(errors[0] || "No valid subjects were found.");
      return;
    }

    setRows((previous) => {
      // Preserve any non-empty rows already entered manually.
      const existingRows = previous.filter((row) => row.name.trim());
      const existingNames = new Set(
        existingRows.map((row) => row.name.trim().toLowerCase())
      );

      const uniqueImported = imported.filter(
        (row) => !existingNames.has(row.name.toLowerCase())
      );

      return [...existingRows, ...uniqueImported];
    });

    setPasteText("");
    setPasteMessage(
      `${imported.length} subject(s) parsed. Review the table before saving.` +
        (errors.length ? ` ${errors.length} row(s) skipped. ${errors[0]}` : "")
    );
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  function validateRows(rowsToValidate: SubjectRow[]) {
    const names = new Set<string>();

    for (const row of rowsToValidate) {
      if (!row.name.trim()) {
        return "Every subject row must have a subject name.";
      }

      const key = row.name.trim().toLowerCase();

      if (names.has(key)) {
        return `Duplicate subject "${row.name.trim()}" found in the table.`;
      }

      names.add(key);

      if (!categories.some((category) => category.value === row.category)) {
        return `Invalid category for "${row.name}".`;
      }
    }

    return "";
  }

  // =====================================================
  // BULK SAVE
  // =====================================================

  async function saveAllSubjects() {
    const rowsToSave = rows.filter((row) => row.name.trim());

    if (!rowsToSave.length) {
      setError("Add or paste at least one subject before saving.");
      return;
    }

    const validationError = validateRows(rowsToSave);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = rowsToSave.map((row) => ({
        name: row.name.trim(),
        code: row.code.trim(),
        category: row.category,
        isCore: row.isCore,
        isActive: row.isActive,
      }));

      const response = await api.post("/subjects/bulk", {
        subjects: payload,
      });

      const data = response?.data?.data;
      const summary = data?.summary ?? data ?? {};

      const stats: ImportStats = {
        total: summary.total ?? payload.length,
        created: summary.created ?? 0,
        skipped: summary.skipped ?? 0,
        failed: summary.failed ?? 0,
      };

      setSuccess(
        `Import complete — Created: ${stats.created}, Skipped: ${stats.skipped}, Failed: ${stats.failed}.`
      );

      // Keep failed rows available for correction.
      const failedIndexes = new Set<number>(
        Array.isArray(data?.errors)
          ? data.errors
              .filter((item: any) => item?.row?.name)
              .map((item: any) => item.index)
          : []
      );

      if (stats.failed > 0 && failedIndexes.size > 0) {
        setRows(
          rowsToSave.filter((_, index) => failedIndexes.has(index))
        );
      } else {
        setRows([{ ...emptyRow }]);
      }

      await loadSubjects();
    } catch (err: any) {
      console.error("Bulk subject creation failed", err);
      setError(getErrorMessage(err, "Subject import failed."));
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SINGLE SUBJECT
  // =====================================================

  async function addSingleSubject() {
    const row = rows[0];

    if (!row.name.trim()) {
      setError("Subject name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await api.post("/subjects", {
        name: row.name.trim(),
        code: row.code.trim(),
        category: row.category,
        isCore: row.isCore,
        isActive: row.isActive,
      });

      setSuccess(`Subject "${row.name.trim()}" created successfully.`);
      setRows([{ ...emptyRow }]);
      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to create subject", err);
      setError(getErrorMessage(err, "Failed to create subject."));
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // DELETE SUBJECT
  // =====================================================

  async function deleteSubject(id: string) {
    if (!window.confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/subjects/${id}`);
      setSuccess("Subject deleted successfully.");
      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to delete subject", err);
      setError(getErrorMessage(err, "Failed to delete subject."));
    }
  }

  return (
    <div className="space-y-6 text-white">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <BookOpen size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-slate-400">
            Manage subjects and import multiple subjects from Excel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSubjects()}
          disabled={loadingSubjects}
          className="btn-secondary ml-auto inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* FEEDBACK */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300"
        >
          {success}
        </div>
      )}

      {/* EXCEL PASTE IMPORT */}
      <section className="space-y-4 rounded-2xl border border-cyan-400/20 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <ClipboardPaste size={22} className="text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold">
              Import Subjects from Excel
            </h2>
            <p className="text-sm text-slate-400">
              Copy your spreadsheet cells, including the header row, and paste below.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
          <p className="mb-1 font-medium">Supported columns</p>
          <p>
            Subject Name | Subject Code | Category | Core | Status
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Category options: general, core, science, commercial, arts,
            vocational, elective. Missing category defaults to general;
            missing status defaults to active.
          </p>
        </div>

        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          rows={7}
          placeholder={`Subject Name\tSubject Code\tCategory\tCore\tStatus\nMathematics\tMTH\tcore\tyes\tactive\nEnglish Language\tENG\tcore\tyes\tactive\nBasic Science\tBSC\tscience\tno\tactive`}
          className="input w-full font-mono text-sm"
          aria-label="Paste subjects from Excel"
        />

        {pasteMessage && (
          <p role="status" className="text-sm text-cyan-300">
            {pasteMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={pasteSubjects}
            disabled={!pasteText.trim() || loading}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Pasted Subjects to Table
          </button>

          <button
            type="button"
            onClick={() => {
              setPasteText("");
              setPasteMessage("");
            }}
            className="btn-secondary"
          >
            Clear Paste Box
          </button>
        </div>
      </section>

      {/* SINGLE SUBJECT */}
      <section className="rounded-2xl border border-white/10 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Add Subject</h2>
          <p className="text-sm text-slate-400">
            Create one subject manually.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Subject Name
            </label>
            <input
              value={rows[0]?.name ?? ""}
              onChange={(event) => updateRow(0, "name", event.target.value)}
              placeholder="e.g. Mathematics"
              className="input w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Subject Code
            </label>
            <input
              value={rows[0]?.code ?? ""}
              onChange={(event) => updateRow(0, "code", event.target.value)}
              placeholder="e.g. MTH"
              className="input w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Category
            </label>
            <select
              value={rows[0]?.category ?? "general"}
              onChange={(event) => updateRow(0, "category", event.target.value)}
              className="input w-full"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Status
            </label>
            <select
              value={rows[0]?.isActive ? "active" : "inactive"}
              onChange={(event) =>
                updateRow(0, "isActive", event.target.value === "active")
              }
              className="input w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={rows[0]?.isCore ?? false}
            onChange={(event) => updateRow(0, "isCore", event.target.checked)}
            className="h-4 w-4"
          />
          This is a core subject
        </label>

        <button
          type="button"
          onClick={addSingleSubject}
          disabled={loading}
          className="btn-primary mt-5 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Add Subject"}
        </button>
      </section>

      {/* BULK ENTRY TABLE */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Bulk Subject Entry</h2>
          <p className="text-sm text-slate-400">
            Review or edit pasted rows before saving.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left">Subject Name</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-center">Core</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-white/10">
                  <td className="p-2">
                    <input
                      value={row.name}
                      onChange={(event) => updateRow(index, "name", event.target.value)}
                      placeholder="Mathematics"
                      className="input w-full"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      value={row.code}
                      onChange={(event) => updateRow(index, "code", event.target.value)}
                      placeholder="MTH"
                      className="input w-full"
                    />
                  </td>

                  <td className="p-2">
                    <select
                      value={row.category}
                      onChange={(event) => updateRow(index, "category", event.target.value)}
                      className="input w-full"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.isCore}
                      onChange={(event) => updateRow(index, "isCore", event.target.checked)}
                      className="h-4 w-4"
                      aria-label={`Mark ${row.name || `row ${index + 1}`} as core`}
                    />
                  </td>

                  <td className="p-2">
                    <select
                      value={row.isActive ? "active" : "inactive"}
                      onChange={(event) =>
                        updateRow(index, "isActive", event.target.value === "active")
                      }
                      className="input w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove row ${index + 1}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={addRow} className="btn-secondary inline-flex items-center">
            <Plus size={16} className="mr-2" />
            Add Row
          </button>

          <button
            type="button"
            onClick={saveAllSubjects}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "Processing..." : "Save All Subjects"}
          </button>
        </div>
      </section>

      {/* EXISTING SUBJECTS */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Existing Subjects</h2>
          <p className="text-sm text-slate-400">
            Subjects currently configured for this school.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          {loadingSubjects ? (
            <div className="p-6 text-center text-slate-400">
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No subjects found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-center">Core</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject._id} className="border-t border-white/10">
                    <td className="p-3">{subject.name}</td>
                    <td className="p-3 text-slate-300">{subject.code || "—"}</td>
                    <td className="p-3 capitalize text-slate-300">
                      {subject.category}
                    </td>
                    <td className="p-3 text-center">
                      {subject.isCore ? (
                        <span className="text-green-400">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="p-3">
                      {subject.isActive ? (
                        <span className="text-green-400">Active</span>
                      ) : (
                        <span className="text-red-400">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => void deleteSubject(subject._id)}
                        className="text-red-400 hover:text-red-300"
                        aria-label={`Delete ${subject.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
