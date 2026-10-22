"use client";

import React from "react";

import type {
  ReportCardSummary as ReportCardSummaryType,
  RankingStudent,
} from "../../types/report-card";

type Props = {
  summary: ReportCardSummaryType;
  brandColor?: string;
};

export default function ReportCardSummary({
  summary,
  brandColor = "#0f766e",
}: Props) {
  const cards = [
    {
      title: "Subjects",
      value: summary.subjectsCount,
    },
    {
      title: "Total",
      value: summary.totalScore,
    },
    {
      title: "Average",
      value: summary.averageScore,
    },
    {
      title: "Position",
      value: summary.positionLabel,
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
    {card.value ?? "—"}
  </p>
</div>
      ))}
    </div>
  );
}
