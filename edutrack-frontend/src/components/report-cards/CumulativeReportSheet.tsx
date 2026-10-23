
"use client";

import React from "react";
import type { SchoolProfile } from "../../types/settings";

type Term = {
  _id: string;
  name: string;
  order: number;
};

type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

type SubjectTermScore = {
  score: number | null;
  grade: string;
  remark: string;
  hasResult?: boolean;
};

type ReportSubject = {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  terms: Record<string, SubjectTermScore | undefined>;
  cumulativeTotal: number;
  average: number | null;
  cumulativeGrade: string;
  cumulativeRemark: string;
  termsWithResults?: number;
};

type TermSummary = {
  termId: string;
  termName: string;
  order?: number;
  totalScore: number | null;
  averageScore: number | null;
  grade: string;
  remark: string;
  subjectsCount?: number;
  attendance: AttendanceSummary;
};

type Report = {
  student: {
    firstName: string;
    lastName: string;
    admissionNumber?: string;
    gender?: string;
    className?: string;
    classLevel?: string;
  };
  session: {
    name: string;
  };
  class: {
    name: string;
  };
  terms: Term[];
  subjects: ReportSubject[];
  termSummaries: TermSummary[];
  summary: {
    totalScore: number | null;
    averageScore: number | null;
    grade: string;
    remark: string;
    position: number | null;
    positionLabel: string;
    classSize: number;
    subjectsCount: number;
    highestAverage?: number | null;
    lowestAverage?: number | null;
    classAverage?: number | null;
    eligibleStudents?: number;
    completeForRanking?: boolean;
  };
  attendance: AttendanceSummary;
};

type Props = {
  report: Report;
  schoolProfile?: SchoolProfile | null;
};

