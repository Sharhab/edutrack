"use client";

import { useEffect, useState } from "react";

import api from "../../../../../lib/axios";
import {
  getSessions,
  getClassOptions,
} from "../../../../../lib/options";
import { getSchoolProfile } from "../../../../../lib/settings";
import type { SchoolProfile } from "../../../../../types/settings";

import CumulativeReportSheet from "../../../../../components/report-cards/CumulativeReportSheet";

type Option = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
};

export default function CumulativeReportPage() {
  const [sessions, setSessions] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolProfile, setSchoolProfile] =
    useState<SchoolProfile | null>(null);

  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================
     LOAD SESSIONS, CLASSES AND SCHOOL PROFILE
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setError("");

      const [sessionsResult, classesResult, profileResult] =
        await Promise.allSettled([
          getSessions(),
          getClassOptions(),
          getSchoolProfile(),
        ]);

      if (cancelled) return;

      if (sessionsResult.status === "fulfilled") {
        const sessionOptions = sessionsResult.value || [];

        setSessions(sessionOptions);

        const currentSession = sessionOptions.find(
          (item: Option) => item.isCurrent
        );

        if (currentSession) {
          setSessionId(currentSession._id);
        }
      } else {
        setError("Unable to load academic sessions.");
      }

      if (classesResult.status === "fulfilled") {
        setClasses(classesResult.value || []);
      } else {
        setError((previous) =>
          previous
            ? `${previous} Unable to load classes.`
            : "Unable to load classes."
        );
      }

      if (profileResult.status === "fulfilled") {
        setSchoolProfile(profileResult.value);
      } else {
        // Branding is optional; the report can still be generated.
        setSchoolProfile(null);
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================
     LOAD STUDENTS WHEN CLASS CHANGES
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setStudents([]);
      setStudentId("");
      setReport(null);

      if (!classId) return;

      try {
        const response = await api.get(
          `/students/class/${classId}`
        );

        if (cancelled) return;

        const payload =
          response.data?.data ||
          response.data?.students ||
          response.data;

        setStudents(
          Array.isArray(payload) ? payload : []
        );
      } catch (err: any) {
        if (!cancelled) {
          setStudents([]);
          setError(
            err?.response?.data?.message ||
              "Unable to load students for this class."
          );
        }
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  /* =========================================
     GENERATE CUMULATIVE REPORT
  ========================================= */

  async function generate() {
    if (!sessionId || !classId || !studentId) {
      setError(
        "Select an academic session, class and student."
      );
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await api.get(
        `/report-cards/student/${studentId}/cumulative`,
        {
          params: { sessionId },
        }
      );

      const generatedReport =
        response.data?.report ||
        response.data?.data?.report;

      if (!generatedReport) {
        throw new Error(
          "The server response did not contain a cumulative report."
        );
      }

      setReport(generatedReport);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to generate cumulative report."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     PAGE UI
  ========================================= */

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Cumulative Report Sheet
        </h1>

        <p className="text-sm text-slate-400">
          Generate a student&apos;s session-wide academic report.
        </p>
      </header>

      <section className="no-print grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
        <label className="text-sm text-slate-300">
          Academic Session

          <select
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setReport(null);
              setError("");
            }}
          >
            <option value="">Select session</option>

            {sessions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Class

          <select
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setReport(null);
              setError("");
            }}
          >
            <option value="">Select class</option>

            {classes.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Student

          <select
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setReport(null);
              setError("");
            }}
          >
            <option value="">Select student</option>

            {students.map((item) => (
              <option key={item._id} value={item._id}>
                {item.firstName} {item.lastName}
                {item.admissionNumber
                  ? ` (${item.admissionNumber})`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={generate}
            disabled={
              loading ||
              !sessionId ||
              !classId ||
              !studentId
            }
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {report && (
        <CumulativeReportSheet
          report={report}
          schoolProfile={schoolProfile}
        />
      )}
    </main>
  );
}
