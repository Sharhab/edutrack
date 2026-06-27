"use client";

import React from "react";
import { StudentReportCard } from "../../types/report-card";

import ReportCardHeader from "./ReportCardHeader";
import ReportCardSummary from "./ReportCardSummary";
import ReportCardSubjectTable from "./ReportCardSubjectTable";
import ReportCardAttendance from "./ReportCardAttendance";
import ReportCardFooter from "./ReportCardFooter";

type Props = {
  data: StudentReportCard;
  schoolName?: string;
  schoolLogo?: string;
  brandColor?: string;
};

export default function ReportCardTemplate({
  data,
  schoolName,
  schoolLogo,
  brandColor = "#0f766e",
}: Props) {
  const {
    student,
    session,
    term,
    results,
    summary,
    attendance,
  } = data;

  return (
    <div className="bg-white max-w-5xl mx-auto rounded-2xl shadow-lg overflow-hidden print:shadow-none">
      <ReportCardHeader
        student={student}
        session={session}
        term={term}
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        brandColor={brandColor}
      />

      <div className="p-6 space-y-6">
        <ReportCardSummary
          summary={summary}
          brandColor={brandColor}
        />

        <ReportCardSubjectTable
          subjects={results}
          brandColor={brandColor}
        />

        <ReportCardAttendance
          attendance={attendance}
          brandColor={brandColor}
        />

        <ReportCardFooter />
      </div>
    </div>
  );
}