"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  Search,
} from "lucide-react";

import {
  getSessions,
  getTerms,
  getClassOptions,
} from "../../../../../lib/options";

import api from "../../../../../lib/axios";
import { useReportCard } from "../../../../../hooks/useReportCard";

import type {
  ReportCardFilter,
  StudentReportCard,
} from "../../../../../types/report-card";

/* =========================================================
   TYPES
========================================================= */

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

/*
 * Backend/API can return either:
 *
 * 1. Raw report card
 *
 * {
 *   student: {...},
 *   summary: {...},
 *   results: [...]
 * }
 *
 * OR:
 *
 * 2. Wrapped report card
 *
 * {
 *   reportCard: {
 *     student: {...},
 *     summary: {...},
 *     results: [...]
 *   }
 * }
 */

type ReportItem =
  | StudentReportCard
  | {
      reportCard: StudentReportCard;
    };

/* =========================================================
   HELPERS
========================================================= */

function getReportCard(
  item: ReportItem
): StudentReportCard {
  if (
    "reportCard" in item &&
    item.reportCard
  ) {
    return item.reportCard;
  }

  return item;
}

/*
 * The hook/type may currently describe reports
 * differently depending on the API response.
 *
 * This helper converts the unknown reports collection
 * into a safe array for this page.
 */

function normalizeReports(
  reports: unknown
): ReportItem[] {
  if (!Array.isArray(reports)) {
    return [];
  }

  return reports as ReportItem[];
}

