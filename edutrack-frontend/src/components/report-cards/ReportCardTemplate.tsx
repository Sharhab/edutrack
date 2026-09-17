"use client";

import React from "react";
import { StudentReportCard } from "../../types/report-card";

import ReportCardSummary from "./ReportCardSummary";
import ReportCardSubjectTable from "./ReportCardSubjectTable";
import ReportCardAttendance from "./ReportCardAttendance";
import ReportCardFooter from "./ReportCardFooter";

type Props = {
  data: StudentReportCard;
  schoolName?: string;
  schoolLogo?: string;
  brandColor?: string;
};

export default function ReportCardTemplate({
  data,
  schoolName,
  schoolLogo,
  brandColor = "#0f766e",
}: Props) {
  const {
    student,
    session,
    term,
    results,
    summary,
    attendance,
  } = data;

  /*
   * The current ReportCardStudent type may not yet contain photo.
   * This keeps the component compatible without changing the type file.
   */
  const studentWithPhoto = student as typeof student & {
    photo?: string;
    passport?: string;
    passportPhoto?: string;
    image?: string;
    profilePhoto?: string;
  };

  const studentPhoto =
    studentWithPhoto.photo ||
    studentWithPhoto.passport ||
    studentWithPhoto.passportPhoto ||
    studentWithPhoto.image ||
    studentWithPhoto.profilePhoto ||
    "";

  const studentName =
    `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
    "—";

  return (
    <div
      className="bg-white max-w-5xl mx-auto rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none"
      style={{
        color: "#111827",
      }}
    >
      {/* =========================================================
          SCHOOL + STUDENT HEADER
      ========================================================= */}
      <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-[1fr_130px] min-h-[175px]">
          {/* =====================================================
              SCHOOL INFORMATION
          ===================================================== */}
          <div
            className="relative flex flex-col items-center justify-center text-center px-8 py-6 border-r border-gray-300"
            style={{
              borderTop: `6px solid ${brandColor}`,
            }}
          >
            {/* SCHOOL LOGO - ALWAYS SHOW THE SPACE */}
            <div
              className="w-24 h-24 rounded-full border-2 flex items-center justify-center overflow-hidden bg-gray-50 mb-3 shrink-0"
              style={{
                borderColor: brandColor,
              }}
            >
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center px-2">
                  <div
                    className="text-[10px] font-bold uppercase"
                    style={{
                      color: brandColor,
                    }}
                  >
                    School
                  </div>

                  <div className="text-[8px] text-gray-400 mt-1">
                    Logo
                  </div>
                </div>
              )}
            </div>

            {/* SCHOOL NAME */}
            <h1
              className="text-xl md:text-2xl font-extrabold uppercase tracking-wide leading-tight"
              style={{
                color: brandColor,
              }}
            >
              {schoolName || "SCHOOL NAME"}
            </h1>

            {/* REPORT TITLE */}
            <p className="mt-1 text-sm md:text-base font-bold uppercase text-gray-800">
              Academic Report Card
            </p>

            {/* SESSION + TERM */}
            <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-gray-600">
              <span>
                <strong>Session:</strong>{" "}
                {session?.name || "—"}
              </span>

              <span>
                <strong>Term:</strong>{" "}
                {term?.name || "—"}
              </span>
            </div>
          </div>

          {/* =====================================================
              STUDENT PASSPORT
          ===================================================== */}
          <div className="flex flex-col items-center justify-center px-3 py-4 bg-gray-50">
            <div
              className="w-[100px] h-[115px] border-2 bg-white flex items-center justify-center overflow-hidden shrink-0"
              style={{
                borderColor: brandColor,
              }}
            >
              {studentPhoto ? (
                <img
                  src={studentPhoto}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center px-2">
                  <div
                    className="text-[10px] font-bold uppercase"
                    style={{
                      color: brandColor,
                    }}
                  >
                    Student
                  </div>

                  <div className="text-[9px] font-semibold text-gray-500 uppercase mt-1">
                    Passport
                  </div>

                  <div className="text-[8px] text-gray-400 mt-1">
                    Photograph
                  </div>
                </div>
              )}
            </div>

            <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-gray-600">
              Student Passport
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <div className="p-6 space-y-6">
        {/* =======================================================
            STUDENT INFORMATION
        ======================================================= */}
        <section>
          <div
            className="flex items-center gap-2 mb-3"
            style={{
              color: brandColor,
            }}
          >
            <div
              className="w-1 h-5 rounded-full"
              style={{
                backgroundColor: brandColor,
              }}
            />

            <h2 className="text-sm font-extrabold uppercase tracking-wide">
              Student Information
            </h2>
          </div>

          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {/* STUDENT NAME */}
              <div className="px-4 py-3 border-b border-r border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Student Name
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {studentName}
                </p>
              </div>

              {/* ADMISSION NUMBER */}
              <div className="px-4 py-3 border-b border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Admission Number
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {student?.admissionNumber || "—"}
                </p>
              </div>

              {/* CLASS */}
              <div className="px-4 py-3 border-b border-r border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Class
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {student?.className || "—"}
                </p>
              </div>

              {/* GENDER */}
              <div className="px-4 py-3 border-b border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Gender
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900 capitalize">
                  {student?.gender || "—"}
                </p>
              </div>

              {/* ACADEMIC SESSION */}
              <div className="px-4 py-3 border-r border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Academic Session
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {session?.name || "—"}
                </p>
              </div>

              {/* TERM */}
              <div className="px-4 py-3 md:border-r border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Term
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {term?.name || "—"}
                </p>
              </div>

              {/* REPORT TYPE */}
              <div className="px-4 py-3 border-t md:border-t-0 border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Report Type
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  Academic Report
                </p>
              </div>

              {/* CLASS POSITION */}
              <div className="px-4 py-3 border-t border-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Class Position
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {summary?.positionLabel || "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            OVERALL PERFORMANCE
        ======================================================= */}
        <section>
          <ReportCardSummary
            summary={summary}
            brandColor={brandColor}
          />
        </section>

        {/* =======================================================
            ACADEMIC PERFORMANCE
        ======================================================= */}
        <section>
          <ReportCardSubjectTable
            subjects={results}
            brandColor={brandColor}
          />
        </section>

        {/* =======================================================
            ATTENDANCE
        ======================================================= */}
        <section>
          <ReportCardAttendance
            attendance={attendance}
            brandColor={brandColor}
          />
        </section>

        {/* =======================================================
            FOOTER / SIGNATURE AREA
        ======================================================= */}
        <section>
          <ReportCardFooter />
        </section>
      </div>
    </div>
  );
}
