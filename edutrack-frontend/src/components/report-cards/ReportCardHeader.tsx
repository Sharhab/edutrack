"use client";

import React from "react";
import {
  ReportCardStudent,
  SessionInfo,
  TermInfo,
} from "../../types/report-card";

type Props = {
  student: ReportCardStudent;
  session: SessionInfo;
  term: TermInfo;

  schoolName?: string;
  schoolAddress?: string;
  schoolLogo?: string;
  brandColor?: string;
};

export default function ReportCardHeader({
  student,
  session,
  term,
  schoolName,
  schoolAddress,
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
      {/* =====================================================
          TOP HEADER
          PASSPORT LEFT | SCHOOL DETAILS CENTER | LOGO RIGHT
      ===================================================== */}

      <div className="grid grid-cols-[100px_1fr_100px] items-center gap-5">
        {/* STUDENT PASSPORT */}
        <div className="flex justify-start">
          <div className="flex h-24 w-20 items-center justify-center overflow-hidden rounded-lg border-2 border-white/70 bg-white/20">
            {/* 
              The current ReportCardStudent type does not provide
              a passport/photo field, so we intentionally do not
              invent one here.
            */}
            <span className="text-center text-[10px] font-medium text-white/70">
              Passport
            </span>
          </div>
        </div>

        {/* SCHOOL INFORMATION */}
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide md:text-3xl">
            {schoolName || ""}
          </h1>

          {schoolAddress && (
            <p className="mt-1 text-sm opacity-90">
              {schoolAddress}
            </p>
          )}

          <p className="mt-2 text-sm font-medium uppercase tracking-wider opacity-95">
            Student Academic Report Card
          </p>

          <div className="mt-2 flex items-center justify-center gap-3 text-sm font-semibold">
            <span>{session.name}</span>

            <span className="opacity-50">|</span>

            <span>{term.name}</span>
          </div>
        </div>

        {/* SCHOOL LOGO */}
        <div className="flex justify-end">
          {schoolLogo ? (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white p-2">
              <img
                src={schoolLogo}
                alt="School logo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/70 bg-white/10">
              <span className="text-center text-[10px] text-white/70">
                Logo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          STUDENT PROFILE
          HORIZONTAL LAYOUT
      ===================================================== */}

      <div className="mt-6 border-t border-white/20 pt-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
          {/* STUDENT NAME */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Student Name
            </p>

            <p className="mt-1 font-semibold">
              {student.firstName} {student.lastName}
            </p>
          </div>

          {/* ADMISSION NUMBER */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Admission No
            </p>

            <p className="mt-1 font-semibold">
              {student.admissionNumber}
            </p>
          </div>

          {/* CLASS */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Class
            </p>

            <p className="mt-1 font-semibold">
              {student.className}
            </p>
          </div>

          {/* POSITION */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Position
            </p>

            <p className="mt-1 text-xl font-bold">
              {student.positionLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
