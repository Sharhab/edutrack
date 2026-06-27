"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import api from "../../../../../lib/axios";
import {
  getClassOptions,
  getSubjectOptions,
} from "../../../../../lib/options";
/* =========================
   TYPES (WITH PASSWORD)
========================= */

type Row = {
  firstName: string;
  middleName: string;
  lastName: string;

  email: string;
  phone: string;

  employeeId: string;
  qualification: string;

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
  designation: string;

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

/* =========================
   COMPONENT
========================= */

export default function TeacherBulkEntryPage() {
  const [rows, setRows] = useState<Row[]>([
    {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "male",
  dateOfBirth: "",
  maritalStatus: "",
  email: "",
  phone: "",
  address: "",
  employeeId: "",
  qualification: "",
  designation: "",
  employmentDate: "",
  employmentType: "full_time",
  stateOfOrigin: "",
  lga: "",
  nationality: "Nigerian",
  bloodGroup: "",
  genotype: "",
  emergencyName: "",
  emergencyPhone: "",
  nin: "",
  subjectIds: [],
  classIds: [],

  isActive: true,
  status: "active",
  password: "",


    },
  ]);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD OPTIONS
  ========================= */

  async function loadOptions() {
    try {
      setFetching(true);

      const [classRes, subjectRes] = await Promise.all([
        getClassOptions(),
        getSubjectOptions(),
      ]);

      setClasses(classRes || []);
      setSubjects(subjectRes || []);
    } catch (err) {
      console.error("Failed to load options", err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  /* =========================
     ROW ACTIONS
  ========================= */

  function addRow() {
  setRows((prev) => [
    ...prev,
    {
      // PERSONAL
      firstName: "",
      middleName: "",
      lastName: "",

      gender: "male",
      dateOfBirth: "",
      maritalStatus: "",

      // CONTACT
      email: "",
      phone: "",
      address: "",

      // EMPLOYMENT
      employeeId: "",
      qualification: "",
      designation: "",

      employmentDate: "",
      employmentType: "full_time",

      // LOCATION
      stateOfOrigin: "",
      lga: "",
      nationality: "Nigerian",

      // HEALTH
      bloodGroup: "",
      genotype: "",

      // EMERGENCY
      emergencyName: "",
      emergencyPhone: "",

      // IDENTIFICATION
      nin: "",

      // ASSIGNMENTS
      subjectIds: [],
      classIds: [],

      // ACCOUNT
      isActive: true,
      status: "active",

      password: "",
    },
  ]);
}
  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof Row, value: any) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }

  function toggleMultiSelect(
    index: number,
    field: "classIds" | "subjectIds",
    value: string
  ) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const exists = row[field].includes(value);

        return {
          ...row,
          [field]: exists
            ? row[field].filter((id) => id !== value)
            : [...row[field], value],
        };
      })
    );
  }

  /* =========================
     VALIDATION
  ========================= */

  function validate() {
    for (const row of rows) {
      if (!row.firstName.trim()) return "First name required";
      if (!row.lastName.trim()) return "Last name required";
      if (!row.email.trim()) return "Email required";
      if (!row.employeeId.trim()) return "Employee ID required";
      if (!row.password.trim()) return "Password required";

      if (!row.subjectIds.length) return "Select at least one subject";
      if (!row.classIds.length) return "Select at least one class";
    }
    return "";
  }

  /* =========================
     CLEAN PAYLOAD
  ========================= */

 function cleanRow(row: Row) {
  return {
    firstName: row.firstName.trim(),
    middleName: row.middleName.trim(),
    lastName: row.lastName.trim(),

    email: row.email.trim(),
    phone: row.phone.trim(),

    employeeId: row.employeeId.trim(),
    qualification: row.qualification.trim(),

    subjectIds: row.subjectIds,
    classIds: row.classIds,

    gender: row.gender,

    address: row.address.trim(),

    dateOfBirth: row.dateOfBirth || null,
    maritalStatus: row.maritalStatus,

    stateOfOrigin: row.stateOfOrigin.trim(),
    lga: row.lga.trim(),
    nationality: row.nationality,

    employmentDate:
      row.employmentDate || null,

    employmentType:
      row.employmentType,

    designation:
      row.designation.trim(),

    emergencyName:
      row.emergencyName.trim(),

    emergencyPhone:
      row.emergencyPhone.trim(),

    bloodGroup:
      row.bloodGroup,

    genotype:
      row.genotype,

    nin:
      row.nin.trim(),

    isActive: row.isActive,
    status: row.status,

    password: row.password.trim(),
  };
}

  /* =========================
     SAVE BULK
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

      const payload = {
        rows: rows.map(cleanRow),
      };

      const res = await api.post("/teachers/bulk", payload);

      alert(
        `Created: ${res.data.data.created}\nUpdated: ${res.data.data.updated}\nFailed: ${res.data.data.failed}`
      );

      setRows([
  {
    // PERSONAL
    firstName: "",
    middleName: "",
    lastName: "",

    gender: "male",
    dateOfBirth: "",

    maritalStatus: "",

    // CONTACT
    email: "",
    phone: "",
    address: "",

    // EMPLOYMENT
    employeeId: "",
    qualification: "",
    designation: "",

    employmentDate: "",
    employmentType: "full_time",

    // LOCATION
    stateOfOrigin: "",
    lga: "",
    nationality: "Nigerian",

    // HEALTH
    bloodGroup: "",
    genotype: "",

    // EMERGENCY
    emergencyName: "",
    emergencyPhone: "",

    // IDENTIFICATION
    nin: "",

    // ASSIGNMENTS
    subjectIds: [],
    classIds: [],

    // ACCOUNT
    isActive: true,
    status: "active",

    password: "",
  },
]);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Bulk import failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (fetching) {
    return <div className="p-6 text-white">Loading options...</div>;
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-bold">Bulk Teacher Entry</h1>
        <p className="text-slate-400">
          Add multiple teachers with password, subjects & classes
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
         <thead className="bg-white/5">
  <tr>
    <th className="p-2">First</th>
    <th className="p-2">Middle</th>
    <th className="p-2">Last</th>
    <th className="p-2">Email</th>
    <th className="p-2">Phone</th>
    <th className="p-2">Employee ID</th>
    <th className="p-2">Password</th>
    <th className="p-2">Designation</th>
    <th className="p-2">DOB</th>
    <th className="p-2">State</th>
    <th className="p-2">Subjects</th>
    <th className="p-2">Classes</th>
    <th className="p-2">Status</th>
    <th className="p-2 text-center">Action</th>
  </tr>
</thead>

          <tbody>
  {rows.map((row, i) => (
    <tr
      key={i}
      className="border-t border-white/10"
    >
      {/* FIRST */}
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

      {/* MIDDLE */}
      <td className="p-2">
        <input
          className="input"
          value={row.middleName}
          onChange={(e) =>
            updateRow(
              i,
              "middleName",
              e.target.value
            )
          }
        />
      </td>

      {/* LAST */}
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
          type="email"
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
          className="input"
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

      {/* EMPLOYEE ID */}
      <td className="p-2">
        <input
          className="input"
          value={row.employeeId}
          onChange={(e) =>
            updateRow(
              i,
              "employeeId",
              e.target.value
            )
          }
        />
      </td>

      {/* QUALIFICATION */}
      <td className="p-2">
        <input
          className="input"
          value={row.qualification}
          onChange={(e) =>
            updateRow(
              i,
              "qualification",
              e.target.value
            )
          }
        />
      </td>

      {/* DESIGNATION */}
      <td className="p-2">
        <input
          className="input"
          value={row.designation}
          onChange={(e) =>
            updateRow(
              i,
              "designation",
              e.target.value
            )
          }
        />
      </td>

      {/* GENDER */}
      <td className="p-2">
        <select
          className="input"
          value={row.gender}
          onChange={(e) =>
            updateRow(
              i,
              "gender",
              e.target.value
            )
          }
        >
          <option value="male">
            Male
          </option>
          <option value="female">
            Female
          </option>
        </select>
      </td>

      {/* DOB */}
      <td className="p-2">
        <input
          className="input"
          type="date"
          value={row.dateOfBirth}
          onChange={(e) =>
            updateRow(
              i,
              "dateOfBirth",
              e.target.value
            )
          }
        />
      </td>

      {/* STATE */}
      <td className="p-2">
        <input
          className="input"
          value={row.stateOfOrigin}
          onChange={(e) =>
            updateRow(
              i,
              "stateOfOrigin",
              e.target.value
            )
          }
        />
      </td>

      {/* SUBJECTS */}
      <td className="p-2 min-w-[220px]">
        <div className="flex flex-wrap gap-1">
          {subjects.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() =>
                toggleMultiSelect(
                  i,
                  "subjectIds",
                  s._id
                )
              }
              className={`text-xs px-2 py-1 rounded-lg border ${
                row.subjectIds.includes(
                  s._id
                )
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                  : "border-white/10 text-slate-300"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </td>

      {/* CLASSES */}
      <td className="p-2 min-w-[220px]">
        <div className="flex flex-wrap gap-1">
          {classes.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() =>
                toggleMultiSelect(
                  i,
                  "classIds",
                  c._id
                )
              }
              className={`text-xs px-2 py-1 rounded-lg border ${
                row.classIds.includes(
                  c._id
                )
                  ? "bg-purple-500/20 border-purple-400 text-purple-300"
                  : "border-white/10 text-slate-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </td>

      {/* STATUS */}
      <td className="p-2">
        <select
          className="input"
          value={row.status}
          onChange={(e) =>
            updateRow(
              i,
              "status",
              e.target.value
            )
          }
        >
          <option value="active">
            Active
          </option>
          <option value="inactive">
            Inactive
          </option>
        </select>
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

      {/* DELETE */}
      <td className="p-2 text-center">
        <button
          type="button"
          onClick={() =>
            removeRow(i)
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

      <div className="flex gap-3">
        <button onClick={addRow} className="btn-secondary">
          <Plus size={16} className="mr-2" />
          Add Row
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Teachers"
          )}
        </button>
      </div>
    </div>
  );
}