"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import api from "../../../../../lib/axios";
import { getClassOptions } from "../../../../../lib/options";

type StudentRow = {
  firstName: string;
  middleName: string;
  lastName: string;
  admissionNumber: string;
  gender: string;
  dateOfBirth: string;
  classId: string;
  entryType: string;
  phone: string;
  status: string;
};

type ClassOption = {
  _id: string;
  name: string;
};

export default function StudentBulkPage() {
const [rows, setRows] = useState<StudentRow[]>([
  {
    firstName: "",
    middleName: "",
    lastName: "",
    admissionNumber: "",
    gender: "male",
    dateOfBirth: "",
    classId: "",
    entryType: "new",
    phone: "",
    status: "active",
  },
]);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");

  /**
   * LOAD CLASSES (SYNCED WITH SYSTEM)
   */
  async function loadOptions() {
    try {
      setLoadingOptions(true);

      const classResults = await getClassOptions();

      setClasses(classResults || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  function addRow() {
    setRows((prev) => [
      ...prev,
     {
  firstName: "",
  middleName: "",
  lastName: "",
  admissionNumber: "",
  gender: "male",
  dateOfBirth: "",
  classId: "",
  entryType: "new",
  phone: "",
  status: "active",
}
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(
    index: number,
    field: keyof StudentRow,
    value: string
  ) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }

  function validate() {
    for (const row of rows) {
      if (!row.firstName.trim()) return "First name is required";
      if (!row.lastName.trim()) return "Last name is required";
      if (!row.admissionNumber.trim()) return "Admission number required";
      if (!row.classId.trim()) return "Class must be selected";
    }
    return "";
  }

  async function saveAll() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    try {
      setLoading(true);
      setError("");

       const payload = rows.map((r) => ({
  firstName: r.firstName,
  middleName: r.middleName,
  lastName: r.lastName,
  admissionNumber: r.admissionNumber,
  gender: r.gender,
  dateOfBirth: r.dateOfBirth || null,
  classId: r.classId,
  entryType: r.entryType,
  phone: r.phone,
  status: r.status,
}));
      const res = await api.post("/students/bulk-upsert", {
        students: payload,
      });

      const stats = res.data.data;

      alert(
        `Created: ${stats.created}\nUpdated: ${stats.updated}\nFailed: ${stats.failed}`
      );

       setRows([
  {
    firstName: "",
    middleName: "",
    lastName: "",
    admissionNumber: "",
    gender: "male",
    dateOfBirth: "",
    classId: "",
    entryType: "new",
    phone: "",
    status: "active",
  },
]);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          Bulk Student Entry
        </h1>
        <p className="text-slate-400">
          Enterprise multi-student creation system
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
  <th className="p-3 text-left">First Name</th>
  <th className="p-3 text-left">Middle</th>
  <th className="p-3 text-left">Last Name</th>
  <th className="p-3 text-left">Admission No</th>
  <th className="p-3 text-left">Gender</th>
  <th className="p-3 text-left">Date of Birth</th>
  <th className="p-3 text-left">Class</th>
  <th className="p-3 text-left">Entry</th>
  <th className="p-3 text-left">Phone</th>
  <th className="p-3 text-left">Status</th>
  <th></th>
</tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="p-2">
                  <input
                    className="input"
                    value={row.firstName}
                    onChange={(e) =>
                      updateRow(i, "firstName", e.target.value)
                    }
                  />
                </td>
                    
                                
                <td className="p-2">
  <input
    className="input"
    value={row.middleName}
    onChange={(e) =>
      updateRow(i, "middleName", e.target.value)
    }
  />
</td>

                <td className="p-2">
                  <input
                    className="input"
                    value={row.lastName}
                    onChange={(e) =>
                      updateRow(i, "lastName", e.target.value)
                    }
                  />
                </td>
    

                <td className="p-2">
                  <input
                    className="input"
                    value={row.admissionNumber}
                    onChange={(e) =>
                      updateRow(i, "admissionNumber", e.target.value)
                    }
                  />
                </td>

                <td className="p-2">
                  <select
                    className="input"
                    value={row.gender}
                    onChange={(e) =>
                      updateRow(i, "gender", e.target.value)
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </td>

                <td className="p-2">
  <input
    type="date"
    className="input"
    value={row.dateOfBirth}
    onChange={(e) =>
      updateRow(i, "dateOfBirth", e.target.value)
    }
  />
</td>

                {/* CLASS SELECT (REAL DATA) */}
                <td className="p-2">
                  <select
                    className="input"
                    value={row.classId}
                    onChange={(e) =>
                      updateRow(i, "classId", e.target.value)
                    }
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading classes..."
                        : "Select Class"}
                    </option>

                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                    <td className="p-2">
  <select
    className="input"
    value={row.entryType}
    onChange={(e) =>
      updateRow(i, "entryType", e.target.value)
    }
  >
    <option value="new">New</option>
    <option value="transfer">Transfer</option>
    <option value="promotion">Promotion</option>
    <option value="reentry">Re-entry</option>
  </select>
</td>

     <td className="p-2">
  <input
    className="input"
    value={row.phone}
    onChange={(e) =>
      updateRow(i, "phone", e.target.value)
    }
  />
</td> 

<td className="p-2">
  <select
    className="input"
    value={row.status}
    onChange={(e) =>
      updateRow(i, "status", e.target.value)
    }
  >
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
    <option value="suspended">Suspended</option>
    <option value="graduated">Graduated</option>
  </select>
</td>

                <td className="p-2 text-center">
                  <button
                    onClick={() => removeRow(i)}
                    className="text-red-400"
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
        <button onClick={addRow} className="btn-secondary">
          <Plus size={16} className="mr-2" />
          Add Row
        </button>

        <button
          onClick={saveAll}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Save All Students"}
        </button>
      </div>
    </div>
  );
}