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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl p-4 text-white shadow"
          style={{
            backgroundColor:
              brandColor,
          }}
        >
          <p className="text-sm opacity-80">
            {card.title}
          </p>

          <p className="text-2xl font-bold">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}