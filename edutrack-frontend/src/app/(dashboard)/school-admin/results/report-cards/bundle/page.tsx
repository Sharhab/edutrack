"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import api from "../../../../../../lib/axios";

import ReportCardTemplate from "../../../../../../components/report-cards/ReportCardTemplate";
import DownloadPdfButton from "../../../../../../components/report-cards/DownloadpdfButton";
import PrintButton from "../../../../../../components/report-cards/PrintButton";

import { getSchoolProfile } from "../../../../../../lib/settings";
import { SchoolProfile } from "../../../../../../types/settings";

/* =========================================
   TYPES
========================================= */

type ReportCard = {
  student?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    admissionNumber?: string;
  };
  session?: unknown;
  term?: unknown;
  results?: unknown[];
  summary?: unknown;
  attendance?: unknown;
  error?: boolean;
  message?: string;
};

type BundleReportItem = {
  reportCard?: ReportCard;
  error?: boolean;
  message?: string;
  student?: ReportCard["student"];
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

const isValidObjectId = (id: string | null): boolean =>
  Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));

const getStudentName = (student?: ReportCard["student"]) => {
  const name = [student?.firstName, student?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || student?.admissionNumber || "Unknown student";
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
     FETCH REPORT CARD BUNDLE
  ========================================== */

  const fetchBundle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setBundle(null);

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

      const data = res.data?.data ?? res.data;

      if (!data || !Array.isArray(data.reports)) {
        throw new Error(
          "The server returned an invalid report card bundle."
        );
      }

      setBundle(data as ClassBundle);
    } catch (err: unknown) {
      const requestError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to load report card bundle."
      );
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
      <div className="p-6 text-red-600" role="alert">
        {error}
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-6 text-gray-500">
        No bundle found.
      </div>
    );
  }

  /* =========================================
     NORMALIZE REPORTS
     Failed records must not print as empty cards.
  ========================================== */

  const validReports = bundle.reports.filter((item) => {
    const reportCard = item?.reportCard;

    return Boolean(
      reportCard &&
        !item.error &&
        !reportCard.error &&
        reportCard.student?._id
    );
  });

  const failedReports = bundle.reports.filter((item) => {
    return Boolean(
      item?.error ||
        item?.reportCard?.error ||
        !item?.reportCard
    );
  });

  /* =========================================
     MAIN UI
  ========================================== */

  return (
    <main className="min-h-screen bg-gray-50 p-4 print:min-h-0 print:bg-white print:p-0">
      {/* SCREEN-ONLY HEADER */}
      <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold">
            Report Card Bundle
          </h1>

          <p className="text-sm text-gray-500">
            Class: {bundle.class?.name || "Unknown class"}{" "}
            • Students: {bundle.totalStudents}{" "}
            • Report cards: {validReports.length}
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
      </div>

      {/* SCREEN-ONLY GENERATION WARNINGS */}
      {failedReports.length > 0 && (
        <div
          className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 print:hidden"
          role="status"
        >
          {failedReports.length} report card(s) could not be
          generated and will not be printed. Check the report
          card API response and saved results for those students.
        </div>
      )}

      {/* REPORT CARDS */}
      {validReports.length > 0 ? (
        <div id="report-card-bundle">
          {validReports.map((item, index) => {
            const rc = item.reportCard!;

            return (
              <section
                key={rc.student?._id || `report-${index}`}
                className="report-card-student mb-10 bg-white p-4 shadow-sm print:mb-0 print:p-0 print:shadow-none"
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
      ) : (
        <div className="rounded-md bg-white p-6 text-gray-600 print:hidden">
          No valid report cards are available for this class,
          session, and term.
        </div>
      )}
    </main>
  );
}
