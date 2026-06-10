"use client";

import React from "react";
import { StudentReportCard } from "../../types/report-card";

import ReportCardHeader from "./ReportCardHeader";
import ReportCardSummary from "./ReportCardSummary";
import ReportCardSubjectTable from "./ReportCardSubjectTable";
import ReportCardAttendance from "./ReportCardAttendance";
import ReportCardFooter from "./ReportCardFooter";
import StudentRankBadge from "./StudentRankBadge";

type Props = {
  data: StudentReportCard;
};

export default function ReportCardTemplate({
  data,
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
    <div
      className="
        w-full
        bg-white
        text-gray-800

        print:bg-white
        print:shadow-none
        print:rounded-none

        break-inside-avoid-page
        print:break-inside-avoid
      "
    >
      {/* HEADER */}
      <div className="print:break-inside-avoid">
        <ReportCardHeader
          student={student}
          session={session}
          term={term}
        />
      </div>

      {/* POSITION */}
      <div className="flex justify-end px-4 mb-4 print:break-inside-avoid">
        <StudentRankBadge
          position={summary.position}
          positionLabel={summary.positionLabel}
        />
      </div>

      {/* SUMMARY */}
      <div className="px-4 print:break-inside-avoid">
        <ReportCardSummary
          summary={summary}
        />
      </div>

      {/* SUBJECT RESULTS */}
      <div className="px-4 mt-4 print:break-inside-avoid">
        <ReportCardSubjectTable
          subjects={results}
        />
      </div>

      {/* ATTENDANCE */}
      <div className="px-4 mt-4 print:break-inside-avoid">
        <ReportCardAttendance
          attendance={attendance}
        />
      </div>

      {/* FOOTER */}
      <div className="px-4 pb-4 print:break-inside-avoid">
        <ReportCardFooter />
      </div>
    </div>
  );
}