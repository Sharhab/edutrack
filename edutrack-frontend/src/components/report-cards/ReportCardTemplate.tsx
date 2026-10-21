

  
"use client";

import React from "react";

import { StudentReportCard } from "../../types/report-card";

import ReportCardSummary from "./ReportCardSummary";
import ReportCardSubjectTable from "./ReportCardSubjectTable";
import ReportCardAttendance from "./ReportCardAttendance";
import ReportCardFooter from "./ReportCardFooter";

import { defaultComments } from "../../lib/report-card/pdfTheme";
import { getPerformanceRemark } from "../../lib/report-card/reportCardCalculations";

type Props = {
  data: StudentReportCard;
  schoolName?: string;
  schoolAddress?: string;
  schoolLogo?: string;
  brandColor?: string;
};

const BACKEND_URL = "https://edutrack-dpui.onrender.com";

function resolveSchoolLogoUrl(logoUrl?: string) {
  if (!logoUrl) return "";

  if (/^https?:\/\//i.test(logoUrl)) {
    return logoUrl;
  }

  return `${BACKEND_URL}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
}

export default function ReportCardTemplate({
  data,
  schoolName = "SCHOOL NAME",
  schoolAddress,
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
    comments,
  } = data;

  const studentName =
    `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "—";

  const admissionNumber = student?.admissionNumber || "—";
  const className = student?.className || "—";
  const gender = student?.gender || "—";
  const sessionName = session?.name || "—";
  const termName = term?.name || "—";

  const averageScore = Number(summary?.averageScore || 0);
  const performance = getPerformanceRemark(averageScore);

  const teacherComment =
    comments?.classTeacher || getDefaultComment(performance);

  const principalComment = comments?.principal || "";

  return (
    <>
      <style jsx global>{`
        /*
         * SCREEN LAYOUT
         * Responsive on phones, fixed A4 proportions only for printing.
         */

        .report-card-page {
          width: 100%;
          max-width: 210mm;
          min-width: 0;
          height: auto;
          min-height: 0;
          margin: 0 auto;
          padding: 3mm 5mm;
          box-sizing: border-box;
          overflow: visible;
          background: #fff;
        }

        .report-card-paper {
          width: 100%;
          min-width: 0;
          height: auto;
          min-height: 0;
          margin: 0 auto;
          box-sizing: border-box;
          overflow: visible;
        }

        .report-card-header {
          width: 100%;
          min-height: 34mm;
          display: grid;
          grid-template-columns: 28mm minmax(0, 1fr) 28mm;
          align-items: center;
          box-sizing: border-box;
          padding: 3.5mm 4mm;
          border-bottom: 2px solid ${brandColor};
        }

        .passport-area {
          width: 23mm;
          height: 27mm;
          box-sizing: border-box;
          border: 1px solid #94a3b8;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .passport-placeholder {
          text-align: center;
          color: #64748b;
          font-size: 6.5px;
          line-height: 1.4;
          font-weight: 700;
        }

        .school-heading {
          min-width: 0;
          text-align: center;
          padding: 0 5mm;
        }

        .school-name {
          margin: 0;
          color: ${brandColor};
          font-size: 17px;
          line-height: 1.15;
          font-weight: 800;
          text-transform: uppercase;
          overflow-wrap: anywhere;
        }

        .school-address {
          margin: 3px 0 0;
          color: #475569;
          font-size: 7.5px;
          line-height: 1.25;
          font-weight: 500;
          overflow-wrap: anywhere;
        }

        .report-title {
          margin: 4px 0 3px;
          color: #172033;
          font-size: 12px;
          line-height: 1.15;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .session-term {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          font-size: 8px;
          line-height: 1.2;
          color: #475569;
        }

        .session-term strong {
          color: #172033;
        }

        .logo-area {
          width: 23mm;
          height: 23mm;
          box-sizing: border-box;
          justify-self: end;
          border: 1px solid #94a3b8;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo-area img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .logo-placeholder {
          text-align: center;
          color: #64748b;
          font-size: 6.5px;
          line-height: 1.4;
          font-weight: 700;
        }

        .report-content {
          padding: 3.5mm 4mm 2.5mm;
          box-sizing: border-box;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 0 0 2mm;
          padding-bottom: 1mm;
          border-bottom: 1px solid #cbd5e1;
        }

        .section-title-bar {
          width: 3px;
          height: 12px;
          flex-shrink: 0;
          border-radius: 2px;
          background: ${brandColor};
        }

        .section-title-text {
          margin: 0;
          color: #172033;
          font-size: 8.5px;
          line-height: 1;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .student-information {
          width: 100%;
          display: grid;
          grid-template-columns: 1.55fr 1.15fr 0.85fr 0.75fr 1.05fr 1.05fr;
          margin-bottom: 3.5mm;
          border: 1px solid #cbd5e1;
          box-sizing: border-box;
        }

        .student-info-item {
          min-width: 0;
          padding: 2mm 2.2mm;
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
          font-size: 6px;
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        .student-info-value {
          display: block;
          color: #172033;
          font-size: 7.5px;
          line-height: 1.2;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .academic-section {
          width: 100%;
          margin-bottom: 3.5mm;
          overflow: hidden;
        }

        .academic-table-wrapper {
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }

        .academic-table-wrapper table {
          width: 100% !important;
          margin: 0 !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }

        .academic-table-wrapper th {
          padding: 2.5px 3px !important;
          font-size: 6.7px !important;
          line-height: 1.1 !important;
          white-space: nowrap !important;
        }

        .academic-table-wrapper td {
          padding: 2.5px 3px !important;
          font-size: 6.7px !important;
          line-height: 1.1 !important;
          overflow-wrap: anywhere;
        }

        .horizontal-section-row {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 3.5mm;
          margin-bottom: 3.5mm;
        }

        .report-box {
          min-width: 0;
          border: 1px solid #cbd5e1;
          background: #fff;
          box-sizing: border-box;
          overflow: hidden;
        }

        .report-box-title {
          min-height: 6.5mm;
          display: flex;
          align-items: center;
          padding: 0 2.5mm;
          box-sizing: border-box;
          background: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          color: ${brandColor};
          font-size: 7px;
          line-height: 1.2;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .report-box-body {
          padding: 2mm;
          box-sizing: border-box;
        }

        .summary-box,
        .attendance-box {
          min-width: 0;
          overflow: hidden;
        }

        .comments-row {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 3.5mm;
          margin-bottom: 3.5mm;
        }

        .comment-box {
          min-width: 0;
          height: 27mm;
          border: 1px solid #cbd5e1;
          box-sizing: border-box;
          overflow: hidden;
        }

        .comment-content {
          padding: 2mm 2.5mm;
          box-sizing: border-box;
        }

        .comment-label {
          display: block;
          margin-bottom: 1.5mm;
          color: #64748b;
          font-size: 5.8px;
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
        }

        .comment-text {
          color: #334155;
          font-size: 6.8px;
          line-height: 1.3;
          min-height: 8mm;
          overflow-wrap: anywhere;
        }

        .writing-lines {
          display: flex;
          flex-direction: column;
          gap: 4.5mm;
          margin-top: 2mm;
        }

        .writing-line {
          width: 100%;
          height: 1px;
          background: #cbd5e1;
        }

        .bottom-grid {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 3.5mm;
          margin-bottom: 2mm;
        }

        .grading-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .grading-table th,
        .grading-table td {
          border: 1px solid #cbd5e1;
          padding: 1.3mm 1mm;
          text-align: center;
          font-size: 5.8px;
          line-height: 1.2;
        }

        .grading-table th {
          background: #f8fafc;
          color: #172033;
          font-weight: 800;
        }

        .approval-area {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 3mm;
          padding: 2.5mm;
          box-sizing: border-box;
        }

        .signature-block {
          min-width: 0;
          text-align: center;
        }

        .signature-space {
          height: 9mm;
          border-bottom: 1px solid #64748b;
          margin-bottom: 1.5mm;
        }

        .signature-label {
          color: #475569;
          font-size: 5.8px;
          line-height: 1.15;
          font-weight: 700;
          text-transform: uppercase;
        }

        .approval-date {
          grid-column: 1 / -1;
          color: #64748b;
          font-size: 5.8px;
          text-align: right;
        }

        .report-footer {
          margin-top: 1.5mm;
          padding-top: 1.5mm;
          border-top: 1px solid #cbd5e1;
        }

        /*
         * PHONE SCREEN LAYOUT
         * These rules apply to on-screen viewing, not printed pages.
         */

        @media screen and (max-width: 700px) {
          .report-card-page {
            padding: 12px !important;
          }

          .report-card-header {
            grid-template-columns: 48px minmax(0, 1fr) 48px !important;
            gap: 8px !important;
            padding: 10px !important;
            min-height: 0 !important;
          }

          .passport-area {
            width: 44px !important;
            height: 54px !important;
          }

          .logo-area {
            width: 44px !important;
            height: 44px !important;
          }

          .school-heading {
            padding: 0 2px !important;
          }

          .school-name {
            font-size: clamp(12px, 3.5vw, 17px) !important;
            overflow-wrap: anywhere !important;
          }

          .school-address {
            font-size: 10px !important;
          }

          .report-title {
            font-size: 11px !important;
          }

          .session-term {
            flex-wrap: wrap !important;
            gap: 4px 10px !important;
          }

          .student-information {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .student-info-item {
            border-bottom: 1px solid #cbd5e1;
          }

          .horizontal-section-row,
          .comments-row,
          .bottom-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .academic-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          .academic-table-wrapper table {
            min-width: 520px;
          }
        }

        /*
         * PRINT LAYOUT
         * The outer bundle wrapper controls student page breaks.
         * This template does not force another page break.
         */

       
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html,
  body {
    width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  *,
  *::before,
  *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box !important;
  }

  .report-card-page {
    width: 210mm !important;
    max-width: 210mm !important;
    min-width: 0 !important;
    height: 297mm !important;
    min-height: 0 !important;
    max-height: 297mm !important;
    margin: 0 !important;
    padding: 3mm 5mm !important;
    overflow: hidden !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .report-card-paper {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 !important;
    overflow: visible !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .report-content {
    padding: 2mm 3mm 0 !important;
    overflow: visible !important;
  }

  .report-card-header {
    min-height: 27mm !important;
    padding: 2mm 3mm !important;
  }

  .section-title {
    margin-bottom: 0.8mm !important;
    padding-bottom: 0.4mm !important;
  }

  .student-information {
    margin-bottom: 1.5mm !important;
  }

  .student-info-item {
    padding: 1mm 1.4mm !important;
  }

  .academic-section {
    margin-bottom: 1.5mm !important;
    overflow: visible !important;
  }

  .academic-table-wrapper {
    width: 100% !important;
    overflow: visible !important;
  }

  .academic-table-wrapper table {
    display: table !important;
    width: 100% !important;
    min-width: 0 !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  .academic-table-wrapper th,
  .academic-table-wrapper td {
    padding: 1.2px 2px !important;
    font-size: 6px !important;
    line-height: 1 !important;
  }

  .horizontal-section-row {
    gap: 1.5mm !important;
    margin-bottom: 1.5mm !important;
  }

  .report-box-title {
    min-height: 4.5mm !important;
    padding: 0 1.5mm !important;
    font-size: 6px !important;
  }

  .report-box-body {
    padding: 1mm !important;
  }

  .comments-row {
    gap: 1.5mm !important;
    margin-bottom: 1.5mm !important;
  }

  .comment-box {
    height: 19mm !important;
    overflow: hidden !important;
  }

  .comment-content {
    padding: 1mm 1.5mm !important;
  }

  .comment-label {
    margin-bottom: 1mm !important;
  }

  .comment-text {
    min-height: 0 !important;
    font-size: 6.2px !important;
    line-height: 1.2 !important;
  }

  .writing-lines {
    gap: 2mm !important;
    margin-top: 1mm !important;
  }

  .bottom-grid {
    gap: 1.5mm !important;
    margin-bottom: 0 !important;
  }

  .grading-table th,
  .grading-table td {
    padding: 0.7mm 0.6mm !important;
    font-size: 5.2px !important;
    line-height: 1 !important;
  }

  .approval-area {
    padding: 1mm !important;
    gap: 1.5mm !important;
  }

  .signature-space {
    height: 5mm !important;
    margin-bottom: 0.8mm !important;
  }

  
.report-footer {
  display: none !important;
}


  .report-box,
  .horizontal-section-row,
  .comments-row,
  .bottom-grid,
  .academic-section,
  table {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  img {
    max-width: 100% !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}


        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>

      <div className="report-card-page">
        <div className="report-card-paper">
          {/* HEADER */}

          <div className="report-card-header">
            <div className="passport-area">
              <div className="passport-placeholder">
                <div>STUDENT</div>
                <div>PASSPORT</div>
              </div>
            </div>

            <div className="school-heading">
              {schoolName && (
                <h1 className="school-name">{schoolName}</h1>
              )}

              {schoolAddress && (
                <p className="school-address">{schoolAddress}</p>
              )}

              <h2 className="report-title">Student Report Card</h2>

              <div className="session-term">
                <span>
                  <strong>Session:</strong> {sessionName}
                </span>
                <span>
                  <strong>Term:</strong> {termName}
                </span>
              </div>
            </div>

            <div className="logo-area">
              {schoolLogo ? (
                <img
                  src={resolveSchoolLogoUrl(schoolLogo)}
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
            {/* STUDENT INFORMATION */}

            <div className="section-title">
              <span className="section-title-bar" />
              <h3 className="section-title-text">
                Student Information
              </h3>
            </div>

            <div className="student-information">
              <div className="student-info-item">
                <span className="student-info-label">Student Name</span>
                <span className="student-info-value">{studentName}</span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Admission No.</span>
                <span className="student-info-value">{admissionNumber}</span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Class</span>
                <span className="student-info-value">{className}</span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Gender</span>
                <span className="student-info-value">{gender}</span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Session</span>
                <span className="student-info-value">{sessionName}</span>
              </div>

              <div className="student-info-item">
                <span className="student-info-label">Term</span>
                <span className="student-info-value">{termName}</span>
              </div>
            </div>

            {/* ACADEMIC PERFORMANCE */}

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

            {/* PERFORMANCE SUMMARY + ATTENDANCE */}

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
                <div className="report-box-title">Attendance</div>

                <div className="report-box-body">
                  <ReportCardAttendance
                    attendance={attendance}
                    brandColor={brandColor}
                  />
                </div>
              </div>
            </div>

            {/* COMMENTS */}

            <div className="comments-row">
              <div className="comment-box">
                <div className="report-box-title">
                  Class Teacher&apos;s Comment
                </div>

                <div className="comment-content">
                  <span className="comment-label">Assessment</span>
                  <div className="comment-text">{teacherComment}</div>

                  <div className="writing-lines">
                    <div className="writing-line" />
                    <div className="writing-line" />
                  </div>
                </div>
              </div>

              <div className="comment-box">
                <div className="report-box-title">
                  Principal&apos;s Comment
                </div>

                <div className="comment-content">
                  <span className="comment-label">Official Comment</span>
                  <div className="comment-text">{principalComment}</div>

                  <div className="writing-lines">
                    <div className="writing-line" />
                    <div className="writing-line" />
                  </div>
                </div>
              </div>
            </div>

            {/* GRADING + APPROVAL */}

            <div className="bottom-grid">
              <div className="report-box">
                <div className="report-box-title">Grading Scale</div>

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

              <div className="report-box">
                <div className="report-box-title">Approval</div>

                <div className="approval-area">
                  <div className="signature-block">
                    <div className="signature-space" />
                    <div className="signature-label">Class Teacher</div>
                  </div>

                  <div className="signature-block">
                    <div className="signature-space" />
                    <div className="signature-label">Principal</div>
                  </div>

                  <div className="approval-date">
                    Date: ____________________
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="report-footer">
              <ReportCardFooter />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* DEFAULT TEACHER COMMENT */

function getDefaultComment(performance: string) {
  switch (performance) {
    case "Excellent":
      return defaultComments.excellent;
    case "Very Good":
      return defaultComments.veryGood;
    case "Good":
      return defaultComments.good;
    case "Fair":
      return defaultComments.fair;
    default:
      return defaultComments.poor;
  }
}
