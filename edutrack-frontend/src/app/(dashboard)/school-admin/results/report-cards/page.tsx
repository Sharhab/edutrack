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

type ReportStudent = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  admissionNumber?: string;
};

type ReportSummary = {
  positionLabel?: string;
  position?: number;
  totalStudents?: number;
};

type ReportItem = {
  reportCard?: {
    student?: ReportStudent;
    summary?: ReportSummary;
  };

  student?: ReportStudent;
  summary?: ReportSummary;
};

/* =========================================
   HELPER
========================================= */

/**
 * Your backend currently returns raw report cards:
 *
 * {
 *   student: {...},
 *   summary: {...}
 * }
 *
 * Older frontend/API shape may return:
 *
 * {
 *   reportCard: {
 *     student: {...},
 *     summary: {...}
 *   }
 * }
 *
 * This helper supports both.
 */
function normalizeReportItem(item: ReportItem | null | undefined) {
  if (!item) {
    return {
      student: undefined,
      summary: undefined,
    };
  }

  if (item.reportCard) {
    return {
      student: item.reportCard.student,
      summary: item.reportCard.summary,
    };
  }

  return {
    student: item.student,
    summary: item.summary,
  };
}

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

  const [viewMode, setViewMode] = useState<
    "student" | "class" | "bundle"
  >("student");

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

        setSessions(Array.isArray(s) ? s : []);
        setTerms(Array.isArray(t) ? t : []);
        setClasses(Array.isArray(c) ? c : []);
      } catch (err) {
        console.error("Failed loading options:", err);
      }
    };

    loadOptions();
  }, []);

  /* =========================================
     LOAD STUDENTS WHEN CLASS CHANGES
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

        /*
         * Preferred endpoint:
         * GET /students/class/:classId
         *
         * If you have not added this backend route yet,
         * this will show the error below.
         */
        const res = await api.get(`/students/class/${selectedClass}`);

        const studentData =
          res?.data?.data ||
          res?.data?.students ||
          res?.data ||
          [];

        const normalizedStudents = Array.isArray(studentData)
          ? studentData
          : [];

        setStudents(normalizedStudents);

        /*
         * If previously selected student is not in the new class,
         * clear it.
         */
        setSelectedStudent((current) => {
          if (
            current &&
            normalizedStudents.some(
              (student: Student) => student._id === current
            )
          ) {
            return current;
          }

          return "";
        });
      } catch (err) {
        console.error("Failed loading students:", err);
        setStudents([]);
        setSelectedStudent("");
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
    const value = search.trim().toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter((student) => {
      const fullName =
        `${student.firstName || ""} ${student.lastName || ""}`
          .trim()
          .toLowerCase();

      const admissionNumber =
        student.admissionNumber?.toLowerCase() || "";

      return (
        fullName.includes(value) ||
        admissionNumber.includes(value)
      );
    });
  }, [students, search]);

  /* =========================================
     GENERATE REPORT
  ========================================= */

  const handleGenerate = async () => {
    if (generating) return;

    if (loading || classLoading || bundleLoading) {
      return;
    }

    if (!selectedSession || !selectedTerm) {
      return;
    }

    try {
      setGenerating(true);

      const baseParams: ReportCardFilter = {
        sessionId: selectedSession,
        termId: selectedTerm,
        classId: selectedClass,
        studentId: selectedStudent,
      };

      /* ================= STUDENT ================= */

      if (viewMode === "student") {
        if (!selectedStudent) {
          return;
        }

        await fetchStudentReportCard(
          selectedStudent,
          baseParams
        );

        return;
      }

      /* ================= CLASS ================= */

      if (viewMode === "class") {
        if (!selectedClass) {
          return;
        }

        await fetchClassReport({
          sessionId: selectedSession,
          termId: selectedTerm,
          classId: selectedClass,
        });

        return;
      }

      /* ================= BUNDLE ================= */

      if (viewMode === "bundle") {
        if (!selectedClass) {
          return;
        }

        await fetchClassReportCardsBundle({
          sessionId: selectedSession,
          termId: selectedTerm,
          classId: selectedClass,
        });

        return;
      }
    } catch (err) {
      console.error("Generate report failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  /* =========================================
     NAVIGATION
  ========================================= */

  const openStudent = (studentId: string) => {
    if (!studentId) return;

    router.push(
      `/school-admin/results/report-cards/${studentId}?sessionId=${encodeURIComponent(
        selectedSession
      )}&termId=${encodeURIComponent(selectedTerm)}`
    );
  };

  const openClass = () => {
    if (!selectedClass) return;

    router.push(
      `/school-admin/results/class-reports?classId=${encodeURIComponent(
        selectedClass
      )}&sessionId=${encodeURIComponent(
        selectedSession
      )}&termId=${encodeURIComponent(selectedTerm)}`
    );
  };

  const openBundle = () => {
    if (!selectedClass) return;

    router.push(
      `/school-admin/results/report-cards/bundle?classId=${encodeURIComponent(
        selectedClass
      )}&sessionId=${encodeURIComponent(
        selectedSession
      )}&termId=${encodeURIComponent(selectedTerm)}`
    );
  };

  /* =========================================
     DATA
  ========================================= */

  const studentReport = reportCard;
  const classReportData = classReport;
  const bundleData = reportBundle;

  /* =========================================
     LOADING STATE
  ========================================= */

  const isGenerating =
    generating ||
    loading ||
    classLoading ||
    bundleLoading;

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="space-y-6">
      {/* =====================================
          HEADER
      ===================================== */}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Report Card Dashboard
        </h1>

        <p className="mt-1 text-slate-400">
          Generate student, class and bundle report cards
        </p>
      </div>

      {/* =====================================
          FILTERS
      ===================================== */}

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-5">
        {/* SESSION */}

        <select
          value={selectedSession}
          onChange={(e) => {
            setSelectedSession(e.target.value);

            /*
             * Clear generated reports when academic period changes.
             */
          }}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">Select Session</option>

          {sessions.map((session) => (
            <option
              key={session._id}
              value={session._id}
            >
              {session.name}
            </option>
          ))}
        </select>

        {/* TERM */}

        <select
          value={selectedTerm}
          onChange={(e) =>
            setSelectedTerm(e.target.value)
          }
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">Select Term</option>

          {terms.map((term) => (
            <option
              key={term._id}
              value={term._id}
            >
              {term.name}
            </option>
          ))}
        </select>

        {/* CLASS */}

        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedStudent("");
            setSearch("");
          }}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">Select Class</option>

          {classes.map((classItem) => (
            <option
              key={classItem._id}
              value={classItem._id}
            >
              {classItem.name}
            </option>
          ))}
        </select>

        {/* VIEW MODE */}

        <select
          value={viewMode}
          onChange={(e) => {
            setViewMode(
              e.target.value as
                | "student"
                | "class"
                | "bundle"
            );
          }}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="student">
            Generate Student Report Card
          </option>

          <option value="class">
            Generate Class Report Sheet
          </option>

          <option value="bundle">
            Generate Class Report Card Bundle
          </option>
        </select>

        {/* GENERATE */}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            !selectedSession ||
            !selectedTerm ||
            (viewMode === "student" &&
              !selectedStudent) ||
            ((viewMode === "class" ||
              viewMode === "bundle") &&
              !selectedClass)
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <FileText size={18} />
          )}

          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* =====================================
          STUDENT SELECTOR
      ===================================== */}

      {viewMode === "student" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Select Student
              </h2>

              <p className="text-sm text-slate-400">
                Select a class first, then choose a student
              </p>
            </div>

            {loadingStudents && (
              <Loader2
                size={18}
                className="animate-spin text-cyan-400"
              />
            )}
          </div>

          {/* SEARCH */}

          <div className="relative mb-3">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              disabled={!selectedClass}
              placeholder={
                selectedClass
                  ? "Search student by name or admission number..."
                  : "Select a class first..."
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* STUDENTS */}

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {!selectedClass ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
                Select a class to load students.
              </div>
            ) : loadingStudents ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-400">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Loading students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
                No students found in this class.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected =
                  selectedStudent === student._id;

                return (
                  <button
                    type="button"
                    key={student._id}
                    onClick={() =>
                      setSelectedStudent(student._id)
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {student.firstName}{" "}
                          {student.lastName}
                        </p>

                        <p className="text-xs text-slate-400">
                          Admission No:{" "}
                          {student.admissionNumber ||
                            "N/A"}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="rounded-full bg-cyan-400 px-2 py-1 text-xs font-semibold text-black">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =====================================
          STUDENT PREVIEW
      ===================================== */}

      {studentReport &&
        viewMode === "student" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Student Preview
                </p>

                <h2 className="text-xl font-semibold text-white">
                  {studentReport.student?.firstName ||
                    ""}{" "}
                  {studentReport.student?.lastName ||
                    ""}
                </h2>

                <p className="text-sm text-slate-400">
                  Admission No:{" "}
                  {studentReport.student
                    ?.admissionNumber || "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  openStudent(
                    studentReport.student?._id || ""
                  )
                }
                disabled={!studentReport.student?._id}
                className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open Full Report
              </button>
            </div>

            {/* BASIC SUMMARY */}

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="text-xs text-slate-500">
                  Subjects
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {studentReport.results?.length ||
                    0}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="text-xs text-slate-500">
                  Position
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {studentReport.summary
                    ?.positionLabel || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="text-xs text-slate-500">
                  Attendance
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {studentReport.attendance
                    ?.percentage ?? 0}
                  %
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="text-xs text-slate-500">
                  Session
                </p>

                <p className="mt-1 truncate text-sm font-medium text-white">
                  {studentReport.session?.name ||
                    "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* =====================================
          CLASS REPORT
      ===================================== */}

      {classReportData &&
        viewMode === "class" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Class Report Preview
                </p>

                <h2 className="text-xl font-semibold text-white">
                  {classReportData.class?.name ||
                    "Class Report"}
                </h2>
              </div>

              <button
                type="button"
                onClick={openClass}
                className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-black transition hover:bg-cyan-400"
              >
                Open Class Report
              </button>
            </div>

            {/* CLASS STATS */}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Class
                </p>

                <p className="mt-1 font-semibold text-white">
                  {classReportData.class?.name ||
                    "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Total Students
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {classReportData.totalStudents ||
                    0}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Generated Reports
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {classReportData.reports
                    ?.length || 0}
                </p>
              </div>
            </div>

            {/* STUDENT LIST */}

            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Students
              </h3>

              {!classReportData.reports ||
              classReportData.reports.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                  No reports generated.
                </div>
              ) : (
                <div className="space-y-2">
                  {classReportData.reports
                    .slice(0, 5)
                    .map(
                      (
                        item: ReportItem,
                        index: number
                      ) => {
                        const normalized =
                          normalizeReportItem(
                            item
                          );

                        const student =
                          normalized.student;

                        const summary =
                          normalized.summary;

                        const studentId =
                          student?._id ||
                          `class-report-${index}`;

                        const fullName =
                          `${student?.firstName || ""} ${
                            student?.lastName || ""
                          }`.trim() ||
                          "Unknown Student";

                        return (
                          <div
                            key={studentId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {fullName}
                              </p>

                              <p className="text-xs text-slate-500">
                                Admission No:{" "}
                                {student
                                  ?.admissionNumber ||
                                  "N/A"}
                              </p>
                            </div>

                            <span className="text-sm text-cyan-400">
                              {summary
                                ?.positionLabel ||
                                "Position N/A"}
                            </span>
                          </div>
                        );
                      }
                    )}

                  {classReportData.reports.length >
                    5 && (
                    <p className="pt-2 text-center text-xs text-slate-500">
                      Showing first 5 students. Open
                      the full class report to view all.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* =====================================
          BUNDLE REPORT
      ===================================== */}

      {bundleData &&
        viewMode === "bundle" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Report Card Bundle
                </p>

                <h2 className="text-xl font-semibold text-white">
                  {bundleData.class?.name ||
                    "Class Bundle"}
                </h2>
              </div>

              <button
                type="button"
                onClick={openBundle}
                className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-black transition hover:bg-cyan-400"
              >
                Open Bundle Viewer
              </button>
            </div>

            {/* BUNDLE STATS */}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Class
                </p>

                <p className="mt-1 font-semibold text-white">
                  {bundleData.class?.name ||
                    "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Total Students
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {bundleData.totalStudents ||
                    0}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Generated Reports
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {bundleData.reports
                    ?.length || 0}
                </p>
              </div>
            </div>

            {/* BUNDLE STUDENTS */}

            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Report Cards
              </h3>

              {!bundleData.reports ||
              bundleData.reports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                  No report cards generated.
                </div>
              ) : (
                <div className="space-y-2">
                  {bundleData.reports
                    .slice(0, 5)
                    .map(
                      (
                        item: ReportItem,
                        index: number
                      ) => {
                        /*
                         * IMPORTANT FIX:
                         *
                         * Backend currently returns:
                         *
                         * {
                         *   student: {...},
                         *   summary: {...}
                         * }
                         *
                         * Not:
                         *
                         * {
                         *   reportCard: {
                         *     student: {...}
                         *   }
                         * }
                         *
                         * normalizeReportItem() supports
                         * both formats.
                         */

                        const normalized =
                          normalizeReportItem(
                            item
                          );

                        const student =
                          normalized.student;

                        const summary =
                          normalized.summary;

                        const studentId =
                          student?._id ||
                          `bundle-report-${index}`;

                        const fullName =
                          `${student?.firstName || ""} ${
                            student?.lastName || ""
                          }`.trim() ||
                          "Unknown Student";

                        return (
                          <div
                            key={studentId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {fullName}
                              </p>

                              <p className="text-xs text-slate-500">
                                Admission No:{" "}
                                {student
                                  ?.admissionNumber ||
                                  "N/A"}
                              </p>
                            </div>

                            <span className="text-sm text-cyan-400">
                              {summary
                                ?.positionLabel ||
                                "Position N/A"}
                            </span>
                          </div>
                        );
                      }
                    )}

                  {bundleData.reports.length >
                    5 && (
                    <p className="pt-2 text-center text-xs text-slate-500">
                      Showing first 5 report cards.
                      Open the bundle viewer to see
                      all students.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <p className="font-medium">
            Report generation failed
          </p>

          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
