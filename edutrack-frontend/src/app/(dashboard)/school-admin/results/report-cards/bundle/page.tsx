
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { StudentReportCard } from "../../../../../../types/report-card";
import api from "../../../../../../lib/axios";
import { getSchoolProfile } from "../../../../../../lib/settings";
import type { SchoolProfile } from "../../../../../../types/settings";

import ReportCardTemplate from "../../../../../../components/report-cards/ReportCardTemplate";
import DownloadPdfButton from "../../../../../../components/report-cards/DownloadpdfButton";
import PrintButton from "../../../../../../components/report-cards/PrintButton";

/* =========================================
   TYPES
========================================= */

type ReportCard = StudentReportCard;
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
    reportCard?: ReportCard;
    error?: boolean;
    message?: string;
  }>;
};
const isValidObjectId = (id: string | null): boolean =>
  Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const value = error as {
      message?: string;
      response?: {
        data?: { message?: string };
      };
    };

    return (
      value.response?.data?.message ||
      value.message ||
      "Failed to load report cards."
    );
  }

  return "Failed to load report cards.";
}

/* =========================================
   PAGE
========================================= */

export default function ClassReportBundlePage() {
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");
  const sessionId = searchParams.get("sessionId");
  const termId = searchParams.get("termId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ClassBundle | null>(null);

  const [schoolProfile, setSchoolProfile] =
    useState<SchoolProfile | null>(null);

  /* =========================================
     FETCH REPORT BUNDLE
  ========================================== */

  const fetchBundle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBundle(null);

    try {
      if (!isValidObjectId(classId)) {
        throw new Error("Invalid class ID.");
      }

      if (!isValidObjectId(sessionId)) {
        throw new Error("Invalid session ID.");
      }

      if (!isValidObjectId(termId)) {
        throw new Error("Invalid term ID.");
      }

      const response = await api.get(
        `/report-cards/class/${classId}/bundle`,
        {
          params: {
            sessionId,
            termId,
          },
        }
      );

      // Support either a direct bundle response or { data: bundle }.
      const payload = response.data?.data ?? response.data;

      if (!payload || !Array.isArray(payload.reports)) {
        throw new Error(
          "The server returned an invalid report-card bundle."
        );
      }

      setBundle(payload as ClassBundle);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classId, sessionId, termId]);

  /* =========================================
     FETCH SCHOOL PROFILE
  ========================================== */

  const fetchSchoolProfile = useCallback(async () => {
    try {
      const profile = await getSchoolProfile();
      setSchoolProfile(profile);
    } catch (err) {
      // Report cards can still render if branding fails to load.
      console.error("Failed to load school profile:", err);
    }
  }, []);

  /* =========================================
     LOAD DATA
  ========================================== */

  useEffect(() => {
    void fetchBundle();
    void fetchSchoolProfile();
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
      <div
        role="alert"
        className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
      >
        <p className="font-semibold">
          Unable to load report cards
        </p>

        <p className="mt-1 text-sm">{error}</p>

        <button
          type="button"
          onClick={() => void fetchBundle()}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-6 text-gray-500">
        No report-card bundle found.
      </div>
    );
  }

  const reports = bundle.reports.filter(
    (item) => Boolean(item?.reportCard)
  );

  /* =========================================
     MAIN UI
  ========================================== */

  return (
    <main className="report-bundle min-h-screen bg-gray-50 p-4 print:min-h-0 print:bg-white print:p-0">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        .report-bundle,
        .report-bundle * {
          box-sizing: border-box;
        }

        .report-bundle-list {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .report-bundle-item {
          width: 100%;
          max-width: 210mm;
          min-width: 0;
          margin-inline: auto;
          background: #fff;
        }

        .report-bundle-item .print-report {
          width: 100%;
          min-width: 0;
          margin-inline: auto;
        }

        @media print {
          html,
          body {
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body {
            overflow: visible !important;
          }

          body * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-bundle {
            width: 100% !important;
            min-width: 0 !important;
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
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }

          .report-bundle-item {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            height: 297mm !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
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
            width: 100% !important;
            height: 297mm !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          .report-bundle-item .report-card-page {
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            height: 297mm !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* SCREEN TOOLBAR */}

      <header className="report-bundle-toolbar mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Report Card Bundle
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Class: {bundle.class.name} · Total students:{" "}
            {bundle.totalStudents}
          </p>

          <p className="text-sm text-gray-500">
            Reports ready: {reports.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrintButton />

          <DownloadPdfButton
            onClick={() => window.print()}
          />
        </div>
      </header>

      {/* REPORTS — ONE WRAPPER PER STUDENT */}

      <div className="report-bundle-list">
        {reports.map((item, index) => {
          const rc = item.reportCard!;

          return (
            <section
              key={rc.student?._id ?? index}
              className="report-bundle-item rounded-md bg-white p-4 shadow-sm print:rounded-none print:p-0 print:shadow-none"
            >
              <div className="print-report">
                <ReportCardTemplate
                  data={rc}
                  schoolName={schoolProfile?.schoolName}
                  schoolAddress={schoolProfile?.address}
                  schoolLogo={schoolProfile?.logoUrl}
                  brandColor={
                    schoolProfile?.themeColor || "#06b6d4"
                  }
                />
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