function formatScore(value: number | null | undefined): string {
  if (
    value === null ||
    value === undefined ||
    value === "" as unknown ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString("en-NG", {
    maximumFractionDigits: 1,
  });
}

function formatPercentage(
  value: number | null | undefined
): string {
  return value === null || value === undefined
    ? "—"
    : `${formatScore(value)}%`;
}

export default function CumulativeReportSheet({
  report,
  schoolProfile,
}: Props) {
  const brandColor = schoolProfile?.themeColor || "#06b6d4";
  const schoolName =
    schoolProfile?.schoolName?.trim() || "School";

  const schoolContact = [
    schoolProfile?.address,
    schoolProfile?.phone,
    schoolProfile?.email,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  const studentName = [
    report.student.firstName,
    report.student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const isComplete = report.summary.completeForRanking;

  return (
    <>
      <style jsx global>{`
        .cumulative-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 8mm;
          box-sizing: border-box;
          background: #fff;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
        }

        .cum-head {
          display: grid;
          grid-template-columns: 20mm minmax(0, 1fr);
          gap: 4mm;
          align-items: center;
          border-bottom: 3px solid ${brandColor};
          padding-bottom: 3mm;
        }

        .cum-logo {
          width: 19mm;
          height: 19mm;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .cum-logo img {
          display: block;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .cum-school {
          text-align: center;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .cum-school h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .cum-school p {
          margin: 3px 0;
          font-size: 8px;
          color: #475569;
        }

        .cum-school h2 {
          margin: 5px 0 2px;
          font-size: 13px;
        }

        .cum-section {
          margin-top: 3mm;
          break-inside: avoid;
        }

        .cum-section-title {
          background: #eff6fa;
          border-left: 3px solid ${brandColor};
          padding: 5px 6px;
          margin: 0 0 5px;
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 800;
        }

        .cum-student {
          display: grid;
          grid-template-columns: 1.5fr 1fr 0.9fr 0.7fr 1fr;
          border: 1px solid #cbd5e1;
        }

        .cum-student > div {
          padding: 5px;
          border-right: 1px solid #cbd5e1;
          font-size: 8px;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .cum-student small {
          display: block;
          color: #64748b;
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .cum-table-wrap {
          width: 100%;
        }

        .cum-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
          font-size: 7px;
        }

        .cum-table th,
        .cum-table td {
          border: 1px solid #cbd5e1;
          padding: 4px 3px;
          text-align: center;
          overflow-wrap: anywhere;
        }

        .cum-table thead th {
          background: ${brandColor};
          color: white;
          font-weight: 700;
        }

        .cum-table td.subject {
          text-align: left;
          min-width: 25mm;
        }

        .cum-table .cum-grade {
          font-weight: 800;
          color: #075985;
          background: #e0f2fe;
        }

        .cum-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 5px;
        }

        .cum-card {
          border: 1px solid #cbd5e1;
          border-radius: 3px;
          overflow: hidden;
          min-width: 0;
          break-inside: avoid;
        }

        .cum-card h4 {
          margin: 0;
          background: ${brandColor};
          color: #fff;
          padding: 5px;
          font-size: 8px;
          text-transform: uppercase;
        }

        .cum-card p {
          display: flex;
          justify-content: space-between;
          gap: 5px;
          margin: 0;
          padding: 5px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 8px;
        }

        .cum-card p:last-child {
          border-bottom: 0;
        }

        .cum-card p span {
          color: #475569;
        }

        .cum-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .cum-comment {
          border: 1px solid #cbd5e1;
          min-height: 15mm;
          padding: 7px;
          font-size: 8px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .cum-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding: 18px 5px 4px;
          text-align: center;
          font-size: 8px;
        }

        .cum-signatures span {
          border-top: 1px solid #64748b;
          padding-top: 5px;
        }

        .cum-footer {
          margin-top: 5mm;
          border-top: 1px solid #cbd5e1;
          padding-top: 5px;
          font-size: 7px;
          color: #64748b;
          text-align: center;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden;
          }

          .cumulative-sheet,
          .cumulative-sheet * {
            visibility: visible;
          }

          .cumulative-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 0;
            margin: 0;
            padding: 8mm;
            box-shadow: none;
          }

          .no-print {
            display: none !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        @media screen and (max-width: 700px) {
          .cumulative-sheet {
            width: 100%;
            min-height: 0;
            padding: 12px;
            overflow-x: auto;
          }

          .cum-head {
            grid-template-columns: 48px minmax(0, 1fr);
          }

          .cum-logo {
            width: 44px;
            height: 44px;
          }

          .cum-school h1 {
            font-size: 14px;
          }

          .cum-student {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cum-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cum-bottom {
            grid-template-columns: 1fr;
          }

          .cum-table {
            min-width: 650px;
          }

          .cum-table-wrap {
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
        >
          Print cumulative report
        </button>
      </div>

      <article className="cumulative-sheet">
        <header className="cum-head">
          <div className="cum-logo">
            {schoolProfile?.logoUrl ? (
              <img
                src={schoolProfile.logoUrl}
                alt={`${schoolName} logo`}
              />
            ) : (
              <span>School Logo</span>
            )}
          </div>

          <div className="cum-school">
            <h1 style={{ color: brandColor }}>{schoolName}</h1>

            {schoolContact && <p>{schoolContact}</p>}

            <h2>CUMULATIVE REPORT SHEET</h2>

            <p>
              Academic Session:{" "}
              <strong>{report.session.name}</strong>
            </p>
          </div>
        </header>

        <section className="cum-section">
          <h3 className="cum-section-title">
            1. Student Information
          </h3>

          <div className="cum-student">
            <div>
              <small>Student Name</small>
              <strong>{studentName || "—"}</strong>
            </div>

            <div>
              <small>Admission No.</small>
              <strong>{report.student.admissionNumber || "—"}</strong>
            </div>

            <div>
              <small>Class</small>
              <strong>
                {report.student.className || report.class.name || "—"}
              </strong>
            </div>

            <div>
              <small>Gender</small>
              <strong>{report.student.gender || "—"}</strong>
            </div>

            <div>
              <small>Session</small>
              <strong>{report.session.name}</strong>
            </div>
          </div>
        </section>

        <section className="cum-section">
          <h3 className="cum-section-title">
            2. Cumulative Academic Performance
          </h3>

          <div className="cum-table-wrap">
            <table className="cum-table">
              <thead>
                <tr>
                  <th rowSpan={2}>S/N</th>
                  <th rowSpan={2}>Subject</th>

                  {report.terms.map((term) => (
                    <th key={term._id} colSpan={2}>
                      {term.name}
                    </th>
                  ))}

                  <th colSpan={2}>Annual</th>
                  <th rowSpan={2}>Remark</th>
                </tr>

                <tr>
                  {report.terms.map((term) => (
                    <React.Fragment key={term._id}>
                      <th>Score</th>
                      <th>Grade</th>
                    </React.Fragment>
                  ))}

                  <th>Total</th>
                  <th>Grade</th>
                </tr>
              </thead>

              <tbody>
                {report.subjects.map((subject, index) => (
                  <tr key={subject.subjectId}>
                    <td>{index + 1}</td>
                    <td className="subject">{subject.subjectName}</td>

                    {report.terms.map((term) => {
                      const score = subject.terms[term._id];

                      return (
                        <React.Fragment key={term._id}>
                          <td>
                            {score?.hasResult === false || !score
                              ? "—"
                              : formatScore(score.score)}
                          </td>
                          <td>{score?.grade || "—"}</td>
                        </React.Fragment>
                      );
                    })}

                    <td>{formatScore(subject.cumulativeTotal)}</td>
                    <td className="cum-grade">
                      {subject.cumulativeGrade || "—"}
                    </td>
                    <td>{subject.cumulativeRemark || "—"}</td>
                  </tr>
                ))}

                {report.subjects.length === 0 && (
                  <tr>
                    <td colSpan={report.terms.length * 2 + 5}>
                      No subject results are available for this session.
                    </td>
                  </tr>
                )}

                <tr>
                  <th colSpan={2}>TERM TOTALS</th>

                  {report.terms.map((term) => {
                    const summary = report.termSummaries.find(
                      (item) => item.termId === term._id
                    );

                    return (
                      <React.Fragment key={term._id}>
                        <th>{formatScore(summary?.totalScore)}</th>
                        <th>—</th>
                      </React.Fragment>
                    );
                  })}

                  <th>{formatScore(report.summary.totalScore)}</th>
                  <th>—</th>
                  <th>—</th>
                </tr>

                <tr>
                  <th colSpan={2}>AVERAGE</th>

                  {report.terms.map((term) => {
                    const summary = report.termSummaries.find(
                      (item) => item.termId === term._id
                    );

                    return (
                      <React.Fragment key={term._id}>
                        <th>{formatScore(summary?.averageScore)}</th>
                        <th>{summary?.grade || "—"}</th>
                      </React.Fragment>
                    );
                  })}

                  <th>{formatScore(report.summary.averageScore)}</th>
                  <th className="cum-grade">
                    {report.summary.grade || "—"}
                  </th>
                  <th>{report.summary.remark || "—"}</th>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="cum-section">
          <h3 className="cum-section-title">
            3. Term and Annual Summary
          </h3>

          <div className="cum-summary">
            {report.termSummaries.map((term) => (
              <div className="cum-card" key={term.termId}>
                <h4>{term.termName}</h4>

                <p>
                  <span>Total</span>
                  <strong>{formatScore(term.totalScore)}</strong>
                </p>

                <p>
                  <span>Average</span>
                  <strong>{formatScore(term.averageScore)}</strong>
                </p>

                <p>
                  <span>Grade</span>
                  <strong>{term.grade || "—"}</strong>
                </p>

                <p>
                  <span>Attendance</span>
                  <strong>
                    {formatPercentage(term.attendance?.percentage)}
                  </strong>
                </p>
              </div>
            ))}

            <div className="cum-card">
              <h4>Annual Result</h4>

              <p>
                <span>Average</span>
                <strong>{formatScore(report.summary.averageScore)}</strong>
              </p>

              <p>
                <span>Final Grade</span>
                <strong>{report.summary.grade || "—"}</strong>
              </p>

              <p>
                <span>Position</span>
                <strong>
                  {report.summary.positionLabel || "Not ranked"}
                  {report.summary.classSize
                    ? ` / ${report.summary.classSize}`
                    : ""}
                </strong>
              </p>

              <p>
                <span>Highest Average</span>
                <strong>
                  {formatScore(report.summary.highestAverage)}
                </strong>
              </p>

              <p>
                <span>Lowest Average</span>
                <strong>
                  {formatScore(report.summary.lowestAverage)}
                </strong>
              </p>

              <p>
                <span>Class Average</span>
                <strong>
                  {formatScore(report.summary.classAverage)}
                </strong>
              </p>
            </div>
          </div>

          {isComplete === false && (
            <p
              style={{
                marginTop: 6,
                padding: 6,
                border: "1px solid #d97706",
                color: "#92400e",
                fontSize: 8,
              }}
            >
              Annual results are incomplete for ranking purposes.
              The displayed annual average is based on available
              results and should not be interpreted as a final rank.
            </p>
          )}
        </section>

        <section className="cum-section cum-bottom">
          <div>
            <h3 className="cum-section-title">
              4. Cumulative Attendance
            </h3>

            <div className="cum-comment">
              Total days recorded:{" "}
              <strong>{report.attendance?.total ?? 0}</strong>
              <br />
              Present: <strong>{report.attendance?.present ?? 0}</strong>
              {" · "}
              Absent: <strong>{report.attendance?.absent ?? 0}</strong>
              {" · "}
              Late: <strong>{report.attendance?.late ?? 0}</strong>
              <br />
              Attendance:{" "}
              <strong>
                {formatPercentage(report.attendance?.percentage)}
              </strong>
            </div>
          </div>

          <div>
            <h3 className="cum-section-title">
              5. Academic Comment
            </h3>

            <div className="cum-comment">
              {report.summary.averageScore == null
                ? "An annual academic average is not available because no valid subject scores were recorded."
                : `The student's annual average is ${formatScore(
                    report.summary.averageScore
                  )}%, with the grade ${
                    report.summary.grade || "not assigned"
                  }. Continued effort and attention to areas requiring improvement are encouraged.`}
            </div>
          </div>
        </section>

        <section className="cum-section cum-bottom">
          <div>
            <h3 className="cum-section-title">
              6. Principal&apos;s Comment
            </h3>

            <div className="cum-comment">
              The cumulative academic record for {report.session.name}
              {" "}is presented for school review. Promotion or retention
              should follow the school&apos;s approved policy and
              authorized decision.
            </div>
          </div>

          <div>
            <h3 className="cum-section-title">
              7. Approval
            </h3>

            <div className="cum-comment cum-signatures">
              <span>Class Teacher Signature</span>
              <span>Principal Signature</span>
            </div>
          </div>
        </section>

        <footer className="cum-footer">
          Generated by EduTrack · Missing scores are shown as unavailable,
          not as zero. Annual ranking depends on the completeness rules
          configured by the school.
        </footer>
      </article>
    </>
  );
}
