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
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolWebsite?: string;
};

type StudentWithOptionalPhoto = StudentReportCard["student"] & {
  photo?: string;
  passport?: string;
  passportPhoto?: string;
  image?: string;
  profilePicture?: string;
};

export default function ReportCardTemplate({
  data,
  schoolName = "SCHOOL NAME",
  schoolLogo,
  brandColor = "#0f766e",
  schoolAddress,
  schoolPhone,
  schoolEmail,
  schoolWebsite,
}: Props) {
  const {
    student,
    session,
    term,
    results,
    summary,
    attendance,
  } = data;

  const studentWithPhoto =
    student as StudentWithOptionalPhoto;

  const studentPhoto =
    studentWithPhoto.photo ||
    studentWithPhoto.passport ||
    studentWithPhoto.passportPhoto ||
    studentWithPhoto.image ||
    studentWithPhoto.profilePicture;

  const studentName =
  `${student?.firstName || ""} ${
    student?.lastName || ""
  }`.trim() || "—";

const sessionName =
  session?.name || "—";

const termName =
  term?.name || "—";

const className =
  student?.className || "—";

const gender =
  student?.gender || "—";

const admissionNumber =
  student?.admissionNumber || "—";
  
  return (
    <>
      <style jsx global>{`
        .report-card-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          color: #172033;
          margin: 0 auto;
          padding: 7mm 8mm 6mm;
          box-sizing: border-box;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          overflow: hidden;
        }

        .report-card-paper {
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          position: relative;
        }

        .report-card-header {
          display: grid;
          grid-template-columns: 27mm 1fr 27mm;
          align-items: center;
          min-height: 35mm;
          padding: 4mm 5mm;
          border-bottom: 2px solid ${brandColor};
          box-sizing: border-box;
        }

        .passport-area {
          width: 23mm;
          height: 28mm;
          border: 1px solid #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #f8fafc;
        }

        .passport-area img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .passport-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.4px;
          line-height: 1.4;
        }

        .school-heading {
          text-align: center;
          padding: 0 5mm;
          min-width: 0;
        }

        .school-name {
          margin: 0;
          font-size: 18px;
          line-height: 1.15;
          font-weight: 800;
          color: ${brandColor};
          text-transform: uppercase;
          letter-spacing: 0.3px;
          overflow-wrap: anywhere;
        }

        .school-address {
          margin-top: 2px;
          font-size: 7.5px;
          line-height: 1.25;
          color: #64748b;
        }

        .report-title {
          margin: 5px 0 2px;
          font-size: 13px;
          line-height: 1.1;
          font-weight: 800;
          color: #172033;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .session-term {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          font-size: 8px;
          color: #475569;
        }

        .session-term strong {
          color: #172033;
        }

        .logo-area {
          width: 23mm;
          height: 23mm;
          border: 1px solid #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #ffffff;
          justify-self: end;
        }

        .logo-area img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .logo-placeholder {
          text-align: center;
          color: #64748b;
          font-size: 7px;
          line-height: 1.4;
          font-weight: 700;
        }

        .report-content {
          padding: 4mm 5mm 3mm;
          box-sizing: border-box;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 2mm;
          padding-bottom: 1.2mm;
          border-bottom: 1px solid #cbd5e1;
        }

        .section-title-bar {
          width: 3px;
          height: 13px;
          border-radius: 2px;
          background: ${brandColor};
          flex-shrink: 0;
        }

        .section-title-text {
          margin: 0;
          font-size: 9px;
          line-height: 1;
          font-weight: 800;
          color: #172033;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .student-information {
          display: grid;
          grid-template-columns:
            1.55fr
            1.15fr
            0.9fr
            0.8fr
            1.05fr
            1.05fr;
          width: 100%;
          border: 1px solid #cbd5e1;
          margin-bottom: 4mm;
        }

        .student-info-item {
          min-width: 0;
          padding: 2.2mm 2.5mm;
          border-right: 1px solid #cbd5e1;
          box-sizing: border-box;
        }

        .student-info-item:last-child {
          border-right: 0;
        }

        .student-info-label {
          display: block;
          margin-bottom: 1px;
          color: #64748b;
          font-size: 6.5px;
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .student-info-value {
          display: block;
          color: #172033;
          font-size: 8px;
          line-height: 1.25;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .academic-section {
          width: 100%;
          margin-bottom: 4mm;
        }

        .academic-table-wrapper {
          width: 100%;
          overflow: hidden;
        }

        .academic-table-wrapper :global(table) {
          width: 100% !important;
          margin: 0 !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }

        .academic-table-wrapper :global(th),
        .academic-table-wrapper :global(td) {
          padding: 3px 4px !important;
          font-size: 7px !important;
          line-height: 1.15 !important;
        }

        .academic-table-wrapper :global(th) {
          white-space: nowrap !important;
        }

        .academic-table-wrapper :global(td) {
          word-break: break-word;
        }

        .horizontal-section-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          width: 100%;
          margin-bottom: 4mm;
        }

        .report-box {
          min-width: 0;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          box-sizing: border-box;
        }

        .report-box-title {
          min-height: 7mm;
          display: flex;
          align-items: center;
          padding: 0 3mm;
          background: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          color: ${brandColor};
          font-size: 7.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          box-sizing: border-box;
        }

        .report-box-body {
          padding: 2.5mm;
          box-sizing: border-box;
        }

        /*
         * The existing summary and attendance components keep their
         * functionality. This wrapper prevents them from expanding
         * outside their horizontal column.
         */
        .summary-box,
        .attendance-box {
          min-width: 0;
          overflow: hidden;
        }

        .comments-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          width: 100%;
          margin-bottom: 4mm;
        }

        .comment-box {
          min-height: 25mm;
          border: 1px solid #cbd5e1;
          box-sizing: border-box;
        }

        .comment-content {
          padding: 2.5mm 3mm;
          min-height: 18mm;
          box-sizing: border-box;
        }

        .comment-label {
          display: block;
          margin-bottom: 2mm;
          color: #64748b;
          font-size: 6.5px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .comment-text {
          color: #334155;
          font-size: 7.5px;
          line-height: 1.35;
        }

        .writing-lines {
          display: flex;
          flex-direction: column;
          gap: 5mm;
          padding-top: 1mm;
        }

        .writing-line {
          width: 100%;
          height: 1px;
          background: #cbd5e1;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          width: 100%;
          margin-bottom: 3mm;
        }

        .grading-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .grading-table th,
        .grading-table td {
          border: 1px solid #cbd5e1;
          padding: 1.7mm 1.5mm;
          text-align: center;
          font-size: 6.5px;
          line-height: 1.1;
        }

        .grading-table th {
          background: #f8fafc;
          color: #172033;
          font-weight: 800;
        }

        .approval-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          padding: 3mm;
          box-sizing: border-box;
        }

        .signature-block {
          min-width: 0;
          text-align: center;
        }

        .signature-space {
          height: 10mm;
          border-bottom: 1px solid #64748b;
          margin-bottom: 1.5mm;
        }

        .signature-label {
          font-size: 6.5px;
          line-height: 1.2;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .approval-date {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          font-size: 6.5px;
          color: #64748b;
          margin-top: 1mm;
        }

        .report-footer {
          margin-top: 2mm;
          padding-top: 2mm;
          border-top: 1px solid #cbd5e1;
        }

        /*
         * Print / PDF preview
         */
        @media print {
          .report-card-page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            margin: 0;
            padding: 5mm 7mm;
            box-shadow: none !important;
            page-break-after: avoid;
            page-break-before: avoid;
          }

          .report-card-paper {
            height: 100%;
            min-height: 0;
            page-break-inside: avoid;
          }

          .report-content {
            page-break-inside: avoid;
          }

          .horizontal-section-row,
          .comments-row,
          .bottom-grid,
          .report-box,
          .comment-box {
            page-break-inside: avoid;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>

      <div className="report-card-page">
        <div className="report-card-paper">

          {/* =====================================================
              TOP HEADER
              LEFT  = STUDENT PASSPORT
              CENTER = SCHOOL NAME / REPORT / SESSION / TERM
              RIGHT = SCHOOL LOGO
          ===================================================== */}
          <div className="report-card-header">

            {/* STUDENT PASSPORT */}
            <div className="passport-area">
              {studentPhoto ? (
                <img
                  src={studentPhoto}
                  alt={`${studentName} passport`}
                />
              ) : (
                <div className="passport-placeholder">
                  <span>STUDENT</span>
                  <span>PASSPORT</span>
                </div>
              )}
            </div>

            {/* SCHOOL CENTER */}
            <div className="school-heading">
              <h1 className="school-name">
                {schoolName}
              </h1>

              {(schoolAddress ||
                schoolPhone ||
                schoolEmail ||
                schoolWebsite) && (
                <div className="school-address">
                  {schoolAddress && (
                    <div>{schoolAddress}</div>
                  )}

                  {(schoolPhone ||
                    schoolEmail ||
                    schoolWebsite) && (
                    <div>
                      {schoolPhone && (
                        <span>
                          {schoolPhone}
                        </span>
                      )}

                      {schoolPhone &&
                        schoolEmail && (
                          <span> &nbsp;•&nbsp; </span>
                        )}

                      {schoolEmail && (
                        <span>
                          {schoolEmail}
                        </span>
                      )}

                      {(schoolPhone ||
                        schoolEmail) &&
                        schoolWebsite && (
                          <span>
                            &nbsp;•&nbsp;
                          </span>
                        )}

                      {schoolWebsite && (
                        <span>
                          {schoolWebsite}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <h2 className="report-title">
                Student Report Card
              </h2>

              <div className="session-term">
                <span>
                  <strong>Session:</strong>{" "}
                  {sessionName}
                </span>

                <span>
                  <strong>Term:</strong>{" "}
                  {termName}
                </span>
              </div>
            </div>

            {/* SCHOOL LOGO */}
            <div className="logo-area">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt="School logo"
                />
              ) : (
                <div className="logo-placeholder">
                  <div>SCHOOL</div>
                  <div>LOGO</div>
                </div>
              )}
            </div>
          </div>

          <div className="report-content">

            {/* =====================================================
                STUDENT INFORMATION — HORIZONTAL
            ===================================================== */}
            <div className="section-title">
              <span className="section-title-bar" />
              <h3 className="section-title-text">
                Student Information
              </h3>
            </div>

            <div className="student-information">

              <div className="student-info-item">
                <span className="student-info-label">
                  Student Name
                </span>
                <span className="student-info-value">
                  {studentName}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">
                  Admission No.
                </span>
                <span className="student-info-value">
                  {admissionNumber}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">
                  Class
                </span>
                <span className="student-info-value">
                  {className}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">
                  Gender
                </span>
                <span className="student-info-value">
                  {gender}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">
                  Session
                </span>
                <span className="student-info-value">
                  {sessionName}
                </span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">
                  Term
                </span>
                <span className="student-info-value">
                  {termName}
                </span>
              </div>

            </div>

            {/* =====================================================
                ACADEMIC PERFORMANCE
            ===================================================== */}
            <div className="academic-section">

              <div className="section-title">
                <span className="section-title-bar" />
                <h3 className="section-title-text">
                  Academic Performance
                </h3>
              </div>

              <div className="academic-table-wrapper">
                <ReportCardSubjectTable
                  subjects={results}
                  brandColor={brandColor}
                />
              </div>

            </div>

            {/* =====================================================
                SUMMARY + ATTENDANCE — HORIZONTAL
            ===================================================== */}
            <div className="horizontal-section-row">

              <div className="report-box summary-box">
                <div className="report-box-title">
                  Performance Summary
                </div>

                <div className="report-box-body">
                  <ReportCardSummary
                    summary={summary}
                    brandColor={brandColor}
                  />
                </div>
              </div>

              <div className="report-box attendance-box">
                <div className="report-box-title">
                  Attendance
                </div>

                <div className="report-box-body">
                  <ReportCardAttendance
                    attendance={attendance}
                    brandColor={brandColor}
                  />
                </div>
              </div>

            </div>

            {/* =====================================================
                COMMENTS — HORIZONTAL
            ===================================================== */}
            <div className="comments-row">

              {/* CLASS TEACHER */}
              <div className="comment-box">

                <div className="report-box-title">
                  Class Teacher's Comment
                </div>

                <div className="comment-content">

                  <span className="comment-label">
                    Teacher's Assessment
                  </span>

                  <div className="comment-text">
                    {summary?.performanceRemark ||
                      "................................................................................"}
                  </div>

                  <div className="writing-lines">
                    <div className="writing-line" />
                    <div className="writing-line" />
                  </div>

                </div>

              </div>

              {/* PRINCIPAL */}
              <div className="comment-box">

                <div className="report-box-title">
                  Principal / Head Teacher's Comment
                </div>

                <div className="comment-content">

                  <span className="comment-label">
                    Official Comment
                  </span>

                  <div className="writing-lines">
                    <div className="writing-line" />
                    <div className="writing-line" />
                    <div className="writing-line" />
                  </div>

                </div>

              </div>

            </div>

            {/* =====================================================
                GRADING + APPROVAL — HORIZONTAL
            ===================================================== */}
            <div className="bottom-grid">

              {/* GRADING SCALE */}
              <div className="report-box">

                <div className="report-box-title">
                  Grading Scale
                </div>

                <div className="report-box-body">
                  <table className="grading-table">
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Score</th>
                        <th>Meaning</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>A</td>
                        <td>80–100</td>
                        <td>Excellent</td>
                      </tr>

                      <tr>
                        <td>B</td>
                        <td>70–79</td>
                        <td>Very Good</td>
                      </tr>

                      <tr>
                        <td>C</td>
                        <td>60–69</td>
                        <td>Good</td>
                      </tr>

                      <tr>
                        <td>D</td>
                        <td>50–59</td>
                        <td>Fair</td>
                      </tr>

                      <tr>
                        <td>E</td>
                        <td>40–49</td>
                        <td>Pass</td>
                      </tr>

                      <tr>
                        <td>F</td>
                        <td>0–39</td>
                        <td>Fail</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* APPROVAL */}
              <div className="report-box">

                <div className="report-box-title">
                  Approval
                </div>

                <div className="approval-area">

                  <div className="signature-block">
                    <div className="signature-space" />
                    <div className="signature-label">
                      Class Teacher
                    </div>
                  </div>

                  <div className="signature-block">
                    <div className="signature-space" />
                    <div className="signature-label">
                      Principal / Head Teacher
                    </div>
                  </div>

                  <div className="approval-date">
                    Date: ______________________
                  </div>

                </div>

              </div>

            </div>

            {/* =====================================================
                FOOTER
            ===================================================== */}
            <div className="report-footer">
              <ReportCardFooter />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
