"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import api from "../../../../../../lib/axios";

import ReportCardTemplate from "../../../../../../components/report-cards/ReportCardTemplate";
import DownloadPdfButton from "../../../../../../components/report-cards/DownloadpdfButton";
import PrintButton from "../../../../../../components/report-cards/PrintButton";

import { getSchoolProfile } from "../../../../../../lib/settings";
import type { SchoolProfile } from "../../../../../../types/settings";
import type { StudentReportCard } from "../../../../../../types/report-card";

/* =========================================
   TYPES
========================================= */

type BundleReportCard = StudentReportCard & {
  error?: boolean;
  message?: string;
};

type BundleReportItem = {
  reportCard?: BundleReportCard;
  error?: boolean;
  message?: string;
  student?: StudentReportCard["student"];
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
  reports: BundleReportItem[];
};

/* =========================================
   HELPERS
========================================= */

function isValidObjectId(id: string | null): id is string {
  return Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
}

function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const requestError = err as {
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };

    return (
      requestError.response?.data?.message ||
      requestError.message ||
      "Failed to load report card bundle."
    );
  }

  return "Failed to load report card bundle.";
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

  const [schoolProfileLoading, setSchoolProfileLoading] =
    useState(true);

  /* =========================================
     FETCH SCHOOL PROFILE
  ========================================== */

  const fetchSchoolProfile = useCallback(async () => {
    try {
      setSchoolProfileLoading(true);

      const profile = await getSchoolProfile();

      setSchoolProfile(profile);
    } catch (err) {
      console.error("Failed to load school profile:", err);
    } finally {
      setSchoolProfileLoading(false);
    }
  }, []);

  /* =========================================
     FETCH CLASS BUNDLE
  ========================================== */

  const fetchBundle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setBundle(null);

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

      const data = response.data?.data ?? response.data;

      if (!data || !Array.isArray(data.reports)) {
        throw new Error(
          "The server returned an invalid report card bundle."
        );
      }

      setBundle(data as ClassBundle);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classId, sessionId, termId]);

  /* =========================================
     LOAD DATA
  ========================================== */

  useEffect(() => {
    void fetchBundle();
    void fetchSchoolProfile();
  }, [fetchBundle, fetchSchoolProfile]);

  /* =========================================
     LOADING STATE
  ========================================== */

  if (loading) {
    return (
      <div className="animate-pulse p-6 text-gray-500">
        Loading report card bundle...
      </div>
    );
  }

  /* =========================================
     ERROR STATE
  ========================================== */

  if (error) {
    return (
      <div
        className="p-6 text-red-600"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-6 text-gray-500">
        No report card bundle found.
      </div>
    );
  }

  /* =========================================
     VALIDATE REPORT CARDS
     Preserve the existing StudentReportCard type.
  ========================================== */

  const validReports: StudentReportCard[] = [];
  let failedReportsCount = 0;

  for (const item of bundle.reports) {
    const reportCard = item?.reportCard;

    if (
      !reportCard ||
      item.error ||
      reportCard.error ||
      !reportCard.student?._id ||
      !reportCard.session ||
      !reportCard.term ||
      !Array.isArray(reportCard.results) ||
      !reportCard.summary ||
      !reportCard.attendance
    ) {
      failedReportsCount += 1;
      continue;
    }

    validReports.push(reportCard);
  }

  /* =========================================
     MAIN UI
  ========================================== */

  return (
    <main className="min-h-screen bg-gray-50 p-4 print:min-h-0 print:bg-white print:p-0">
      {/* SCREEN-ONLY HEADER */}

      <header className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold">
            Report Card Bundle
          </h1>

          <p className="text-sm text-gray-500">
            Class: {bundle.class?.name || "Unknown class"}
            {" • "}
            Students: {bundle.totalStudents}
            {" • "}
            Valid reports: {validReports.length}
          </p>

          {schoolProfileLoading && (
            <p className="mt-1 text-xs text-gray-400">
              Loading school branding...
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <PrintButton />

          <DownloadPdfButton
            onClick={() => window.print()}
          />
        </div>
      </header>

      {/* FAILED REPORT NOTICE */}

      {failedReportsCount > 0 && (
        <div
          className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 print:hidden"
          role="status"
        >
          {failedReportsCount} report card(s) are incomplete
          or failed to generate. They have been excluded from
          printing. Check the saved results and API response
          for the affected students.
        </div>
      )}

      {/* REPORT CARDS */}

      {validReports.length > 0 ? (
        <div id="report-card-bundle">
          {validReports.map((reportCard) => (
            <section
              key={reportCard.student._id}
              className="report-card-student mb-10 bg-white p-4 shadow-sm print:mb-0 print:p-0 print:shadow-none"
            >
              <div className="print-report">
                <ReportCardTemplate
                  data={reportCard}
                  schoolName={schoolProfile?.schoolName}
                  schoolAddress={schoolProfile?.address}
                  schoolLogo={schoolProfile?.logoUrl}
                  brandColor={
                    schoolProfile?.themeColor || "#06b6d4"
                  }
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-md bg-white p-6 text-gray-600 print:hidden">
          No valid report cards are available for this class,
          session, and term.
        </div>
      )}
    </main>
  );
}
