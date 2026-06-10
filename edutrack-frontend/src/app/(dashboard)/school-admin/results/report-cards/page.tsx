"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FileText, Loader2, Search } from "lucide-react";

import {
  getSessions,
  getTerms,
  getClassOptions,
} from "../../../../../lib/options";

import api from "../../../../../lib/axios";
import { useReportCard } from "../../../../../hooks/useReportCard";

import type { ReportCardFilter } from "../../../../../types/report-card";

/* =========================================
   TYPES
========================================= */

type OptionItem = {
  _id: string;
  name: string;
};

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
};

/* =========================================
   PAGE
========================================= */

export default function ReportCardsDashboardPage() {
  const router = useRouter();

  const {
    fetchStudentReportCard,
    fetchClassReport,
    fetchClassReportCardsBundle,
    reportCard,
    classReport,
    reportBundle,
    loading,
    classLoading,
    bundleLoading,
    error,
  } = useReportCard();

  /* ================= DATA ================= */

  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [terms, setTerms] = useState<OptionItem[]>([]);
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  /* ================= LOADING ================= */

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);

  /* ================= STATE ================= */

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [search, setSearch] = useState("");

  const [viewMode, setViewMode] = useState<"student" | "class" | "bundle">(
    "student"
  );

  /* =========================================
     LOAD OPTIONS
  ========================================= */

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [s, t, c] = await Promise.all([
          getSessions(),
          getTerms(),
          getClassOptions(),
        ]);

        setSessions(s || []);
        setTerms(t || []);
        setClasses(c || []);
      } catch (err) {
        console.error("Failed loading options", err);
      }
    };

    loadOptions();
  }, []);

  /* =========================================
     LOAD STUDENTS
  ========================================= */

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        setSelectedStudent("");
        return;
      }

      try {
        setLoadingStudents(true);

        const res = await api.get(`/students/class/${selectedClass}`);

        const studentData =
          res?.data?.data ||
          res?.data?.students ||
          res?.data ||
          [];

        setStudents(Array.isArray(studentData) ? studentData : []);
      } catch (err) {
        console.error("Failed loading students", err);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedClass]);

  /* =========================================
     FILTER STUDENTS
  ========================================= */

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;

    return students.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();

      return (
        fullName.includes(search.toLowerCase()) ||
        s.admissionNumber?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [students, search]);

  /* =========================================
     GENERATE REPORT
  ========================================= */

  const handleGenerate = async () => {
    if (generating || loading || classLoading || bundleLoading) return;
    if (!selectedSession || !selectedTerm) return;

    try {
      setGenerating(true);

      const baseParams: ReportCardFilter = {
        sessionId: selectedSession,
        termId: selectedTerm,
        classId: selectedClass,
        studentId: selectedStudent,
      };

      if (viewMode === "student") {
        if (!selectedStudent) return;
        await fetchStudentReportCard(selectedStudent, baseParams);
      }

      if (viewMode === "class") {
        if (!selectedClass) return;
        await fetchClassReport({
          sessionId: selectedSession,
          termId: selectedTerm,
          classId: selectedClass,
        });
      }

      if (viewMode === "bundle") {
        if (!selectedClass) return;
        await fetchClassReportCardsBundle({
          sessionId: selectedSession,
          termId: selectedTerm,
          classId: selectedClass,
        });
      }
    } catch (err) {
      console.error("Generate report failed", err);
    } finally {
      setGenerating(false);
    }
  };

  /* =========================================
     NAVIGATION
  ========================================= */

  const openStudent = (id: string) => {
    router.push(
      `/school-admin/results/report-cards/${id}?sessionId=${selectedSession}&termId=${selectedTerm}`
    );
  };

  const openClass = () => {
    router.push(
      `/school-admin/results/class-reports?classId=${selectedClass}&sessionId=${selectedSession}&termId=${selectedTerm}`
    );
  };

  const openBundle = () => {
    router.push(
      `/school-admin/results/report-cards/bundle?classId=${selectedClass}&sessionId=${selectedSession}&termId=${selectedTerm}`
    );
  };

  /* =========================================
     DATA
  ========================================= */

  const studentReport = reportCard;
  const classReportData = classReport;
  const bundleData = reportBundle;

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Report Card Dashboard
        </h1>
        <p className="text-slate-400">
          Generate student, class and bundle report cards
        </p>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-5">
        <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
          <option value="">Select Session</option>
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
          <option value="">Select Term</option>
          {terms.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={viewMode}
          onChange={(e) =>
            setViewMode(e.target.value as "student" | "class" | "bundle")
          }
        >
          <option value="student">Generate Student Report Card</option>
          <option value="class">Generate Class Report Sheet</option>
          <option value="bundle">Generate Class Report Card Bundle</option>
        </select>

        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            loading ||
            classLoading ||
            bundleLoading ||
            !selectedSession ||
            !selectedTerm ||
            (viewMode === "student" && !selectedStudent) ||
            ((viewMode === "class" || viewMode === "bundle") && !selectedClass)
          }
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-black"
        >
          {generating ? <Loader2 className="animate-spin" /> : <FileText />}
          Generate
        </button>
      </div>

      {/* STUDENT */}
      {studentReport && viewMode === "student" && (
        <div className="rounded-2xl border p-4">
          <h2>Student Preview</h2>
          <p>
            {studentReport.student.firstName} {studentReport.student.lastName}
          </p>
          <button onClick={() => openStudent(studentReport.student._id)}>
            Open Full Report
          </button>
        </div>
      )}

      {/* CLASS */}
      {/* CLASS */}
{classReportData && viewMode === "class" && (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <h2 className="mb-3 font-semibold text-white">
      Class Report Preview
    </h2>

    <p className="text-slate-300">
      Class:
      <span className="ml-2 text-white">
        {classReportData.class?.name}
      </span>
    </p>

    <p className="text-slate-300">
      Total Students:
      <span className="ml-2 text-cyan-400">
        {classReportData.totalStudents}
      </span>
    </p>

    <p className="text-slate-300">
      Generated Reports:
      <span className="ml-2 text-cyan-400">
        {classReportData.reports?.length || 0}
      </span>
    </p>

    <div className="mt-4 space-y-1">
      {classReportData.reports
        ?.slice(0, 5)
        .map((item: any) => (
          <div
            key={item.reportCard.student._id}
            className="text-sm text-slate-300"
          >
            •{" "}
            {item.reportCard.student.firstName}{" "}
            {item.reportCard.student.lastName}
            {" — "}
            {item.reportCard.summary.positionLabel}
          </div>
        ))}
    </div>

    <button
      onClick={openClass}
      className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-black"
    >
      Open Class Report
    </button>
  </div>
)}
      {/* BUNDLE */}
       {bundleData && viewMode === "bundle" && (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <h2 className="mb-3 font-semibold text-white">
      Report Card Bundle
    </h2>

    <p className="text-slate-300">
      Class:
      <span className="ml-2 text-white">
        {bundleData.class?.name}
      </span>
    </p>

    <p className="text-slate-300">
      Total Students:
      <span className="ml-2 text-cyan-400">
        {bundleData.totalStudents}
      </span>
    </p>

    <p className="text-slate-300">
      Generated Reports:
      <span className="ml-2 text-cyan-400">
        {bundleData.reports?.length || 0}
      </span>
    </p>

    <div className="mt-4 space-y-1">
      {bundleData.reports
        ?.slice(0, 5)
        .map((item: any) => (
          <div
            key={item.reportCard.student._id}
            className="text-sm text-slate-300"
          >
            •{" "}
            {item.reportCard.student.firstName}{" "}
            {item.reportCard.student.lastName}
            {" ("}
            {item.reportCard.summary.positionLabel}
            {")"}
          </div>
        ))}
    </div>

    <button
      onClick={openBundle}
      className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-black"
    >
      Open Bundle Viewer
    </button>
  </div>
)}
      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-500 bg-red-500/10 p-3 text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}