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
  const percentage =
    attendance.total > 0
      ? Math.round(
          (attendance.present / attendance.total) * 100
        )
      : 0;

  return (
    <div className="border rounded-md p-4 bg-white print:border-black">
      {/* ================= HEADER ================= */}
      <h3
  className="font-bold mb-4"
  style={{
    color: brandColor,
  }}
>
  Attendance
</h3>
      {/* ================= GRID ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {/* TOTAL DAYS */}
        <div className="p-3 border rounded">
          <p className="text-gray-500 text-xs">
            Total Days
          </p>
          <p className="font-bold text-lg">
            {attendance.total}
          </p>
        </div>

        {/* PRESENT */}
        <div className="p-3 border rounded bg-green-50">
          <p className="text-gray-500 text-xs">
            Present
          </p>
          <p className="font-bold text-lg text-green-600">
            {attendance.present}
          </p>
        </div>

        {/* ABSENT */}
        <div className="p-3 border rounded bg-red-50">
          <p className="text-gray-500 text-xs">
            Absent
          </p>
          <p className="font-bold text-lg text-red-600">
            {attendance.absent}
          </p>
        </div>

        {/* LATE */}
        <div className="p-3 border rounded bg-yellow-50">
          <p className="text-gray-500 text-xs">
            Late
          </p>
          <p className="font-bold text-lg text-yellow-600">
            {attendance.late}
          </p>
        </div>
      </div>

      {/* ================= PERFORMANCE BAR ================= */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Attendance Performance</span>
          <span className="font-semibold">
            {percentage}%
          </span>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded">
          <div
            className={`h-2 rounded ${
              percentage >= 75
                ? "bg-green-500"
                : percentage >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}