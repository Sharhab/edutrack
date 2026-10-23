
"use client";

import React from "react";

import type {
  ReportCardSummary as ReportCardSummaryType,
} from "../../types/report-card";

type Props = {
  summary: ReportCardSummaryType;
  brandColor?: string;
};

export default function ReportCardSummary({
  summary,
  brandColor = "#0f766e",
}: Props) {
  const formatScore = (
    value: number | string | null | undefined
  ) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toFixed(2)
      : String(value);
  };

  const cards = [
    {
      title: "Subjects",
      value: summary.subjectsCount,
    },
    {
      title: "Total Score",
      value: formatScore(summary.totalScore),
    },
    {
      title: "Student Average",
      value: formatScore(summary.averageScore),
    },
    {
      title: "Position",
      value: summary.positionLabel || "Not ranked",
    },
    {
      title: "Class Average",
      value: formatScore(summary.classAverage),
    },
    {
      title: "Highest in Class",
      value: formatScore(summary.highestInClass),
    },
    {
      title: "Lowest in Class",
      value: formatScore(summary.lowestInClass),
    },
    {
      title: "Students Ranked",
      value: summary.rankedStudents ?? "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map((card) => (
        <div
          key={card.title}
          className="min-w-0 rounded-md p-2 text-white"
          style={{
            backgroundColor: brandColor,
            breakInside: "avoid",
          }}
        >
          <p className="text-xs font-medium opacity-90">
            {card.title}
          </p>

          <p className="mt-1 text-lg font-bold leading-tight break-words">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
