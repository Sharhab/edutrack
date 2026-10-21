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

import { getSchoolProfile } from "../../../../../../lib/settings";
import { SchoolProfile } from "../../../../../../types/settings";

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
     SCHOOL PROFILE
  ========================================== */

  const [schoolProfile, setSchoolProfile] =
    useState<SchoolProfile | null>(null);

  const [schoolProfileLoading, setSchoolProfileLoading] =
    useState(true);

  /* =========================================
     VALIDATION (PREVENT bundle/student bug)
  ========================================== */

  const isValidObjectId = (id: string | null) =>
    !!id && /^[0-9a-fA-F]{24}$/.test(id);

  /* =========================================
     FETCH SCHOOL PROFILE
  ========================================== */

  const fetchSchoolProfile = useCallback(async () => {
    try {
      setSchoolProfileLoading(true);

      const profile = await getSchoolProfile();

      setSchoolProfile(profile);
    } catch (err) {
      console.error(
        "Failed to load school profile:",
        err
      );
    } finally {
      setSchoolProfileLoading(false);
    }
  }, []);

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

  /* =========================================
     LOAD DATA
  ========================================== */

  useEffect(() => {
    fetchBundle();
    fetchSchoolProfile();
  }, [fetchBundle, fetchSchoolProfile]);

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
   
  return (
    <div className="report-bundle min-h-screen bg-gray-50 print:min-h-0 print:bg-white">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-bundle {
            width: 210mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .report-bundle-toolbar {
            display: none !important;
          }

          .report-bundle-list {
            display: block !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .report-bundle-item {
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;

            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .report-bundle-item:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }

          .report-bundle-item .print-report {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div className="report-bundle-toolbar mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Report Card Bundle</h1>
          <p className="text-sm text-gray-500">
            Class: {bundle.class.name} · Total Students:{" "}
            {bundle.totalStudents}
          </p>
        </div>

        <div className="flex gap-2">
          <PrintButton />
          <DownloadPdfButton onClick={() => window.print()} />
        </div>
      </div>

      <div className="report-bundle-list space-y-10 print:space-y-0">
        {bundle.reports.map((item, index) => {
          if (!item?.reportCard) return null;

          const rc = item.reportCard;

          return (
            <section
              key={rc.student?._id || index}
              className="report-bundle-item rounded-md bg-white p-4 shadow-sm print:rounded-none print:p-0 print:shadow-none"
            >
              <div className="print-report">
                <ReportCardTemplate
                  data={rc}
                  schoolName={schoolProfile?.schoolName}
                  schoolAddress={schoolProfile?.address}
                  schoolLogo={schoolProfile?.logoUrl}
                  brandColor={schoolProfile?.themeColor || "#06b6d4"}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
        })}
      </div>
    </div>
  );
}
