"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import api from "../../../../../lib/axios";
import { getClassOptions } from "../../../../../lib/options";

/* =========================
   TYPES
========================= */

type ClassOption = {
  _id: string;
  name: string;
};

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  classId?: string;
  parentIds?: string[];
};

type Row = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  classIds: string[];
  studentIds: string[];
  isActive: boolean;
  password: string;
};

/* =========================
   COMPONENT
========================= */

export default function ParentBulkEntryPage() {
  const [rows, setRows] = useState<Row[]>([
    {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      occupation: "",
      address: "",
      classIds: [],
      studentIds: [],
      isActive: true,
      password: "",
    },
  ]);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [studentsMap, setStudentsMap] = useState<
    Record<number, Student[]>
  >({});
  const [conflicts, setConflicts] = useState<
    Record<number, Student[]>
  >({});

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD CLASSES
  ========================= */

  async function loadOptions() {
    try {
      setFetching(true);

      const res = await getClassOptions();

      setClasses(res || []);
    } catch (err) {
      console.error("Failed to load classes:", err);
      setError("Failed to load classes");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  /* =========================
     FETCH STUDENTS + CONFLICT CHECK
  ========================= */

  async function loadStudentsForRow(
    index: number,
    classIds: string[]
  ) {
    if (!classIds.length) {
      setStudentsMap((prev) => ({
        ...prev,
        [index]: [],
      }));

      setConflicts((prev) => ({
        ...prev,
        [index]: [],
      }));

      return;
    }

    try {
      const res = await api.get("/students", {
        params: {
          classIds: classIds.join(","),
        },
      });

      const students: Student[] = res.data.data || [];

      /*
       * Store all students for this row.
       * Nothing is automatically selected.
       */
      setStudentsMap((prev) => ({
        ...prev,
        [index]: students,
      }));

      /*
       * Block students that already have a parent.
       *
       * This is informational and prevents selecting them.
       * It must NOT block the entire parent submission.
       */
      const blocked = students.filter(
        (s) => s.parentIds && s.parentIds.length > 0
      );

      setConflicts((prev) => ({
        ...prev,
        [index]: blocked,
      }));
    } catch (err) {
      console.error("Failed to load students:", err);

      setStudentsMap((prev) => ({
        ...prev,
        [index]: [],
      }));

      setConflicts((prev) => ({
        ...prev,
        [index]: [],
      }));

      setError("Failed to load students for the selected class");
    }
  }

  /* =========================
     ROW ACTIONS
  ========================= */

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        occupation: "",
        address: "",
        classIds: [],
        studentIds: [],
        isActive: true,
        password: "",
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));

    /*
     * Rebuild row-indexed maps so removing a row
     * does not leave stale student/conflict data.
     */
    setStudentsMap((prev) => {
      const next: Record<number, Student[]> = {};

      Object.entries(prev).forEach(([key, value]) => {
        const oldIndex = Number(key);

        if (oldIndex < index) {
          next[oldIndex] = value;
        } else if (oldIndex > index) {
          next[oldIndex - 1] = value;
        }
      });

      return next;
    });

    setConflicts((prev) => {
      const next: Record<number, Student[]> = {};

      Object.entries(prev).forEach(([key, value]) => {
        const oldIndex = Number(key);

        if (oldIndex < index) {
          next[oldIndex] = value;
        } else if (oldIndex > index) {
          next[oldIndex - 1] = value;
        }
      });

      return next;
    });
  }

  function updateRow(
    index: number,
    field: keyof Row,
    value: any
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

  /* =========================
     STUDENT SELECTION
  ========================= */

  function toggleStudent(
    index: number,
    studentId: string
  ) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const alreadySelected =
          row.studentIds.includes(studentId);

        return {
          ...row,
          studentIds: alreadySelected
            ? row.studentIds.filter(
                (id) => id !== studentId
              )
            : [...row.studentIds, studentId],
        };
      })
    );
  }

  /* =========================
     VALIDATION (STRICT MODE)
  ========================= */

  function validate() {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.firstName.trim()) {
        return `Row ${i + 1}: First name required`;
      }

      if (!row.lastName.trim()) {
        return `Row ${i + 1}: Last name required`;
      }

      if (!row.email.trim()) {
        return `Row ${i + 1}: Email required`;
      }

      if (!row.phone.trim()) {
        return `Row ${i + 1}: Phone required`;
      }

      if (!row.password.trim()) {
        return `Row ${i + 1}: Password required`;
      }

      if (!row.classIds.length) {
        return `Row ${i + 1}: Select at least one class`;
      }

      if (!row.studentIds.length) {
        return `Row ${i + 1}: Select at least one student`;
      }

      /*
       * IMPORTANT:
       *
       * Having blocked students in the student list
       * is NOT a submission conflict.
       *
       * They are already disabled in the UI.
       *
       * We only reject the row if a selected student
       * is actually present in the blocked list.
       */
      const blockedStudents = conflicts[i] || [];

      const blockedIds = new Set(
        blockedStudents.map((student) => student._id)
      );

      const selectedBlockedStudent =
        row.studentIds.find((studentId) =>
          blockedIds.has(studentId)
        );

      if (selectedBlockedStudent) {
        return `Row ${
          i + 1
        }: One of the selected students is already linked to another parent`;
      }
    }

    return "";
  }

  /* =========================
     CLEAN PAYLOAD
  ========================= */

  function cleanRow(row: Row) {
    return {
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      email: row.email.trim(),
      phone: row.phone.trim(),
      occupation: row.occupation.trim(),
      address: row.address.trim(),

      /*
       * Only selected class IDs are submitted.
       */
      classIds: row.classIds,

      /*
       * Only manually selected student IDs
       * are submitted.
       */
      studentIds: row.studentIds,

      isActive: row.isActive,
      password: row.password.trim(),
    };
  }

  /* =========================
     SAVE
  ========================= */

  async function handleSave() {
    const err = validate();

    if (err) {
      setError(err);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/parents/bulk", {
        rows: rows.map(cleanRow),
      });

      alert(
        `Created: ${res.data.data.created}
Updated: ${res.data.data.updated}
Failed: ${res.data.data.failed}`
      );

      /*
       * Reset after successful submission.
       */
      setRows([
        {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          occupation: "",
          address: "",
          classIds: [],
          studentIds: [],
          isActive: true,
          password: "",
        },
      ]);

      setConflicts({});
      setStudentsMap({});
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          "Bulk import failed"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================= */

  if (fetching) {
    return (
      <div className="p-6 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      <div>
        <h1 className="text-2xl font-bold">
          Bulk Parent Entry
        </h1>

        <p className="text-slate-400">
          Enterprise-safe linking with conflict protection
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-white/10 rounded-2xl">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3">First</th>
              <th className="p-3">Last</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Password</th>
              <th className="p-3">Classes</th>
              <th className="p-3">Students</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-t border-white/10"
              >

                {/* FIRST NAME */}
                <td className="p-2">
                  <input
                    className="input"
                    value={row.firstName}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "firstName",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* LAST NAME */}
                <td className="p-2">
                  <input
                    className="input"
                    value={row.lastName}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "lastName",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* EMAIL */}
                <td className="p-2">
                  <input
                    className="input"
                    value={row.email}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "email",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* PHONE */}
                <td className="p-2">
                  <input
                    className="input w-full"
                    type="tel"
                    inputMode="tel"
                    placeholder="+234..."
                    value={row.phone}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "phone",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* PASSWORD */}
                <td className="p-2">
                  <input
                    className="input"
                    type="password"
                    value={row.password}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "password",
                        e.target.value
                      )
                    }
                  />
                </td>

                {/* CLASSES */}
                <td className="p-2">
                  <select
                    className="input w-full"
                    value={row.classIds[0] || ""}
                    onChange={async (e) => {
                      const classId =
                        e.target.value;

                      const updated = classId
                        ? [classId]
                        : [];

                      /*
                       * When changing class, immediately
                       * clear previously selected students.
                       *
                       * This prevents students from the
                       * previous class being submitted.
                       */
                      updateRow(
                        i,
                        "classIds",
                        updated
                      );

                      updateRow(
                        i,
                        "studentIds",
                        []
                      );

                      /*
                       * Clear old student/conflict data
                       * before loading the new class.
                       */
                      setStudentsMap((prev) => ({
                        ...prev,
                        [i]: [],
                      }));

                      setConflicts((prev) => ({
                        ...prev,
                        [i]: [],
                      }));

                      if (classId) {
                        await loadStudentsForRow(
                          i,
                          updated
                        );
                      }
                    }}
                  >
                    <option value="">
                      Select Class
                    </option>

                    {classes.map((c) => (
                      <option
                        key={c._id}
                        value={c._id}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* STUDENTS */}
                <td className="p-2">
                  {conflicts[i]?.length > 0 && (
                    <div className="text-amber-300 text-xs mb-1">
                      ⚠ {conflicts[i].length} already
                      linked and unavailable
                    </div>
                  )}

                  {!row.classIds.length && (
                    <div className="text-slate-500 text-xs">
                      Select a class first
                    </div>
                  )}

                  {row.classIds.length > 0 &&
                    studentsMap[i]?.length === 0 && (
                      <div className="text-slate-500 text-xs">
                        No students found
                      </div>
                    )}

                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {(studentsMap[i] || []).map(
                      (s) => {
                        const blocked =
                          !!s.parentIds &&
                          s.parentIds.length > 0;

                        const selected =
                          row.studentIds.includes(
                            s._id
                          );

                        return (
                          <button
                            type="button"
                            key={s._id}
                            disabled={blocked}
                            onClick={() =>
                              toggleStudent(
                                i,
                                s._id
                              )
                            }
                            title={
                              blocked
                                ? "Already linked to a parent"
                                : selected
                                ? "Click to remove"
                                : "Click to select"
                            }
                            className={`text-xs px-2 py-1 rounded border ${
                              blocked
                                ? "opacity-40 cursor-not-allowed border-red-500/30"
                                : selected
                                ? "bg-cyan-500/20 border-cyan-400"
                                : "border-white/10 hover:border-cyan-400/50"
                            }`}
                          >
                            {s.firstName}
                            {s.lastName
                              ? ` ${s.lastName}`
                              : ""}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {row.studentIds.length > 0 && (
                    <div className="text-cyan-300 text-xs mt-1">
                      {row.studentIds.length} student
                      {row.studentIds.length !== 1
                        ? "s"
                        : ""}{" "}
                      selected
                    </div>
                  )}
                </td>

                {/* DELETE */}
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() =>
                      removeRow(i)
                    }
                    className="text-red-400"
                    disabled={rows.length === 1}
                    title={
                      rows.length === 1
                        ? "At least one row is required"
                        : "Remove row"
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={addRow}
          className="btn-secondary"
        >
          <Plus size={16} className="mr-2" />
          Add Row
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex gap-2 items-center">
              <Loader2
                className="animate-spin"
                size={16}
              />
              Saving...
            </span>
          ) : (
            "Save Parents"
          )}
        </button>
      </div>
    </div>
  );
}