/* =========================================================
   PAGE
========================================================= */

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

  /* =======================================================
     DATA
  ======================================================= */

  const [sessions, setSessions] =
    useState<OptionItem[]>([]);

  const [terms, setTerms] =
    useState<OptionItem[]>([]);

  const [classes, setClasses] =
    useState<OptionItem[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  /* =======================================================
     LOADING
  ======================================================= */

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [selectedSession, setSelectedSession] =
    useState("");

  const [selectedTerm, setSelectedTerm] =
    useState("");

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedStudent, setSelectedStudent] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* =======================================================
     VIEW MODE
  ======================================================= */

  const [viewMode, setViewMode] =
    useState<
      "student" | "class" | "bundle"
    >("student");

  /* =======================================================
     LOAD SESSIONS / TERMS / CLASSES
  ======================================================= */

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [
          sessionsData,
          termsData,
          classesData,
        ] = await Promise.all([
          getSessions(),
          getTerms(),
          getClassOptions(),
        ]);

        setSessions(
          Array.isArray(sessionsData)
            ? sessionsData
            : []
        );

        setTerms(
          Array.isArray(termsData)
            ? termsData
            : []
        );

        setClasses(
          Array.isArray(classesData)
            ? classesData
            : []
        );
      } catch (err) {
        console.error(
          "Failed loading report card options:",
          err
        );
      }
    };

    loadOptions();
  }, []);

  /* =======================================================
     LOAD STUDENTS BY CLASS
  ======================================================= */

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
         * Backend endpoint:
         *
         * GET /students/class/:classId
         */

        const response = await api.get(
          `/students/class/${selectedClass}`
        );

        const studentData =
          response?.data?.data ??
          response?.data?.students ??
          response?.data ??
          [];

        const safeStudents: Student[] =
          Array.isArray(studentData)
            ? studentData
            : [];

        setStudents(safeStudents);

        /*
         * Make sure selected student still
         * belongs to the selected class.
         */

        setSelectedStudent((current) => {
          if (!current) {
            return "";
          }

          const exists =
            safeStudents.some(
              (student) =>
                student._id === current
            );

          return exists ? current : "";
        });
      } catch (err) {
        console.error(
          "Failed loading students:",
          err
        );

        setStudents([]);
        setSelectedStudent("");
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedClass]);

  /* =======================================================
     FILTER STUDENTS
  ======================================================= */

  const filteredStudents = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter(
      (student) => {
        const fullName =
          `${student.firstName || ""} ${
            student.lastName || ""
          }`
            .trim()
            .toLowerCase();

        const admissionNumber =
          student.admissionNumber
            ?.toLowerCase() || "";

        return (
          fullName.includes(value) ||
          admissionNumber.includes(value)
        );
      }
    );
  }, [students, search]);

  /* =======================================================
     GENERATE REPORT
  ======================================================= */

  const handleGenerate = async () => {
    if (generating) {
      return;
    }

    if (
      loading ||
      classLoading ||
      bundleLoading
    ) {
      return;
    }

    if (
      !selectedSession ||
      !selectedTerm
    ) {
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

      /* ===================================================
         STUDENT REPORT
      =================================================== */

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

      /* ===================================================
         CLASS REPORT
      =================================================== */

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

      /* ===================================================
         BUNDLE
      =================================================== */

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
      console.error(
        "Generate report failed:",
        err
      );
    } finally {
      setGenerating(false);
    }
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openStudent = (
    studentId: string
  ) => {
    if (!studentId) {
      return;
    }

    router.push(
      `/school-admin/results/report-cards/${studentId}?sessionId=${encodeURIComponent(
        selectedSession
      )}&termId=${encodeURIComponent(
        selectedTerm
      )}`
    );
  };

  const openClass = () => {
    if (!selectedClass) {
      return;
    }

    router.push(
      `/school-admin/results/class-reports?classId=${encodeURIComponent(
        selectedClass
      )}&sessionId=${encodeURIComponent(
        selectedSession
      )}&termId=${encodeURIComponent(
        selectedTerm
      )}`
    );
  };

  const openBundle = () => {
    if (!selectedClass) {
      return;
    }

    router.push(
      `/school-admin/results/report-cards/bundle?classId=${encodeURIComponent(
        selectedClass
      )}&sessionId=${encodeURIComponent(
        selectedSession
      )}&termId=${encodeURIComponent(
        selectedTerm
      )}`
    );
  };

  /* =======================================================
     NORMALIZED DATA
  ======================================================= */

  const studentReport =
    reportCard;

  const classReportData =
    classReport;

  const bundleData =
    reportBundle;

  /*
   * Explicitly normalize the reports arrays.
   *
   * This is important because the backend currently
   * returns raw StudentReportCard objects in the bundle.
   */

  const classReports: ReportItem[] =
    normalizeReports(
      classReportData?.reports
    );

  const bundleReports: ReportItem[] =
    normalizeReports(
      bundleData?.reports
    );

  /* =======================================================
     GENERATING STATE
  ======================================================= */

  const isGenerating =
    generating ||
    loading ||
    classLoading ||
    bundleLoading;

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Report Card Dashboard
        </h1>

        <p className="mt-1 text-slate-400">
          Generate student, class and bundle
          report cards
        </p>
      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-5">

        {/* SESSION */}

        <select
          value={selectedSession}
          onChange={(event) =>
            setSelectedSession(
              event.target.value
            )
          }
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">
            Select Session
          </option>

          {sessions.map(
            (session) => (
              <option
                key={session._id}
                value={session._id}
              >
                {session.name}
              </option>
            )
          )}
        </select>

        {/* TERM */}

        <select
          value={selectedTerm}
          onChange={(event) =>
            setSelectedTerm(
              event.target.value
            )
          }
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">
            Select Term
          </option>

          {terms.map(
            (term) => (
              <option
                key={term._id}
                value={term._id}
              >
                {term.name}
              </option>
            )
          )}
        </select>

        {/* CLASS */}

        <select
          value={selectedClass}
          onChange={(event) => {
            setSelectedClass(
              event.target.value
            );

            setSelectedStudent("");
            setSearch("");
          }}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="">
            Select Class
          </option>

          {classes.map(
            (classItem) => (
              <option
                key={classItem._id}
                value={classItem._id}
              >
                {classItem.name}
              </option>
            )
          )}
        </select>

        {/* VIEW MODE */}

        <select
          value={viewMode}
          onChange={(event) =>
            setViewMode(
              event.target.value as
                | "student"
                | "class"
                | "bundle"
            )
          }
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

        {/* GENERATE BUTTON */}

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

          {isGenerating
            ? "Generating..."
            : "Generate"}
        </button>
      </div>

      {/* ===================================================
          STUDENT SELECTOR
      =================================================== */}

      {viewMode === "student" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-white">
                Select Student
              </h2>

              <p className="text-sm text-slate-400">
                Select a class first, then
                choose a student
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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
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
                Select a class to load
                students.
              </div>
            ) : loadingStudents ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-400">
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Loading students...
              </div>
            ) : filteredStudents.length ===
              0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
                No students found in this
                class.
              </div>
            ) : (
              filteredStudents.map(
                (student) => {
                  const isSelected =
                    selectedStudent ===
                    student._id;

                  return (
                    <button
                      type="button"
                      key={student._id}
                      onClick={() =>
                        setSelectedStudent(
                          student._id
                        )
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
                }
              )
            )}
          </div>
        </div>
      )}

      {/* ===================================================
          STUDENT REPORT PREVIEW
      =================================================== */}

      {studentReport &&
        viewMode === "student" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Student Preview
                </p>

                <h2 className="text-xl font-semibold text-white">
                  {studentReport.student
                    ?.firstName || ""}{" "}
                  {studentReport.student
                    ?.lastName || ""}
                </h2>

                <p className="text-sm text-slate-400">
                  Admission No:{" "}
                  {studentReport.student
                    ?.admissionNumber ||
                    "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  openStudent(
                    studentReport.student
                      ?._id || ""
                  )
                }
                disabled={
                  !studentReport.student?._id
                }
                className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open Full Report
              </button>
            </div>

            {/* SUMMARY */}

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="text-xs text-slate-500">
                  Subjects
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {studentReport.results
                    ?.length || 0}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="text-xs text-slate-500">
                  Position
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {studentReport.summary
                    ?.positionLabel ||
                    "N/A"}
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
                  {studentReport.session
                    ?.name ||
                    "N/A"}
                </p>
              </div>

            </div>
          </div>
        )}

      {/* ===================================================
          CLASS REPORT
      =================================================== */}

      {classReportData &&
        viewMode === "class" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Class Report Preview
                </p>

                <h2 className="text-xl font-semibold text-white">
                  {classReportData.class
                    ?.name ||
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

            {/* CLASS STATISTICS */}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Class
                </p>

                <p className="mt-1 font-semibold text-white">
                  {classReportData.class
                    ?.name ||
                    "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Total Students
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {classReportData
                    .totalStudents ||
                    0}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Generated Reports
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {classReports.length}
                </p>
              </div>

            </div>

            {/* CLASS STUDENTS */}

            <div className="mt-5">

              <h3 className="mb-3 text-sm font-semibold text-white">
                Students
              </h3>

              {classReports.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                  No reports generated.
                </div>
              ) : (
                <div className="space-y-2">

                  {classReports
                    .slice(0, 5)
                    .map(
                      (
                        item: ReportItem,
                        index: number
                      ) => {
                        const reportCard =
                          getReportCard(
                            item
                          );

                        const student =
                          reportCard.student;

                        const fullName =
                          `${student?.firstName || ""} ${
                            student?.lastName || ""
                          }`
                            .trim() ||
                          "Unknown Student";

                        return (
                          <div
                            key={
                              student?._id ||
                              `class-report-${index}`
                            }
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
                              {reportCard
                                .summary
                                ?.positionLabel ||
                                "Position N/A"}
                            </span>
                          </div>
                        );
                      }
                    )}

                </div>
              )}
            </div>
          </div>
        )}

      {/* ===================================================
          BUNDLE
      =================================================== */}

      {bundleData &&
        viewMode === "bundle" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Report Card Bundle
                </p>

                <h2 className="text-xl font-semibold text-white">
                  {bundleData.class
                    ?.name ||
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

            {/* BUNDLE STATISTICS */}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Class
                </p>

                <p className="mt-1 font-semibold text-white">
                  {bundleData.class
                    ?.name ||
                    "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Total Students
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {bundleData
                    .totalStudents ||
                    0}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Generated Reports
                </p>

                <p className="mt-1 text-xl font-semibold text-cyan-400">
                  {bundleReports.length}
                </p>
              </div>

            </div>

            {/* BUNDLE STUDENTS */}

            <div className="mt-5">

              <h3 className="mb-3 text-sm font-semibold text-white">
                Report Cards
              </h3>

              {bundleReports.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                  No report cards generated.
                </div>
              ) : (
                <div className="space-y-2">

                  {bundleReports
                    .slice(0, 5)
                    .map(
                      (
                        item: ReportItem,
                        index: number
                      ) => {
                        /*
                         * IMPORTANT:
                         *
                         * This works with BOTH:
                         *
                         * item.student
                         *
                         * and:
                         *
                         * item.reportCard.student
                         */

                        const reportCard =
                          getReportCard(
                            item
                          );

                        const student =
                          reportCard.student;

                        const fullName =
                          `${student?.firstName || ""} ${
                            student?.lastName || ""
                          }`
                            .trim() ||
                          "Unknown Student";

                        return (
                          <div
                            key={
                              student?._id ||
                              `bundle-report-${index}`
                            }
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
                              {reportCard
                                .summary
                                ?.positionLabel ||
                                "Position N/A"}
                            </span>
                          </div>
                        );
                      }
                    )}

                  {bundleReports.length >
                    5 && (
                    <p className="pt-2 text-center text-xs text-slate-500">
                      Showing the first 5
                      students. Open the
                      bundle viewer to see
                      all students.
                    </p>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">

          <p className="font-medium">
            Report generation failed
          </p>

          <p className="mt-1">
            {error}
          </p>

        </div>
      )}

    </div>
  );
}
