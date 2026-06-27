"use client";

import React from "react";
import { ReportCardStudent, SessionInfo, TermInfo } from "../../types/report-card";


type Props = {
  student: ReportCardStudent;
  session: SessionInfo;
  term: TermInfo;
  schoolName?: string;
  schoolLogo?: string;
  brandColor?: string;
};

export default function ReportCardHeader({
  student,
  session,
  term,
  schoolName,
  schoolLogo,
  brandColor = "#0f766e",
}: Props) {
  return (
    <div
      className="text-white p-6"
      style={{
        backgroundColor: brandColor,
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {schoolLogo && (
            <img
              src={schoolLogo}
              alt="logo"
              className="w-20 h-20 rounded-full bg-white p-2 object-contain"
            />
          )}

          <div>
            <h1 className="text-3xl font-bold uppercase">
              {schoolName}
            </h1>

            <p className="opacity-90">
              Student Academic Report Card
            </p>
          </div>
        </div>

        <div className="text-right">
          <p>{session.name}</p>
          <p>{term.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
        <div>
          <p className="opacity-80">
            Student Name
          </p>
          <p className="font-semibold">
            {student.firstName}{" "}
            {student.lastName}
          </p>
        </div>

        <div>
          <p className="opacity-80">
            Admission No
          </p>
          <p className="font-semibold">
            {student.admissionNumber}
          </p>
        </div>

        <div>
          <p className="opacity-80">
            Class
          </p>
          <p className="font-semibold">
            {student.className}
          </p>
        </div>

        <div>
          <p className="opacity-80">
            Position
          </p>
          <p className="font-bold text-xl">
            {student.positionLabel}
          </p>
        </div>
      </div>
    </div>
  );
}