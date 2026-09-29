"use client";

import React, { useMemo } from "react";
import { ReportCardSubject } from "../../types/report-card";

type Props = {
  subjects?: ReportCardSubject[];
  brandColor?: string;
};

export default function ReportCardSubjectTable({
  subjects = [],
  brandColor = "#0f766e",
}: Props) {
  const safeSubjects = useMemo(() => {
    return subjects.map((sub) => ({
      ...sub,
      ca1: sub.ca1 || 0,
      ca2: sub.ca2 || 0,
      assignment: sub.assignment || 0,
      exam: sub.exam || 0,
      total: sub.total || 0,
      grade: sub.grade || "-",
      remark: sub.remark || "-",
    }));
  }, [subjects]);

  return (
    <div className="w-full overflow-x-auto border rounded-md print:border-black">
      <table className="w-full text-sm border-collapse">

        {/* ================= HEADER ================= */}
        <thead
  className="text-white"
  style={{
    backgroundColor: brandColor,
  }}
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

        {/* ================= BODY ================= */}
        <tbody>
          {safeSubjects.length > 0 ? (
            safeSubjects.map((sub, index) => (
              <tr
                key={sub._id || index}
                className="border-b hover:bg-gray-50 print:hover:bg-transparent"
              >
                {/* SUBJECT */}
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

                {/* CA1 */}
                <td className="p-2 border text-center">
                  {sub.ca1}
                </td>

                {/* CA2 */}
                <td className="p-2 border text-center">
                  {sub.ca2}
                </td>

                {/* ASSIGNMENT */}
                <td className="p-2 border text-center">
                  {sub.assignment}
                </td>

                {/* EXAM */}
                <td className="p-2 border text-center font-semibold">
                  {sub.exam}
                </td>

                {/* TOTAL */}
                <td className="p-2 border text-center font-bold">
                  {sub.total}
                </td>

                {/* GRADE */}
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

                {/* REMARK */}
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