"use client";

import React, { useMemo } from "react";
import type { ReportCardSubject } from "../../types/report-card";

type Props = {
  subjects?: ReportCardSubject[];
  brandColor?: string;
};

const formatMark = (
  value: number | string | null | undefined
): number | string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
};

export default function ReportCardSubjectTable({
  subjects = [],
  brandColor = "#06b6d4",
}: Props) {
  const safeSubjects = useMemo(() => {
    return (subjects ?? []).map((sub) => ({
      ...sub,
      grade: sub.grade || "—",
      remark: sub.remark || "—",
    }));
  }, [subjects]);

  return (
    <div className="w-full overflow-x-auto border rounded-md print:border-black">
      <table className="w-full text-sm border-collapse report-subject-table">
        <thead
          className="text-white"
          style={{ backgroundColor: brandColor }}
        >
          <tr>
            <th className="p-2 border">Subject</th>
            <th className="p-2 border text-center">CA1</th>
            <th className="p-2 border text-center">CA2</th>
            <th className="p-2 border text-center">Assignment</th>
            <th className="p-2 border text-center">Exam</th>
            <th className="p-2 border text-center">Total</th>
            <th className="p-2 border text-center">Grade</th>
            <th className="p-2 border">Remark</th>
          </tr>
        </thead>

        <tbody>
          {safeSubjects.length > 0 ? (
            safeSubjects.map((sub, index) => (
              <tr
                key={sub._id || index}
                className="border-b hover:bg-gray-50 print:hover:bg-transparent"
              >
                <td className="p-2 border">
                  <div className="font-medium">
                    {sub.subjectName}
                  </div>

                  {sub.subjectCode && (
                    <div className="text-xs text-gray-500">
                      {sub.subjectCode}
                    </div>
                  )}
                </td>

                <td className="p-2 border text-center">
                  {formatMark(sub.ca1)}
                </td>

                <td className="p-2 border text-center">
                  {formatMark(sub.ca2)}
                </td>

                <td className="p-2 border text-center">
                  {formatMark(sub.assignment)}
                </td>

                <td className="p-2 border text-center font-semibold">
                  {formatMark(sub.exam)}
                </td>

                <td className="p-2 border text-center font-bold">
                  {formatMark(sub.total)}
                </td>

                <td className="p-2 border text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      sub.grade === "A"
                        ? "bg-green-200"
                        : sub.grade === "B"
                          ? "bg-blue-200"
                          : sub.grade === "C"
                            ? "bg-yellow-200"
                            : sub.grade === "F"
                              ? "bg-red-200"
                              : "bg-gray-200"
                    }`}
                  >
                    {sub.grade}
                  </span>
                </td>

                <td className="p-2 border text-sm">
                  {sub.remark}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={8}
                className="text-center p-4 text-gray-500"
              >
                No subjects available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
