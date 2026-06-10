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
  parentIds?: string[]; // IMPORTANT
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
  const [studentsMap, setStudentsMap] = useState<Record<number, Student[]>>({});
  const [conflicts, setConflicts] = useState<Record<number, Student[]>>({});

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
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  /* =========================
     FETCH STUDENTS + SAFE LINK CHECK
  ========================= */

  async function loadStudentsForRow(index: number, classIds: string[]) {
    if (!classIds.length) return;

    try {
    
        const res = await api.get("/students", {
  params: {
    classIds: classIds.join(","),
  },
});

      const students: Student[] = res.data.data || [];

      setStudentsMap((prev) => ({
        ...prev,
        [index]: students,
      }));

      // auto select ONLY SAFE students (not already linked)
      const safeStudents = students.filter(
        (s) => !s.parentIds || s.parentIds.length === 0
      );

      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                studentIds: safeStudents.map((s) => s._id),
              }
            : row
        )
      );

      // conflict list (show real owners)
      const blocked = students.filter(
        (s) => s.parentIds && s.parentIds.length > 0
      );

      setConflicts((prev) => ({
        ...prev,
        [index]: blocked,
      }));
    } catch (err) {
      console.error(err);
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
  }

  function updateRow(index: number, field: keyof Row, value: any) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function toggleStudent(index: number, studentId: string) {
   setRows((prev) =>
  prev.map((row, i) =>
    i === index
      ? {
          ...row,
          studentIds: [], // 👈 DO NOT AUTO LINK
        }
      : row
  )
);
  }

  /* =========================
     VALIDATION (STRICT MODE)
  ========================= */

  function validate() {
    for (const row of rows) {
      if (!row.firstName.trim()) return "First name required";
      if (!row.lastName.trim()) return "Last name required";
      if (!row.email.trim()) return "Email required";
      if (!row.phone.trim()) return "Phone required";
      if (!row.password.trim()) return "Password required";
      if (!row.classIds.length) return "Select at least one class";
    }

    // BLOCK IF ANY ROW HAS CONFLICTS
    const hasConflict = Object.values(conflicts).some((c) => c.length > 0);
    if (hasConflict) {
      return "Resolve student-parent conflicts before submitting";
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
      classIds: row.classIds,
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
    if (err) return setError(err);

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
      setError(e?.response?.data?.message || "Bulk import failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================= */

  if (fetching) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="space-y-6 text-white">

      <div>
        <h1 className="text-2xl font-bold">Bulk Parent Entry</h1>
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
              <tr key={i} className="border-t border-white/10">

                <td className="p-2">
                  <input className="input" value={row.firstName}
                    onChange={(e) => updateRow(i, "firstName", e.target.value)} />
                </td>

                <td className="p-2">
                  <input className="input" value={row.lastName}
                    onChange={(e) => updateRow(i, "lastName", e.target.value)} />
                </td>

                <td className="p-2">
                  <input className="input" value={row.email}
                    onChange={(e) => updateRow(i, "email", e.target.value)} />
                </td>
                 <td className="p-2">
  <input
    className="input w-full"
    type="tel"
    inputMode="tel"
    placeholder="+234..."
    value={row.phone}
    onChange={(e) => updateRow(i, "phone", e.target.value)}
  />
</td>
                <td className="p-2">
                  <input className="input" type="password"
                    value={row.password}
                    onChange={(e) => updateRow(i, "password", e.target.value)} />
                </td>

               {/* CLASSES (SELECT INSTEAD OF BUTTONS) */}
<td className="p-2">
  <select
    className="input w-full"
    value={row.classIds[0] || ""}
    onChange={async (e) => {
      const classId = e.target.value;

      const updated = classId ? [classId] : [];

      updateRow(i, "classIds", updated);

      if (classId) {
        await loadStudentsForRow(i, updated);
      } else {
        setStudentsMap((prev) => ({ ...prev, [i]: [] }));
        setConflicts((prev) => ({ ...prev, [i]: [] }));
        updateRow(i, "studentIds", []);
      }
    }}
  >
    <option value="">Select Class</option>

    {classes.map((c) => (
      <option key={c._id} value={c._id}>
        {c.name}
      </option>
    ))}
  </select>
</td>

                {/* STUDENTS */}
                <td className="p-2">
                  {conflicts[i]?.length > 0 && (
                    <div className="text-red-300 text-xs mb-1">
                      ⚠ {conflicts[i].length} already linked
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {(studentsMap[i] || []).map((s) => {
                      const blocked = s.parentIds && s.parentIds.length > 0;

                      return (
                        <button
                          key={s._id}
                          disabled={blocked}
                          onClick={() => toggleStudent(i, s._id)}
                          className={`text-xs px-2 py-1 rounded border ${
                            blocked
                              ? "opacity-40 cursor-not-allowed"
                              : row.studentIds.includes(s._id)
                              ? "bg-cyan-500/20 border-cyan-400"
                              : "border-white/10"
                          }`}
                        >
                          {s.firstName}
                        </button>
                      );
                    })}
                  </div>
                </td>

                <td className="p-2">
                  <button onClick={() => removeRow(i)} className="text-red-400">
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
        <button onClick={addRow} className="btn-secondary">
          <Plus size={16} className="mr-2" />
          Add Row
        </button>

        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex gap-2 items-center">
              <Loader2 className="animate-spin" size={16} />
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