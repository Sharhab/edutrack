"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import api from "../../../../../../lib/axios";

import ReportCardTemplate from "../../../../../../components/report-cards/ReportCardTemplate";
import ReportCardHeader from "../../../../../../components/report-cards/ReportCardHeader";
import ReportCardSummary from "../../../../../../components/report-cards/ReportCardSummary";
import ReportCardSubjectTable from "../../../../../../components/report-cards/ReportCardSubjectTable";
import ReportCardAttendance from "../../../../../../components/report-cards/ReportCardAttendance";
import ReportCardFooter from "../../../../../../components/report-cards/ReportCardFooter";
import StudentRankBadge from "../../../../../../components/report-cards/StudentRankBadge";

import DownloadPdfButton from "../../../../../../components/report-cards/DownloadpdfButton";
import PrintButton from "../../../../../../components/report-cards/PrintButton";

/* =========================================
   TYPES (bundle-safe minimal shape)
========================================= */

type ReportCard = {
  student: any;
  session: any;
  term: any;
  results: any[];
  summary: any;
  attendance: any;
};

type ClassBundle = {
  class: {
    _id: string;
    name: string;
    level?: string;
  };
  totalStudents: number;
  sessionId: string;
  termId: string;
  generatedAt: string;
  reports: Array<{
    reportCard: ReportCard;
    error?: boolean;
    message?: string;
  }>;
};

export default function ClassReportBundlePage() {
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");
  const sessionId = searchParams.get("sessionId");
  const termId = searchParams.get("termId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bundle, setBundle] = useState<ClassBundle | null>(null);

  /* =========================================
     VALIDATION (PREVENT bundle/student bug)
  ========================================== */

  const isValidObjectId = (id: string | null) =>
    !!id && /^[0-9a-fA-F]{24}$/.test(id);

  /* =========================================
     FETCH BUNDLE
  ========================================== */

  const fetchBundle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isValidObjectId(classId)) {
        throw new Error("Invalid class ID");
      }

      if (!isValidObjectId(sessionId)) {
        throw new Error("Invalid session ID");
      }

      if (!isValidObjectId(termId)) {
        throw new Error("Invalid term ID");
      }

      const res = await api.get(
        `/report-cards/class/${classId}/bundle`,
        {
          params: {
            sessionId,
            termId,
          },
        }
      );

      setBundle(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load bundle"
      );
    } finally {
      setLoading(false);
    }
  }, [classId, sessionId, termId]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  /* =========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="p-6 text-gray-500 animate-pulse">
        Loading report card bundle...
      </div>
    );
  }

  /* =========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-6 text-gray-500">
        No bundle found
      </div>
    );
  }

  /* =========================================
     MAIN UI
  ========================================== */

  return (
      <div className="bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold">
            Report Card Bundle
          </h1>

          <p className="text-sm text-gray-500">
            Class: {bundle.class.name} • Total Students:{" "}
            {bundle.totalStudents}
          </p>
        </div>

        <div className="flex gap-2">
          <PrintButton />
          <DownloadPdfButton onClick={() => window.print()} />
        </div>
      </div>

      {/* REPORTS */}
      <div className="space-y-10">
        {bundle.reports.map((item, index) => {
          if (!item?.reportCard) return null;

          const rc = item.reportCard;

          return (
            <div
  key={rc.student._id || index}
  className="
    bg-white
    shadow-sm
    rounded-md
    p-4
    print:p-0
    print:shadow-none
    print:rounded-none
    print:break-after-page
    print:min-h-screen
  "
>

     <div className="print-report">
  <ReportCardTemplate data={rc} />
</div>

            </div>
          );
        })}
      </div>
    </div>
  );
}