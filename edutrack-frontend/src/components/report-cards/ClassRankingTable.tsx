"use client";

import React from "react";
import { RankingStudent } from "../../types/report-card";
import StudentRankBadge from "./StudentRankBadge";

type Props = {
  students: RankingStudent[];
  showSubjects?: boolean;
};

export default function ClassRankingTable({
  students,
  showSubjects = false,
}: Props) {
  if (!students || students.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 border border-white/10 rounded-md bg-white/[0.03]">
        No ranking data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-white/10 rounded-md bg-black/20 print:border-black">
      <table className="w-full text-sm border-collapse text-slate-200">

        {/* HEADER */}
        <thead className="bg-black/40 text-slate-300 print:bg-white">
          <tr>
            <th className="p-3 text-left border border-white/10">Rank</th>
            <th className="p-3 text-left border border-white/10">Student</th>
            <th className="p-3 text-left border border-white/10">Admission No</th>
            <th className="p-3 text-left border border-white/10">Total Score</th>
            <th className="p-3 text-left border border-white/10">Average</th>

            {showSubjects && (
              <th className="p-3 text-left border border-white/10">
                Subjects
              </th>
            )}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {students.map((student) => {
            const isTop3 = student.position <= 3;

            return (
              <tr
                key={student.studentId}
                className={`border-b border-white/5 transition ${
                  isTop3
                    ? "bg-yellow-500/5"
                    : "hover:bg-white/5"
                }`}
              >
                {/* RANK */}
                <td className="p-3 border border-white/10">
                  <StudentRankBadge
                    position={student.position}
                    positionLabel={student.positionLabel}
                  />
                </td>

                {/* NAME */}
                <td className="p-3 border border-white/10 font-medium text-white">
                  {student.firstName} {student.lastName}
                </td>

                {/* ADMISSION */}
                <td className="p-3 border border-white/10 text-slate-300">
                  {student.admissionNumber}
                </td>

                {/* TOTAL */}
                <td className="p-3 border border-white/10 font-semibold text-cyan-400">
                  {student.totalScore}
                </td>

                {/* AVERAGE */}
                <td className="p-3 border border-white/10 text-slate-200">
                  {student.averageScore}
                </td>

                {/* SUBJECTS */}
                {showSubjects && (
                  <td className="p-3 border border-white/10 text-xs text-slate-400">
                    {student.subjects?.length || 0} subjects
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}