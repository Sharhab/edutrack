"use client";

import React from "react";
import { StudentReportCard } from "../../types/report-card";

import ReportCardHeader from "./ReportCardHeader";
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

  const studentName =
    `${student?.firstName || ""} ${
      student?.lastName || ""
    }`.trim() || "—";

  return (
    <div
      className="
        w-full
        max-w-5xl
        mx-auto
        bg-white
        text-gray-900
        overflow-hidden
        rounded-2xl
        shadow-xl
        print:max-w-none
        print:rounded-none
        print:shadow-none
      "
    >
      {/* =====================================================
          SCHOOL HEADER
      ====================================================== */}
      <ReportCardHeader
        student={student}
        session={session}
        term={term}
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        brandColor={brandColor}
      />

      <main className="p-5 sm:p-6 md:p-8 print:p-5">

        {/* ===================================================
            STUDENT INFORMATION
        ==================================================== */}
        <section className="mb-7 print:mb-5">
          <SectionHeading
            title="Student Information"
            brandColor={brandColor}
          />

          <div className="overflow-hidden rounded-xl border border-gray-200 print:rounded-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

              <InfoItem
                label="Student Name"
                value={studentName}
              />

              <InfoItem
                label="Admission Number"
                value={
                  student?.admissionNumber ||
                  "—"
                }
              />

              <InfoItem
                label="Class"
                value={
                  student?.className ||
                  "—"
                }
              />

              <InfoItem
                label="Gender"
                value={
                  student?.gender ||
                  "—"
                }
              />

              <InfoItem
                label="Academic Session"
                value={
                  session?.name ||
                  "—"
                }
              />

              <InfoItem
                label="Term"
                value={
                  term?.name ||
                  "—"
                }
              />

            </div>
          </div>
        </section>

        {/* ===================================================
            OVERALL PERFORMANCE
        ==================================================== */}
        <section className="mb-7 print:mb-5">
          <SectionHeading
            title="Overall Academic Performance"
            brandColor={brandColor}
          />

          <ReportCardSummary
            summary={summary}
            brandColor={brandColor}
          />
        </section>

        {/* ===================================================
            SUBJECT RESULTS
        ==================================================== */}
        <section className="mb-7 print:mb-5">
          <SectionHeading
            title="Academic Performance by Subject"
            brandColor={brandColor}
          />

          <div className="overflow-hidden rounded-xl border border-gray-200 print:rounded-none">
            <ReportCardSubjectTable
              subjects={results}
              brandColor={brandColor}
            />
          </div>
        </section>

        {/* ===================================================
            ATTENDANCE
        ==================================================== */}
        <section className="mb-7 print:mb-5">
          <SectionHeading
            title="Attendance Record"
            brandColor={brandColor}
          />

          <ReportCardAttendance
            attendance={attendance}
            brandColor={brandColor}
          />
        </section>

        {/* ===================================================
            GRADING SCALE
        ==================================================== */}
        <section className="mb-7 print:mb-5">
          <SectionHeading
            title="Grading Scale"
            brandColor={brandColor}
          />

          <GradingScale />
        </section>

        {/* ===================================================
            COMMENTS AND APPROVAL
        ==================================================== */}
        <section className="mb-2">
          <SectionHeading
            title="Assessment & Approval"
            brandColor={brandColor}
          />

          <AssessmentApproval
            brandColor={brandColor}
          />
        </section>
      </main>

      {/* =====================================================
          EXISTING FOOTER
      ====================================================== */}
      <ReportCardFooter />
    </div>
  );
}

/* ===========================================================
   SECTION HEADING
=========================================================== */

type SectionHeadingProps = {
  title: string;
  brandColor: string;
};

function SectionHeading({
  title,
  brandColor,
}: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3 mb-3 print:mb-2">
      <div
        className="h-6 w-1 rounded-full"
        style={{
          backgroundColor: brandColor,
        }}
      />

      <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-gray-800">
        {title}
      </h2>
    </div>
  );
}

