"use client";

import React from "react";

import type {
  ReportCardSummary as ReportCardSummaryType,
  RankingStudent,
} from "../../types/report-card";

type Props = {
  summary: ReportCardSummaryType;
  student?: RankingStudent;
};

export default function ReportCardSummary({
  summary,
  student,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

      {/* TOTAL SUBJECTS */}
      <div className="p-3 border rounded-md bg-white print:border-black">
        <p className="text-xs text-gray-500">Subjects</p>
        <p className="text-lg font-semibold">
          {summary.subjectsCount}
        </p>
      </div>

      {/* TOTAL SCORE */}
      <div className="p-3 border rounded-md bg-white print:border-black">
        <p className="text-xs text-gray-500">Total Score</p>
        <p className="text-lg font-semibold">
          {summary.totalScore}
        </p>
      </div>

      {/* AVERAGE SCORE */}
      <div className="p-3 border rounded-md bg-white print:border-black">
        <p className="text-xs text-gray-500">Average</p>
        <p className="text-lg font-semibold">
          {summary.averageScore}
        </p>
      </div>

      {/* POSITION */}
      <div className="p-3 border rounded-md bg-white print:border-black">
        <p className="text-xs text-gray-500">Position</p>

        <div className="flex items-center gap-2">
          <p className="text-lg font-bold">
            {summary.positionLabel || "N/A"}
          </p>

          {summary.position && summary.position <= 3 && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                summary.position === 1
                  ? "bg-yellow-400 text-black"
                  : summary.position === 2
                  ? "bg-gray-300 text-black"
                  : "bg-orange-300 text-black"
              }`}
            >
              Top {summary.position}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}