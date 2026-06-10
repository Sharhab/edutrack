"use client";

import { useEffect, useState } from "react";
import api from "../../../../../lib/axios";
import {
  Upload,
  FileSpreadsheet,
  Eye,
  Database,
  Loader2,
} from "lucide-react";

type ClassOption = {
  _id: string;
  name: string;
};

export default function StudentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  /**
   * LOAD CLASSES (FOR REFERENCE / MAPPING UI)
   */
  async function loadClasses() {
    try {
      const res = await api.get("/classes");
      setClasses(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load classes");
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  /**
   * PREVIEW CSV
   */
  async function handlePreview() {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/students/preview", formData);

      setPreview(res.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to preview file");
    } finally {
      setLoading(false);
    }
  }

  /**
   * IMPORT STUDENTS
   */
  async function handleImport() {
    if (!preview.length) {
      setError("Preview data before importing");
      return;
    }

    try {
      setImporting(true);
      setError("");

      const res = await api.post("/students/import", {
        students: preview,
      });

      const stats = res.data?.data;

      alert(
        `Import completed\n\nCreated: ${stats.created}\nUpdated: ${stats.updated}\nFailed: ${stats.failed}`
      );

      setPreview([]);
      setFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Import Students</h1>
        <p className="text-slate-400 mt-1">
          Upload CSV and automatically map students into classes
        </p>
      </div>

      {/* UPLOAD CARD */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="text-cyan-400" />
          <h2 className="font-semibold text-lg">CSV Upload</h2>
        </div>

        <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-10 cursor-pointer hover:border-cyan-500/50 transition">

          <Upload size={40} className="text-slate-400 mb-3" />

          <span className="font-medium">Click to select CSV file</span>

          <span className="text-sm text-slate-400 mt-1">
            admissionNumber, firstName, lastName, gender, className (NOT classId)
          </span>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {file && (
          <div className="mt-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3">
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">

          <button
            onClick={handlePreview}
            disabled={loading || !file}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye size={16} />
                Preview CSV
              </>
            )}
          </button>

          <button
            onClick={handleImport}
            disabled={importing || preview.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-semibold disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Database size={16} />
                Import Students
              </>
            )}
          </button>

        </div>
      </div>

      {/* PREVIEW TABLE */}
      {preview.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Preview Records</h2>
            <span className="text-sm text-cyan-400">
              {preview.length} rows detected
            </span>
          </div>

          <div className="overflow-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-4">Admission No</th>
                  <th className="text-left p-4">First Name</th>
                  <th className="text-left p-4">Last Name</th>
                  <th className="text-left p-4">Gender</th>
                  <th className="text-left p-4">Class Name</th>
                </tr>
              </thead>

              <tbody>
                {preview.map((student, index) => (
                  <tr key={index} className="border-t border-white/5">

                    <td className="p-4">{student.admissionNumber}</td>
                    <td className="p-4">{student.firstName}</td>
                    <td className="p-4">{student.lastName}</td>
                    <td className="p-4">{student.gender}</td>
                    <td className="p-4">
                      {student.className || "Auto-mapped"}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* CLASS MAPPING INFO PANEL */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="font-semibold mb-2">Class Mapping System</h3>
        <p className="text-sm text-slate-400">
          System will automatically match <span className="text-white">className</span> in CSV to existing classes:
        </p>

        <div className="mt-2 text-xs text-slate-500">
          {classes.slice(0, 5).map((c) => (
            <div key={c._id}>• {c.name}</div>
          ))}
        </div>
      </div>

    </div>
  );
}