"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useReportCard } from "../../../../../../hooks/useReportCard";
import { generateStudentPdf } from "../../../../../../lib/report-card/generateStudentPdf";
import ReportCardTemplate from "../../../../../../components/report-cards/ReportCardTemplate";
import DownloadPdfButton from "../../../../../../components/report-cards/DownloadpdfButton";
import PrintButton from "../../../../../../components/report-cards/PrintButton";

export default function StudentReportCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const studentId = params.studentId as string;

  const sessionId =
    searchParams.get("sessionId") || "";

  const termId =
    searchParams.get("termId") || "";

  const {
    loading,
    error,
    reportCard,
    fetchStudentReportCard,
  } = useReportCard();

  /* =====================================
     FETCH REPORT
  ===================================== */

  useEffect(() => {
    if (
      !studentId ||
      !sessionId ||
      !termId
    )
      return;

    fetchStudentReportCard(studentId, {
      sessionId,
      termId,
    });
  }, [
    studentId,
    sessionId,
    termId,
    fetchStudentReportCard,
  ]);

  /* =====================================
     PDF DOWNLOAD
  ===================================== */

  const handleDownloadPdf =
    async () => {
      if (!reportCard) return;

      const pdf =
        await generateStudentPdf({
          reportCard,
        });

      pdf.save(
        `${reportCard.student.firstName}_${reportCard.student.lastName}_report_card.pdf`
      );
    };

  /* =====================================
     LOADING
  ===================================== */

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-gray-500">
          Loading report card...
        </div>
      </div>
    );
  }

  /* =====================================
     ERROR
  ===================================== */

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  /* =====================================
     EMPTY
  ===================================== */

  if (!reportCard) {
    return (
      <div className="p-6 text-gray-500">
        No report card found
      </div>
    );
  }

  /* =====================================
     PAGE
  ===================================== */

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen print:bg-white">

      <div className="flex justify-between items-center mb-4 print:hidden">
        <h1 className="text-xl font-bold">
          Student Report Card
        </h1>

        <div className="flex gap-2">
          <PrintButton />

          <DownloadPdfButton
            onClick={handleDownloadPdf}
          />
        </div>
      </div>

      <ReportCardTemplate
        data={reportCard}
      />
    </div>
  );
}