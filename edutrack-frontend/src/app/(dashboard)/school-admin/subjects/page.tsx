
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  BookOpen,
  ClipboardPaste,
  RefreshCw,
  Save,
  X,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import api from "../../../../lib/axios";

/* =========================================
   TYPES
========================================= */

type SubjectRow = {
  name: string;
  code: string;
  category: string;
  isCore: boolean;
  isActive: boolean;
  classIds: string[];
};

type ClassOption = {
  value: string;
  label: string;
};

type Subject = {
  _id: string;
  name: string;
  code?: string;
  category: string;
  isCore: boolean;
  isActive: boolean;
  classIds?: Array<string | {
    _id: string;
    name: string;
    level?: string;
  }>;
};

type ImportStats = {
  total: number;
  created: number;
  skipped: number;
  failed: number;
};

/* =========================================
   CONSTANTS
========================================= */

const emptyRow: SubjectRow = {
  name: "",
  code: "",
  category: "general",
  isCore: false,
  isActive: true,
  classIds: [],
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

  if (
    ["true", "yes", "1", "active", "core"].includes(normalized)
  ) {
    return true;
  }

  if (
    ["false", "no", "0", "inactive", "noncore", "non-core"].includes(normalized)
  ) {
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

function getClassIds(subject: Subject): string[] {
  if (!Array.isArray(subject.classIds)) return [];

  return subject.classIds
    .map((item) =>
      typeof item === "string"
        ? item
        : String(item?._id || "")
    )
    .filter(Boolean);
}

/* =========================================
   COMPONENT
========================================= */

export default function SubjectsPage() {
  const [rows, setRows] = useState<SubjectRow[]>([
    { ...emptyRow },
  ]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [pasteText, setPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(
    null
  );
  const [editingClassIds, setEditingClassIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const assignedClassCount = useMemo(
    () => classes.length,
    [classes]
  );

  /* =========================================
     LOAD CLASSES
  ========================================= */

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);

      const response = await api.get("/options/classes");
      const data = response?.data?.data;

      setClasses(
        Array.isArray(data)
          ? data.map((item: any) => ({
              value: String(item.value || item._id || ""),
              label: item.label || item.name || "Unnamed class",
            })).filter((item: ClassOption) => item.value)
          : []
      );
    } catch (err: any) {
      console.error("Failed to load classes", err);
      setError(getErrorMessage(err, "Failed to load school classes."));
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  /* =========================================
     LOAD SUBJECTS
  ========================================= */

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
    void loadClasses();
    void loadSubjects();
  }, [loadClasses, loadSubjects]);

  /* =========================================
     FEEDBACK
  ========================================= */

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  /* =========================================
     ROW MANAGEMENT
  ========================================= */

  function addRow() {
    setRows((previous) => [
      ...previous,
      { ...emptyRow },
    ]);

    clearFeedback();
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
    value: string | boolean | string[]
  ) {
    setRows((previous) =>
      previous.map((row, currentIndex) =>
        currentIndex === index
          ? { ...row, [field]: value }
          : row
      )
    );
  }

  function toggleRowClass(
    rowIndex: number,
    classId: string
  ) {
    setRows((previous) =>
      previous.map((row, index) => {
        if (index !== rowIndex) return row;

        const selected = row.classIds.includes(classId);

        return {
          ...row,
          classIds: selected
            ? row.classIds.filter((id) => id !== classId)
            : [...row.classIds, classId],
        };
      })
    );
  }

  function selectAllRowClasses(rowIndex: number) {
    updateRow(
      rowIndex,
      "classIds",
      classes.map((item) => item.value)
    );
  }

  function clearRowClasses(rowIndex: number) {
    updateRow(rowIndex, "classIds", []);
  }

  /* =========================================
     EXCEL IMPORT
     Supported columns:
     Subject Name | Subject Code | Category |
     Core | Status | Classes

     Classes can contain comma-separated
     class names.
  ========================================= */

  function pasteSubjects() {
    clearFeedback();
    setPasteMessage("");

    if (!pasteText.trim()) {
      setPasteMessage(
        "Copy your subject data from Excel and paste it here."
      );
      return;
    }

    if (!classes.length) {
      setPasteMessage(
        "No classes are available. Create classes before importing subjects."
      );
      return;
    }

    const matrix = pasteText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) =>
        line.split("\t").map((cell) => cell.trim())
      )
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

    const headerIndex = matrix.findIndex((cells) =>
      cells.some((cell) =>
        ["subject", "subjectname", "name"].includes(
          normalizeHeader(cell)
        )
      )
    );

    if (headerIndex < 0) {
      setPasteMessage(
        "Could not find a Subject Name header. Include a header row."
      );
      return;
    }

    const rawHeaders = matrix[headerIndex].map(normalizeHeader);
    const headers = rawHeaders.map((header) => aliases[header]);
    const classesIndex = rawHeaders.findIndex((header) =>
      ["classes", "class", "classnames"].includes(header)
    );

    if (!headers.includes("name")) {
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

      const categoryValue = (
        values.category || "general"
      ).trim().toLowerCase();

      if (
        !categories.some(
          (category) => category.value === categoryValue
        )
      ) {
        errors.push(
          `Data row ${index + 1}: invalid category "${categoryValue}".`
        );
        return;
      }

      const classNames = classesIndex >= 0
        ? String(cells[classesIndex] || "")
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)
        : [];

      const classIds = classNames.map((className) => {
        const match = classes.find(
          (item) => item.label.toLowerCase() === className
        );

        return match?.value || "";
      }).filter(Boolean);

      if (classNames.length && classIds.length !== classNames.length) {
        errors.push(
          `Data row ${index + 1}: one or more class names were not found for "${name}".`
        );
        return;
      }

      if (!classIds.length) {
        errors.push(
          `Data row ${index + 1}: assign classes to "${name}" in the table before saving.`
        );
      }

      batchNames.add(nameKey);

      imported.push({
        name,
        code: (values.code || "").trim(),
        category: categoryValue,
        isCore: parseBoolean(values.isCore || "", false),
        isActive: parseBoolean(values.isActive || "", true),
        classIds,
      });
    });

    if (!imported.length) {
      setPasteMessage(errors[0] || "No valid subjects were found.");
      return;
    }

    setRows((previous) => {
      const existingRows = previous.filter((row) => row.name.trim());

      const existingNames = new Set(
        existingRows.map((row) =>
          row.name.trim().toLowerCase()
        )
      );

      const uniqueImported = imported.filter(
        (row) => !existingNames.has(row.name.toLowerCase())
      );

      return [...existingRows, ...uniqueImported];
    });

    setPasteText("");

    setPasteMessage(
      `${imported.length} subject(s) parsed. Review class assignments before saving.` +
        (errors.length ? ` ${errors.length} issue(s): ${errors[0]}` : "")
    );
  }

  /* =========================================
     VALIDATION
  ========================================= */

  function validateRows(rowsToValidate: SubjectRow[]) {
    const names = new Set<string>();

    for (const row of rowsToValidate) {
      if (!row.name.trim()) {
        return "Every subject must have a name.";
      }

      const key = row.name.trim().toLowerCase();

      if (names.has(key)) {
        return `Duplicate subject "${row.name.trim()}" found.`;
      }

      names.add(key);

      if (
        !categories.some(
          (category) => category.value === row.category
        )
      ) {
        return `Invalid category for "${row.name}".`;
      }

      if (!row.classIds.length) {
        return `Select at least one class for "${row.name}".`;
      }
    }

    return "";
  }

  /* =========================================
     BULK SAVE
  ========================================= */

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
      clearFeedback();

      const payload = rowsToSave.map((row) => ({
        name: row.name.trim(),
        code: row.code.trim(),
        category: row.category,
        isCore: row.isCore,
        isActive: row.isActive,
        classIds: row.classIds,
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

      const failedIndexes = new Set<number>(
        Array.isArray(data?.errors)
          ? data.errors
              .filter((item: any) => item?.row?.name)
              .map((item: any) => item.index)
          : []
      );

      if (stats.failed > 0 && failedIndexes.size > 0) {
        setRows(
          rowsToSave.filter((_, index) =>
            failedIndexes.has(index)
          )
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

  /* =========================================
     CREATE SINGLE SUBJECT
  ========================================= */

  async function addSingleSubject() {
    const row = rows[0];

    if (!row.name.trim()) {
      setError("Subject name is required.");
      return;
    }

    if (!row.classIds.length) {
      setError("Select at least one class for this subject.");
      return;
    }

    try {
      setLoading(true);
      clearFeedback();

      await api.post("/subjects", {
        name: row.name.trim(),
        code: row.code.trim(),
        category: row.category,
        isCore: row.isCore,
        isActive: row.isActive,
        classIds: row.classIds,
      });

      setSuccess(
        `Subject "${row.name.trim()}" created successfully.`
      );

      setRows([{ ...emptyRow }]);
      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to create subject", err);
      setError(getErrorMessage(err, "Failed to create subject."));
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     EDIT EXISTING SUBJECT CLASSES
  ========================================= */

  function startEditingClasses(subject: Subject) {
    setEditingSubjectId(subject._id);
    setEditingClassIds(getClassIds(subject));
    clearFeedback();
  }

  function cancelEditingClasses() {
    setEditingSubjectId(null);
    setEditingClassIds([]);
  }

  function toggleEditingClass(classId: string) {
    setEditingClassIds((previous) =>
      previous.includes(classId)
        ? previous.filter((id) => id !== classId)
        : [...previous, classId]
    );
  }

  async function saveExistingSubjectClasses(subjectId: string) {
    if (!editingClassIds.length) {
      setError("Select at least one class for this subject.");
      return;
    }

    try {
      setSavingEdit(true);
      clearFeedback();

      await api.put(`/subjects/${subjectId}`, {
        classIds: editingClassIds,
      });

      setSuccess("Subject class assignments updated successfully.");

      cancelEditingClasses();
      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to update subject classes", err);
      setError(
        getErrorMessage(err, "Failed to update subject classes.")
      );
    } finally {
      setSavingEdit(false);
    }
  }

  /* =========================================
     DELETE SUBJECT
  ========================================= */

  async function deleteSubject(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this subject? This may affect existing academic records."
      )
    ) {
      return;
    }

    try {
      clearFeedback();

      await api.delete(`/subjects/${id}`);

      setSuccess("Subject deleted successfully.");
      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to delete subject", err);
      setError(getErrorMessage(err, "Failed to delete subject."));
    }
  }

  /* =========================================
     CLASS CHECKBOX GROUP
  ========================================= */

  function renderRowClassSelector(rowIndex: number) {
    const selectedIds = rows[rowIndex]?.classIds || [];

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-300">
            Assign to Classes
          </p>

          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => selectAllRowClasses(rowIndex)}
              className="text-cyan-300 hover:text-cyan-200"
            >
              Select all
            </button>

            <button
              type="button"
              onClick={() => clearRowClasses(rowIndex)}
              className="text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>

        {loadingClasses ? (
          <p className="text-sm text-slate-400">Loading classes...</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-amber-300">
            No classes found. Create classes first.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {classes.map((item) => (
              <label
                key={item.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition ${
                  selectedIds.includes(item.value)
                    ? "border-cyan-400/50 bg-cyan-500/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.value)}
                  onChange={() =>
                    toggleRowClass(rowIndex, item.value)
                  }
                  className="h-4 w-4 accent-cyan-500"
                />

                <span>{item.label}</span>
              </label>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500">
          {selectedIds.length} of {classes.length} classes selected
        </p>
      </div>
    );
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="space-y-6 text-white">

      {/* HEADER */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
          <BookOpen size={24} className="text-cyan-300" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-sm text-slate-400">
            Manage school subjects and assign them to classes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadClasses();
            void loadSubjects();
          }}
          disabled={loadingSubjects || loadingClasses}
          className="btn-secondary ml-auto inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-slate-400">Total Subjects</p>
          <p className="mt-2 text-2xl font-bold">
            {subjects.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-slate-400">Available Classes</p>
          <p className="mt-2 text-2xl font-bold">
            {assignedClassCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-slate-400">Unassigned Subjects</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {
              subjects.filter(
                (subject) => getClassIds(subject).length === 0
              ).length
            }
          </p>
        </div>
      </div>

      {/* FEEDBACK */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {/* EXCEL IMPORT */}
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
          <p className="mb-2 font-medium">Supported columns</p>

          <p className="break-words">
            Subject Name | Subject Code | Category | Core | Status | Classes
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Separate multiple class names with commas in the Classes column.
            Class names must match the school's existing classes.
          </p>
        </div>

        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          rows={7}
          placeholder={`Subject Name\tSubject Code\tCategory\tCore\tStatus\tClasses
Mathematics\tMTH\tcore\tyes\tactive\tJSS1, JSS2, JSS3
English Language\tENG\tcore\tyes\tactive\tJSS1, JSS2
Basic Science\tBSC\tscience\tno\tactive\tJSS1, JSS2`}
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

      {/* ADD SINGLE SUBJECT */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <h2 className="text-lg font-semibold">Add Subject</h2>
          <p className="text-sm text-slate-400">
            Create one subject and choose the classes where it is taught.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Subject Name
            </label>

            <input
              value={rows[0]?.name ?? ""}
              onChange={(event) =>
                updateRow(0, "name", event.target.value)
              }
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
              onChange={(event) =>
                updateRow(0, "code", event.target.value)
              }
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
              onChange={(event) =>
                updateRow(0, "category", event.target.value)
              }
              className="input w-full"
            >
              {categories.map((category) => (
                <option
                  key={category.value}
                  value={category.value}
                >
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
                updateRow(
                  0,
                  "isActive",
                  event.target.value === "active"
                )
              }
              className="input w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={rows[0]?.isCore ?? false}
            onChange={(event) =>
              updateRow(0, "isCore", event.target.checked)
            }
            className="h-4 w-4 accent-cyan-500"
          />
          This is a core subject
        </label>

        {renderRowClassSelector(0)}

        <button
          type="button"
          onClick={addSingleSubject}
          disabled={loading || loadingClasses || !classes.length}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Add Subject"}
        </button>
      </section>

      {/* BULK ENTRY */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Bulk Subject Entry</h2>
          <p className="text-sm text-slate-400">
            Review subjects and assign classes before saving.
          </p>
        </div>

        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-white/10 p-6 text-center text-slate-400">
              No subjects added.
            </div>
          ) : (
            rows.map((row, index) => (
              <div
                key={index}
                className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Subject {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                    aria-label={`Remove subject row ${index + 1}`}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <input
                    value={row.name}
                    onChange={(event) =>
                      updateRow(index, "name", event.target.value)
                    }
                    placeholder="Subject name"
                    className="input w-full"
                  />

                  <input
                    value={row.code}
                    onChange={(event) =>
                      updateRow(index, "code", event.target.value)
                    }
                    placeholder="Subject code"
                    className="input w-full"
                  />

                  <select
                    value={row.category}
                    onChange={(event) =>
                      updateRow(index, "category", event.target.value)
                    }
                    className="input w-full"
                  >
                    {categories.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      updateRow(
                        index,
                        "isActive",
                        event.target.value === "active"
                      )
                    }
                    className="input w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={row.isCore}
                    onChange={(event) =>
                      updateRow(index, "isCore", event.target.checked)
                    }
                    className="h-4 w-4 accent-cyan-500"
                  />
                  Core subject
                </label>

                {renderRowClassSelector(index)}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addRow}
            className="btn-secondary inline-flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Row
          </button>

          <button
            type="button"
            onClick={saveAllSubjects}
            disabled={loading || loadingClasses || !classes.length}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? "Processing..." : "Save All Subjects"}
          </button>
        </div>
      </section>

      {/* EXISTING SUBJECTS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Existing Subjects</h2>
          <p className="text-sm text-slate-400">
            Review subjects and update their class assignments without creating duplicates.
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
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Assigned Classes</th>
                  <th className="p-3 text-center">Core</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => {
                  const isEditing =
                    editingSubjectId === subject._id;

                  const assignedIds = getClassIds(subject);

                  const assignedNames = classes
                    .filter((item) =>
                      assignedIds.includes(item.value)
                    )
                    .map((item) => item.label);

                  return (
                    <tr
                      key={subject._id}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="p-3 font-medium">
                        {subject.name}
                      </td>

                      <td className="p-3 text-slate-300">
                        {subject.code || "—"}
                      </td>

                      <td className="p-3 capitalize text-slate-300">
                        {subject.category}
                      </td>

                      <td className="min-w-64 p-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              {classes.map((item) => (
                                <label
                                  key={item.value}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingClassIds.includes(
                                      item.value
                                    )}
                                    onChange={() =>
                                      toggleEditingClass(item.value)
                                    }
                                    className="h-4 w-4 accent-cyan-500"
                                  />

                                  {item.label}
                                </label>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void saveExistingSubjectClasses(
                                    subject._id
                                  )
                                }
                                disabled={savingEdit}
                                className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                              >
                                <Save size={14} />
                                {savingEdit ? "Saving..." : "Save"}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditingClasses}
                                disabled={savingEdit}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedNames.length ? (
                              assignedNames.map((name) => (
                                <span
                                  key={name}
                                  className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200"
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-amber-300">
                                No classes assigned
                              </span>
                            )}
                          </div>
                        )}
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

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-3">
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() =>
                                startEditingClasses(subject)
                              }
                              className="text-cyan-300 hover:text-cyan-200"
                              aria-label={`Edit classes for ${subject.name}`}
                              title="Edit class assignments"
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void deleteSubject(subject._id)
                            }
                            className="text-red-400 hover:text-red-300"
                            aria-label={`Delete ${subject.name}`}
                            title="Delete subject"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

