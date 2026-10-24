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
  const [pasteText, setPasteText] = useState("");
const [pasteMessage, setPasteMessage] = useState("");
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
function normalizeDate(value: string): string {
  const v = value.trim();

  if (!v) return "";

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Convert DD/MM/YYYY or DD-MM-YYYY
  const match = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function pasteStudents() {
  setPasteMessage("");
  setError("");

  const text = pasteText.trim();

  if (!text) {
    setPasteMessage("Please paste student data from Excel first.");
    return;
  }

  const matrix = text
    .split(/\r?\n/)
    .map((line) => line.split("\t").map((cell) => cell.trim()))
    .filter((cells) => cells.some((cell) => cell !== ""));

  if (!matrix.length) {
    setPasteMessage("No student data found.");
    return;
  }

  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const aliases: Record<string, keyof StudentRow> = {
    firstname: "firstName",
    givenname: "firstName",
    first: "firstName",
    middlename: "middleName",
    lastname: "lastName",
    surname: "lastName",
    familyname: "lastName",
    admissionno: "admissionNumber",
    admissionnumber: "admissionNumber",
    admissionid: "admissionNumber",
    studentid: "admissionNumber",
    gender: "gender",
    sex: "gender",
    dob: "dateOfBirth",
    dateofbirth: "dateOfBirth",
    class: "classId",
    classname: "classId",
    entry: "entryType",
    entrytype: "entryType",
    phone: "phone",
    mobile: "phone",
    phonenumber: "phone",
    status: "status",
  };

  // Find a header row by requiring both name columns.
  const headerIndex = matrix.findIndex((cells) => {
    const normalized = cells.map(normalize);
    return (
      normalized.some((value) =>
        ["firstname", "givenname", "first"].includes(value)
      ) &&
      normalized.some((value) =>
        ["lastname", "surname", "familyname"].includes(value)
      )
    );
  });

  let headers: (keyof StudentRow | undefined)[];
  let dataRows: string[][];

  if (headerIndex >= 0) {
    headers = matrix[headerIndex].map(
      (value) => aliases[normalize(value)]
    );
    dataRows = matrix.slice(headerIndex + 1);
  } else {
    setPasteMessage(
      "Could not find a header row containing First Name and Last Name. Copy the column headers together with the student records."
    );
    return;
  }

  const classMap = new Map(
    classes.map((c) => [c.name.trim().toLowerCase(), c._id])
  );

  const imported: StudentRow[] = dataRows
    .filter((cells) => cells.some((cell) => cell !== ""))
    .map((cells) => {
      const row: StudentRow = {
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
      };

      headers.forEach((field, index) => {
        if (!field) return;

        const value = cells[index] || "";

        if (field === "classId") {
          row.classId =
            classes.find((c) => c._id === value)?._id ||
            classMap.get(value.toLowerCase()) ||
            "";
        } else if (field === "dateOfBirth") {
          row.dateOfBirth = normalizeDate(value);
        } else if (field === "gender") {
          const gender = value.toLowerCase();
          row.gender =
            gender === "female" || gender === "f"
              ? "female"
              : "male";
        } else if (field === "entryType") {
          const entry = value.toLowerCase();
          row.entryType = [
            "new",
            "transfer",
            "promotion",
            "reentry",
          ].includes(entry)
            ? entry
            : "new";
        } else if (field === "status") {
          const status = value.toLowerCase();
          row.status = [
            "active",
            "inactive",
            "suspended",
            "graduated",
          ].includes(status)
            ? status
            : "active";
        } else {
          row[field] = value;
        }
      });

      return row;
    });

  if (!imported.length) {
    setPasteMessage("No student records were found below the header.");
    return;
  }

  const invalidRows = imported
    .map((row, index) => ({
      row,
      rowNumber: index + 1,
    }))
    .filter(({ row }) => !row.firstName || !row.lastName);

  if (invalidRows.length) {
    const examples = invalidRows
      .slice(0, 5)
      .map(({ rowNumber }) => rowNumber)
      .join(", ");

    setPasteMessage(
      `${invalidRows.length} row(s) have missing first or last names. Imported data rows: ${examples}${invalidRows.length > 5 ? ", ..." : ""}. Check the Excel column headers and copied columns.`
    );
    return;
  }

  setRows(imported);

  setPasteMessage(
    `${imported.length} student(s) imported into the table. Review class selections and required fields before saving.`
  );

  setPasteText("");
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
     {/* EXCEL COPY AND PASTE */}
<div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 space-y-3">
  <div>
    <h2 className="text-lg font-semibold text-white">
      Import from Excel
    </h2>

    <p className="text-sm text-slate-400">
      Copy student rows from Excel, including the column headers,
      and paste them below.
    </p>
  </div>

  <textarea
    value={pasteText}
    onChange={(e) => setPasteText(e.target.value)}
    placeholder={`First Name\tMiddle Name\tLast Name\tAdmission No\tGender\tDate of Birth\tClass\tEntry\tPhone\tStatus`}
    rows={5}
    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
  />

  {pasteMessage && (
    <p className="text-sm text-cyan-300" role="status">
      {pasteMessage}
    </p>
  )}

  <button
    type="button"
    onClick={pasteStudents}
    disabled={loadingOptions || !pasteText.trim()}
    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
  >
    Add Pasted Students to Table
  </button>

  <p className="text-xs text-slate-400">
    Existing table rows are preserved. Review imported information
    before saving.
  </p>
</div>
      
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
