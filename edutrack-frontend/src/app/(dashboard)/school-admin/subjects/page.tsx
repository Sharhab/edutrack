"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import api from "../../../../lib/axios";
import { useTenant } from "../../../../components/tenant/TenantProvider";

type Subject = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  isCore?: boolean;
  isActive?: boolean;
  classIds?: string[];
  teacherIds?: string[];
  createdAt?: string;
};

type SubjectRow = {
  name: string;
  code: string;
  category: string;
  isCore: boolean;
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

const emptyRow = (): SubjectRow => ({
  name: "",
  code: "",
  category: "general",
  isCore: false,
});

export default function SubjectsPage() {
  const { tenant } = useTenant();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<SubjectRow>(
    emptyRow()
  );

  const [bulkRows, setBulkRows] = useState<
    SubjectRow[]
  >([
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const themeColor =
    tenant?.themeColor || "#06b6d4";

  /* =========================================
     FETCH SUBJECTS
  ========================================= */

  async function fetchSubjects() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/subjects");

      setSubjects(
        response.data?.data || []
      );
    } catch (err: any) {
      console.error(
        "❌ SUBJECTS FETCH ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load subjects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects();
  }, []);

  /* =========================================
     RESET
  ========================================= */

  function resetMessages() {
    setMessage("");
    setError("");
  }

  function closeAddModal() {
    setShowAddModal(false);
    setForm(emptyRow());
    resetMessages();
  }

  function closeBulkModal() {
    setShowBulkModal(false);
    setBulkRows([
      emptyRow(),
      emptyRow(),
      emptyRow(),
    ]);
    resetMessages();
  }

  /* =========================================
     CREATE SINGLE SUBJECT
  ========================================= */

  async function handleCreateSubject(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Subject name is required."
      );
      return;
    }

    try {
      setSaving(true);
      resetMessages();

      await api.post("/subjects", {
        name: form.name.trim(),
        code: form.code.trim(),
        category: form.category,
        isCore: form.isCore,
        isActive: true,
      });

      setMessage(
        "Subject created successfully."
      );

      await fetchSubjects();

      setTimeout(() => {
        closeAddModal();
      }, 700);
    } catch (err: any) {
      console.error(
        "❌ CREATE SUBJECT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to create subject."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     BULK ROW UPDATE
  ========================================= */

  function updateBulkRow(
    index: number,
    field: keyof SubjectRow,
    value: string | boolean
  ) {
    setBulkRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  /* =========================================
     ADD BULK ROW
  ========================================= */

  function addBulkRow() {
    setBulkRows((current) => [
      ...current,
      emptyRow(),
    ]);
  }

  /* =========================================
     REMOVE BULK ROW
  ========================================= */

  function removeBulkRow(index: number) {
    setBulkRows((current) => {
      if (current.length === 1) {
        return [emptyRow()];
      }

      return current.filter(
        (_, rowIndex) =>
          rowIndex !== index
      );
    });
  }

  /* =========================================
     BULK CREATE
  ========================================= */

  async function handleBulkCreate(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const validRows = bulkRows.filter(
      (row) => row.name.trim()
    );

    if (!validRows.length) {
      setError(
        "Enter at least one subject."
      );
      return;
    }

    try {
      setSaving(true);
      resetMessages();

      const response =
        await api.post(
          "/subjects/bulk",
          {
            subjects:
              validRows.map((row) => ({
                name: row.name.trim(),
                code: row.code.trim(),
                category: row.category,
                isCore: row.isCore,
                isActive: true,
              })),
          }
        );

      const result =
        response.data?.data;

      const created =
        result?.summary?.created || 0;

      const skipped =
        result?.summary?.skipped || 0;

      const failed =
        result?.summary?.failed || 0;

      setMessage(
        `${created} subject${
          created === 1 ? "" : "s"
        } created${
          skipped
            ? `, ${skipped} skipped`
            : ""
        }${
          failed
            ? `, ${failed} failed`
            : ""
        }.`
      );

      await fetchSubjects();

      setTimeout(() => {
        closeBulkModal();
      }, 1200);
    } catch (err: any) {
      console.error(
        "❌ BULK SUBJECT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to create subjects."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DELETE SUBJECT
  ========================================= */

  async function handleDeleteSubject(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this subject?"
      );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

      await api.delete(
        `/subjects/${id}`
      );

      setSubjects((current) =>
        current.filter(
          (subject) =>
            subject._id !== id
        )
      );

      setMessage(
        "Subject deleted successfully."
      );
    } catch (err: any) {
      console.error(
        "❌ DELETE SUBJECT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to delete subject."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================
     CATEGORY LABEL
  ========================================= */

  function getCategoryLabel(
    value?: string
  ) {
    return (
      categories.find(
        (category) =>
          category.value === value
      )?.label ||
      "General"
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  backgroundColor:
                    themeColor,
                }}
              >
                <BookOpen size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Subjects
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage subjects for{" "}
                  {tenant?.schoolName ||
                    "your school"}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setShowBulkModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Plus size={18} />
              Bulk Add
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{
                backgroundColor:
                  themeColor,
              }}
            >
              <Plus size={18} />
              Add Subject
            </button>
          </div>
        </div>

        {/* =====================================
            ALERTS
        ===================================== */}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <Check size={18} />
            {message}
          </div>
        )}

        {error && !showAddModal && !showBulkModal && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =====================================
            SUMMARY CARDS
        ===================================== */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {subjects.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Core Subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                subjects.filter(
                  (subject) =>
                    subject.isCore
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                subjects.filter(
                  (subject) =>
                    subject.isActive !==
                    false
                ).length
              }
            </p>
          </div>
        </div>

        {/* =====================================
            SUBJECT TABLE
        ===================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">
              All Subjects
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Subjects available in your school.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading subjects...
              </div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <BookOpen size={30} />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No subjects yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Create your first subject or
                use bulk add to create multiple
                subjects at once.
              </p>

              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setShowBulkModal(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{
                  backgroundColor:
                    themeColor,
                }}
              >
                <Plus size={18} />
                Add Subjects
              </button>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subject
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Code
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Category
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Type
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {subjects.map(
                      (subject) => (
                        <tr
                          key={subject._id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {subject.name}
                            </div>

                            {subject.description && (
                              <div className="mt-1 max-w-xs truncate text-xs text-slate-400">
                                {
                                  subject.description
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {subject.code ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {getCategoryLabel(
                              subject.category
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {subject.isCore ? (
                              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                Core
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                General
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {subject.isActive !==
                            false ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSubject(
                                  subject._id
                                )
                              }
                              disabled={
                                deletingId ===
                                subject._id
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Delete subject"
                            >
                              {deletingId ===
                              subject._id ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {subjects.map(
                  (subject) => (
                    <div
                      key={subject._id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {subject.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              {subject.code ||
                                "No code"}
                            </span>

                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {getCategoryLabel(
                                subject.category
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSubject(
                              subject._id
                            )
                          }
                          disabled={
                            deletingId ===
                            subject._id
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          {deletingId ===
                          subject._id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        {subject.isCore && (
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                            Core
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            subject.isActive !==
                            false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {subject.isActive !==
                          false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================
          SINGLE SUBJECT MODAL
      ===================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Subject
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new school subject.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubject}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Subject Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Subject Code
                </label>

                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value,
                    })
                  }
                  placeholder="e.g. MATH"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Category
                </label>

                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category:
                          e.target.value,
                      })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category.value
                          }
                          value={
                            category.value
                          }
                        >
                          {category.label}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={form.isCore}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isCore:
                        e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Core Subject
                  </p>

                  <p className="text-xs text-slate-500">
                    Mark this as a core subject.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{
                    backgroundColor:
                      themeColor,
                  }}
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================
          BULK SUBJECT MODAL
      ===================================== */}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Bulk Add Subjects
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create multiple subjects at once.
                </p>
              </div>

              <button
                type="button"
                onClick={closeBulkModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleBulkCreate}
              className="flex max-h-[calc(90vh-90px)] flex-col"
            >
              {error && (
                <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="mx-6 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <div className="flex-1 overflow-auto p-6">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="w-8 px-3 py-3 text-center text-xs font-semibold text-slate-400">
                          #
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Subject Name
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Code
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </th>

                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Core
                        </th>

                        <th className="w-12 px-3 py-3" />
                      </tr>
                    </thead>

                    <tbody>
                      {bulkRows.map(
                        (row, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-3 py-3 text-center text-xs font-semibold text-slate-400">
                              {index + 1}
                            </td>

                            <td className="px-3 py-3">
                              <input
                                value={
                                  row.name
                                }
                                onChange={(e) =>
                                  updateBulkRow(
                                    index,
                                    "name",
                                    e.target
                                      .value
                                  )
                                }
                                placeholder="Mathematics"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                value={
                                  row.code
                                }
                                onChange={(e) =>
                                  updateBulkRow(
                                    index,
                                    "code",
                                    e.target
                                      .value
                                  )
                                }
                                placeholder="MATH"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <select
                                value={
                                  row.category
                                }
                                onChange={(e) =>
                                  updateBulkRow(
                                    index,
                                    "category",
                                    e.target
                                      .value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                              >
                                {categories.map(
                                  (
                                    category
                                  ) => (
                                    <option
                                      key={
                                        category.value
                                      }
                                      value={
                                        category.value
                                      }
                                    >
                                      {
                                        category.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  row.isCore
                                }
                                onChange={(e) =>
                                  updateBulkRow(
                                    index,
                                    "isCore",
                                    e.target
                                      .checked
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300"
                              />
                            </td>

                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeBulkRow(
                                    index
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Remove row"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addBulkRow}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-cyan-400 hover:text-cyan-600"
                >
                  <Plus size={17} />
                  Add Row
                </button>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Empty rows will not be submitted.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeBulkModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{
                      backgroundColor:
                        themeColor,
                    }}
                  >
                    {saving ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    {saving
                      ? "Creating..."
                      : "Create Subjects"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
