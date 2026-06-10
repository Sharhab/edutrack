"use client";

import React from "react";
import { ReportCardStudent, SessionInfo, TermInfo } from "../../types/report-card";

type Props = {
  student: ReportCardStudent;
  session: SessionInfo;
  term: TermInfo;

  schoolName?: string;
  schoolLogo?: string;
};

export default function ReportCardHeader({
  student,
  session,
  term,
  schoolName = "School Name",
  schoolLogo,
}: Props) {
  return (
    <div className="w-full border-b pb-4 mb-4 print:border-black">
      {/* ================= SCHOOL BRANDING ================= */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {schoolLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolLogo}
              alt="School Logo"
              className="w-14 h-14 object-contain"
            />
          ) : (
            <div className="w-14 h-14 bg-gray-200 rounded" />
          )}

          <div>
            <h1 className="text-xl font-bold uppercase">
              {schoolName}
            </h1>

            <p className="text-xs text-gray-500">
              Academic Report Card
            </p>
          </div>
        </div>

        {/* SESSION + TERM */}
        <div className="text-right text-sm">
          <p>
            <span className="font-semibold">Session:</span>{" "}
            {session.name}
          </p>

          <p>
            <span className="font-semibold">Term:</span>{" "}
            {term.name}
          </p>
        </div>
      </div>

      {/* ================= STUDENT INFO ================= */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p>
            <span className="font-semibold">Name:</span>{" "}
            {student.firstName} {student.lastName}
          </p>

          <p>
            <span className="font-semibold">Admission No:</span>{" "}
            {student.admissionNumber}
          </p>
        </div>

        <div>
          <p>
            <span className="font-semibold">Class:</span>{" "}
            {student.className}
          </p>

          {student.classLevel && (
            <p>
              <span className="font-semibold">Level:</span>{" "}
              {student.classLevel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}