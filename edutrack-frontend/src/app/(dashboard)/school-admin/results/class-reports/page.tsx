"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  Award,
  BarChart3,
  GraduationCap,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";

import { useReportCard } from "../../../../../hooks/useReportCard";

import { generateClassPdf } from "../../../../../lib/report-card/generateClassPdf";

import ClassRankingTable from "../../../../../components/report-cards/ClassRankingTable";

import PrintButton from "../../../../../components/report-cards/PrintButton";

import DownloadPdfButton from "../../../../../components/report-cards/DownloadpdfButton";

export default function ClassReportsPage() {
  const searchParams = useSearchParams();

  const classId =
    searchParams.get("classId") || "";

  const sessionId =
    searchParams.get("sessionId") || "";

  const termId =
    searchParams.get("termId") || "";

  const {
    fetchClassReport,
    classReport,
    loading,
    error,
  } = useReportCard();

  /* =========================================
     LOAD REPORT
  ========================================= */

  useEffect(() => {
    if (
      !classId ||
      !sessionId ||
      !termId
    ) {
      return;
    }

    fetchClassReport({
      classId,
      sessionId,
      termId,
    });
  }, [
    classId,
    sessionId,
    termId,
    fetchClassReport,
  ]);

  /* =========================================
     PDF
  ========================================= */

  const handleDownloadPdf = async () => {
    if (!classReport) return;

    const pdf =
      await generateClassPdf({
        classReport,
      });

    pdf.save(
      `${classReport.class.name}_class_report.pdf`
    );
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-black/40 px-6 py-4 text-cyan-400 backdrop-blur-xl">
          <Loader2 className="animate-spin" />

          <span className="font-medium">
            Loading class report...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================
     ERROR
  ========================================= */

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        {error}
      </div>
    );
  }

  /* =========================================
     EMPTY
  ========================================= */

  if (!classReport) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-400">
        No class report available
      </div>
    );
  }

  /* =========================================
     TOP STUDENTS
  ========================================= */

  const topStudents =
    classReport.students.slice(0, 3);

  /* =========================================
     MAIN UI
  ========================================= */

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
              <BarChart3 size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Class Report Sheet
              </h1>

              <p className="text-sm text-slate-400">
                Ranking & performance
                analysis
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              Session: {sessionId}
            </div>

            <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
              Term: {termId}
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-1">
            <PrintButton />
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-1">
            <DownloadPdfButton
              onClick={
                handleDownloadPdf
              }
            />
          </div>
        </div>
      </div>

      {/* =========================================
          SUMMARY CARDS
      ========================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* CLASS */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
              <GraduationCap size={22} />
            </div>

            <span className="text-xs text-slate-500">
              Class
            </span>
          </div>

          <p className="text-sm text-slate-400">
            Current Class
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            {classReport.class.name}
          </h2>
        </div>

        {/* LEVEL */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-400">
              <Award size={22} />
            </div>

            <span className="text-xs text-slate-500">
              Level
            </span>
          </div>

          <p className="text-sm text-slate-400">
            Academic Level
          </p>

          <h2 className="mt-1 text-xl font-bold capitalize text-white">
            {classReport.class.level ||
              "-"}
          </h2>
        </div>

        {/* TOTAL STUDENTS */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-green-500/10 p-3 text-green-400">
              <Users size={22} />
            </div>

            <span className="text-xs text-slate-500">
              Students
            </span>
          </div>

          <p className="text-sm text-slate-400">
            Total Students
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            {
              classReport.totalStudents
            }
          </h2>
        </div>

        {/* TOP SCORE */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-yellow-500/10 p-3 text-yellow-400">
              <Trophy size={22} />
            </div>

            <span className="text-xs text-slate-500">
              Best Student
            </span>
          </div>

          <p className="text-sm text-slate-400">
            Highest Average
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            {topStudents?.[0]
              ?.averageScore || 0}
          </h2>
        </div>
      </div>

      {/* =========================================
          CLASS RANKING TABLE
      ========================================= */}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
        {/* HEADER */}

        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
              <BarChart3 size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Class Ranking Table
              </h2>

              <p className="text-sm text-slate-400">
                Student positions and
                average scores
              </p>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="p-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
            <ClassRankingTable
              students={
                classReport.students
              }
            />
          </div>
        </div>
      </div>

      {/* =========================================
          TOP STUDENTS
      ========================================= */}

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-500/10 p-3 text-yellow-400">
            <Trophy size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Top Performing Students
            </h2>

            <p className="text-sm text-slate-400">
              Highest ranked students in
              the class
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {topStudents.map(
            (student, index) => (
              <div
                key={student.studentId}
                className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl ${
                  index === 0
                    ? "border-yellow-500/20 bg-yellow-500/10"
                    : index === 1
                    ? "border-slate-400/20 bg-slate-400/10"
                    : "border-orange-500/20 bg-orange-500/10"
                }`}
              >
                {/* POSITION */}

                <div className="absolute right-4 top-4 text-5xl font-black text-white/5">
                  #
                  {
                    student.positionLabel
                  }
                </div>

                <div className="relative z-10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/20 text-2xl font-bold text-white">
                    {student.positionLabel}
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {student.firstName}{" "}
                    {student.lastName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-300">
                    Average Score
                  </p>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-3xl font-black text-white">
                      {
                        student.averageScore
                      }
                    </span>

                    <span className="pb-1 text-sm text-slate-300">
                      %
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}