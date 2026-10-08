"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";

import api from "../../../../../lib/axios";

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

export default function SubjectsPage() {
  const [rows, setRows] = useState<SubjectRow[]>([
    { ...emptyRow },
  ]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState("");

  // ==============================
  // LOAD SUBJECTS
  // ==============================

  async function loadSubjects() {
    try {
      setLoadingSubjects(true);
      setError("");

      const res = await api.get("/subjects");

      const data = res?.data?.data;

      if (Array.isArray(data)) {
        setSubjects(data);
      } else if (Array.isArray(data?.subjects)) {
        setSubjects(data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (err: any) {
      console.error("Failed to load subjects", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load subjects"
      );
    } finally {
      setLoadingSubjects(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  // ==============================
  // ROW MANAGEMENT
  // ==============================

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        ...emptyRow,
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length === 1) {
        return [
          {
            ...emptyRow,
          },
        ];
      }

      return prev.filter((_, i) => i !== index);
    });
  }

  function updateRow(
    index: number,
    field: keyof SubjectRow,
    value: string | boolean
  ) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  // ==============================
  // VALIDATION
  // ==============================

  function validate() {
    for (const row of rows) {
      if (!row.name.trim()) {
        return "Subject name is required";
      }
    }

    return "";
  }

  // ==============================
  // SAVE BULK SUBJECTS
  // ==============================

  async function saveAllSubjects() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = rows.map((row) => ({
        name: row.name.trim(),
        code: row.code.trim(),
        category: row.category,
        isCore: row.isCore,
        isActive: row.isActive,
      }));

      const res = await api.post("/subjects/bulk", {
        subjects: payload,
      });

      const stats = res?.data?.data;

      alert(
        `Created: ${stats?.created ?? 0}\n` +
          `Skipped: ${stats?.skipped ?? 0}\n` +
          `Failed: ${stats?.failed ?? 0}`
      );

      setRows([
        {
          ...emptyRow,
        },
      ]);

      await loadSubjects();
    } catch (err: any) {
      console.error("Bulk subject creation failed", err);

      setError(
        err?.response?.data?.message ||
          "Subject import failed"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // SINGLE SUBJECT
  // ==============================

  async function addSingleSubject() {
    const row = rows[0];

    if (!row.name.trim()) {
      setError("Subject name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/subjects", {
        name: row.name.trim(),
        code: row.code.trim(),
        category: row.category,
        isCore: row.isCore,
        isActive: row.isActive,
      });

      alert("Subject created successfully");

      setRows([
        {
          ...emptyRow,
        },
      ]);

      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to create subject", err);

      setError(
        err?.response?.data?.message ||
          "Failed to create subject"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // DELETE SUBJECT
  // ==============================

  async function deleteSubject(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/subjects/${id}`);

      await loadSubjects();
    } catch (err: any) {
      console.error("Failed to delete subject", err);

      setError(
        err?.response?.data?.message ||
          "Failed to delete subject"
      );
    }
  }

  return (
    <div className="space-y-6 text-white">

      {/* ==============================
          HEADER
      ============================== */}

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <BookOpen size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            Subjects
          </h1>

          <p className="text-slate-400">
            Enterprise subject management system
          </p>
        </div>
      </div>

      {/* ==============================
          ERROR
      ============================== */}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300">
          {error}
        </div>
      )}

      {/* ==============================
          SINGLE SUBJECT
      ============================== */}

      <div className="rounded-2xl border border-white/10 p-5">

        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Add Subject
          </h2>

          <p className="text-sm text-slate-400">
            Create one subject manually
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* SUBJECT NAME */}

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Subject Name
            </label>

            <input
              type="text"
              value={rows[0].name}
              onChange={(e) =>
                updateRow(
                  0,
                  "name",
                  e.target.value
                )
              }
              placeholder="e.g. Mathematics"
              className="input w-full"
            />
          </div>

          {/* CODE */}

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Subject Code
            </label>

            <input
              type="text"
              value={rows[0].code}
              onChange={(e) =>
                updateRow(
                  0,
                  "code",
                  e.target.value
                )
              }
              placeholder="e.g. MTH"
              className="input w-full"
            />
          </div>

          {/* CATEGORY */}

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Category
            </label>

            <select
              value={rows[0].category}
              onChange={(e) =>
                updateRow(
                  0,
                  "category",
                  e.target.value
                )
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

          {/* STATUS */}

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Status
            </label>

            <select
              value={
                rows[0].isActive
                  ? "active"
                  : "inactive"
              }
              onChange={(e) =>
                updateRow(
                  0,
                  "isActive",
                  e.target.value === "active"
                )
              }
              className="input w-full"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {/* CORE SUBJECT */}

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={rows[0].isCore}
            onChange={(e) =>
              updateRow(
                0,
                "isCore",
                e.target.checked
              )
            }
            className="h-4 w-4"
          />

          <span className="text-sm text-slate-300">
            This is a core subject
          </span>
        </div>

        {/* ADD BUTTON */}

        <div className="mt-5">
          <button
            onClick={addSingleSubject}
            disabled={loading}
            className="btn-primary"
          >
            {loading
              ? "Processing..."
              : "Add Subject"}
          </button>
        </div>
      </div>

      {/* ==============================
          BULK SUBJECT ENTRY
      ============================== */}

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Bulk Subject Entry
          </h2>

          <p className="text-sm text-slate-400">
            Add multiple subjects at once
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left">
                  Subject Name
                </th>

                <th className="p-3 text-left">
                  Code
                </th>

                <th className="p-3 text-left">
                  Category
                </th>

                <th className="p-3 text-center">
                  Core
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

                <th className="p-3 text-center">
                </th>
              </tr>
            </thead>

            <tbody>

              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-white/10"
                >

                  {/* NAME */}

                  <td className="p-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Mathematics"
                      className="input w-full"
                    />
                  </td>

                  {/* CODE */}

                  <td className="p-2">
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "code",
                          e.target.value
                        )
                      }
                      placeholder="MTH"
                      className="input w-full"
                    />
                  </td>

                  {/* CATEGORY */}

                  <td className="p-2">
                    <select
                      value={row.category}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "category",
                          e.target.value
                        )
                      }
                      className="input w-full"
                    >
                      {categories.map(
                        (category) => (
                          <option
                            key={category.value}
                            value={
                              category.value
                            }
                          >
                            {category.label}
                          </option>
                        )
                      )}
                    </select>
                  </td>

                  {/* CORE */}

                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.isCore}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "isCore",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />
                  </td>

                  {/* STATUS */}

                  <td className="p-2">
                    <select
                      value={
                        row.isActive
                          ? "active"
                          : "inactive"
                      }
                      onChange={(e) =>
                        updateRow(
                          index,
                          "isActive",
                          e.target.value ===
                            "active"
                        )
                      }
                      className="input w-full"
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>
                    </select>
                  </td>

                  {/* DELETE ROW */}

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        removeRow(index)
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* BULK ACTIONS */}

        <div className="mt-4 flex gap-3">

          <button
            type="button"
            onClick={addRow}
            className="btn-secondary"
          >
            <Plus
              size={16}
              className="mr-2"
            />

            Add Row
          </button>

          <button
            type="button"
            onClick={saveAllSubjects}
            disabled={loading}
            className="btn-primary"
          >
            {loading
              ? "Processing..."
              : "Save All Subjects"}
          </button>

        </div>
      </div>

      {/* ==============================
          EXISTING SUBJECTS
      ============================== */}

      <div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Existing Subjects
          </h2>

          <p className="text-sm text-slate-400">
            Subjects currently configured for this school
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-x-auto">

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
                  <th className="p-3 text-left">
                    Subject
                  </th>

                  <th className="p-3 text-left">
                    Code
                  </th>

                  <th className="p-3 text-left">
                    Category
                  </th>

                  <th className="p-3 text-center">
                    Core
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>

                  <th className="p-3 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {subjects.map((subject) => (
                  <tr
                    key={subject._id}
                    className="border-t border-white/10"
                  >

                    <td className="p-3">
                      {subject.name}
                    </td>

                    <td className="p-3 text-slate-300">
                      {subject.code || "—"}
                    </td>

                    <td className="p-3 capitalize text-slate-300">
                      {subject.category}
                    </td>

                    <td className="p-3 text-center">
                      {subject.isCore ? (
                        <span className="text-green-400">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          No
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {subject.isActive ? (
                        <span className="text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-red-400">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          deleteSubject(
                            subject._id
                          )
                        }
                        className="text-red-400 hover:text-red-300"
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
      </div>

    </div>
  );
}
