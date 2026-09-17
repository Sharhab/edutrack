
"use client";

import React from "react";
import { AttendanceSummary } from "../../types/report-card";

type Props = {
  attendance: AttendanceSummary;
  brandColor?: string;
};

export default function ReportCardAttendance({
  attendance,
  brandColor = "#0f766e",
}: Props) {
  const total = Number(attendance?.total ?? 0);
  const present = Number(attendance?.present ?? 0);
  const absent = Number(attendance?.absent ?? 0);
  const late = Number(attendance?.late ?? 0);

  const calculatedPercentage =
    total > 0
      ? Math.round((present / total) * 100)
      : 0;

  const percentage = Math.max(
    0,
    Math.min(
      100,
      Number(
        attendance?.percentage ?? calculatedPercentage
      )
    )
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white print:rounded-none">
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{
          backgroundColor: `${brandColor}10`,
          borderBottom: `1px solid ${brandColor}25`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-wide"
              style={{ color: brandColor }}
            >
              Attendance Record
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Student attendance for the academic period
            </p>
          </div>

          <div
            className="rounded-lg px-3 py-1.5 text-sm font-bold"
            style={{
              color: brandColor,
              backgroundColor: `${brandColor}15`,
            }}
          >
            {percentage}%
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        <AttendanceStat
          label="Total Days"
          value={total}
          className="border-b sm:border-b-0 sm:border-r"
        />

        <AttendanceStat
          label="Present"
          value={present}
          className="border-b sm:border-b-0 sm:border-r"
          valueClassName="text-green-600"
        />

        <AttendanceStat
          label="Absent"
          value={absent}
          className="border-r"
          valueClassName="text-red-600"
        />

        <AttendanceStat
          label="Late"
          value={late}
          className=""
          valueClassName="text-amber-600"
        />
      </div>

      {/* Attendance Progress */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">
            Attendance Percentage
          </span>

          <span
            className="text-xs font-bold"
            style={{ color: brandColor }}
          >
            {percentage}%
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: brandColor,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   ATTENDANCE STAT
================================================================ */

type AttendanceStatProps = {
  label: string;
  value: number;
  className?: string;
  valueClassName?: string;
};

function AttendanceStat({
  label,
  value,
  className = "",
  valueClassName = "text-gray-900",
}: AttendanceStatProps) {
  return (
    <div
      className={`min-h-[82px] px-4 py-4 ${className} border-gray-200`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}