/* ===========================================================
   INFORMATION ITEM
=========================================================== */

type InfoItemProps = {
  label: string;
  value: string | number;
};

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div
      className="
        min-h-[68px]
        border-b
        border-r
        border-gray-200
        px-4
        py-3
      "
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="text-sm font-semibold text-gray-900 break-words">
        {value}
      </p>
    </div>
  );
}

/* ===========================================================
   GRADING SCALE
=========================================================== */

function GradingScale() {
  const grades = [
    {
      grade: "A",
      range: "70 – 100",
      meaning: "Excellent",
    },
    {
      grade: "B",
      range: "60 – 69",
      meaning: "Very Good",
    },
    {
      grade: "C",
      range: "50 – 59",
      meaning: "Good",
    },
    {
      grade: "D",
      range: "45 – 49",
      meaning: "Pass",
    },
    {
      grade: "E",
      range: "40 – 44",
      meaning: "Weak Pass",
    },
    {
      grade: "F",
      range: "0 – 39",
      meaning: "Fail",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 print:rounded-none">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border-b border-gray-200 px-3 py-2 text-left font-bold">
              Grade
            </th>

            <th className="border-b border-gray-200 px-3 py-2 text-left font-bold">
              Score Range
            </th>

            <th className="border-b border-gray-200 px-3 py-2 text-left font-bold">
              Remark
            </th>
          </tr>
        </thead>

        <tbody>
          {grades.map((item) => (
            <tr key={item.grade}>
              <td className="border-b border-gray-100 px-3 py-2 font-bold">
                {item.grade}
              </td>

              <td className="border-b border-gray-100 px-3 py-2">
                {item.range}
              </td>

              <td className="border-b border-gray-100 px-3 py-2">
                {item.meaning}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===========================================================
   ASSESSMENT / APPROVAL
=========================================================== */

type AssessmentApprovalProps = {
  brandColor: string;
};

function AssessmentApproval({
  brandColor,
}: AssessmentApprovalProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 print:rounded-none">

      {/* Teacher Comment */}
      <div className="mb-5">
        <p
          className="mb-2 text-xs font-bold uppercase tracking-wide"
          style={{
            color: brandColor,
          }}
        >
          Class Teacher's Comment
        </p>

        <div className="min-h-[70px] rounded-lg border border-gray-200 bg-gray-50 p-3 print:bg-white">
          <div className="border-b border-dashed border-gray-300" />
          <div className="mt-6 border-b border-dashed border-gray-300" />
        </div>
      </div>

      {/* Principal Comment */}
      <div className="mb-6">
        <p
          className="mb-2 text-xs font-bold uppercase tracking-wide"
          style={{
            color: brandColor,
          }}
        >
          Principal / Head Teacher's Comment
        </p>

        <div className="min-h-[70px] rounded-lg border border-gray-200 bg-gray-50 p-3 print:bg-white">
          <div className="border-b border-dashed border-gray-300" />
          <div className="mt-6 border-b border-dashed border-gray-300" />
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-1 gap-8 pt-3 sm:grid-cols-3 sm:gap-5">

        <SignatureLine
          label="Class Teacher"
          brandColor={brandColor}
        />

        <SignatureLine
          label="Principal / Head Teacher"
          brandColor={brandColor}
        />

        <SignatureLine
          label="Date"
          brandColor={brandColor}
        />

      </div>
    </div>
  );
}

/* ===========================================================
   SIGNATURE LINE
=========================================================== */

type SignatureLineProps = {
  label: string;
  brandColor: string;
};

function SignatureLine({
  label,
  brandColor,
}: SignatureLineProps) {
  return (
    <div className="pt-8">
      <div
        className="border-t"
        style={{
          borderTopColor: brandColor,
        }}
      />

      <p className="mt-2 text-center text-[11px] font-semibold text-gray-600">
        {label}
      </p>
    </div>
  );
}
