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
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode?: string;
    terms: Record<
      string,
      {
        score: number;
        grade: string;
        remark: string;
      }
    >;
    cumulativeTotal: number;
    average: number;
    cumulativeGrade: string;
    cumulativeRemark: string;
  }>;
  termSummaries: Array<{
    termId: string;
    termName: string;
    totalScore: number;
    averageScore: number;
    grade: string;
    remark: string;
    attendance: AttendanceSummary;
  }>;
  summary: {
    totalScore: number;
    averageScore: number;
    grade: string;
    remark: string;
    positionLabel: string;
    classSize: number;
    subjectsCount: number;
  };
  attendance: AttendanceSummary;
};

type Props = {
  report: Report;
  schoolProfile?: SchoolProfile | null;
};

export default function CumulativeReportSheet({
  report,
  schoolProfile,
}: Props) {
  const brandColor = schoolProfile?.themeColor || "#06b6d4";
  const schoolName = schoolProfile?.schoolName?.trim() || "School";

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

  const formatScore = (value: number | null | undefined) =>
    Number(value || 0).toLocaleString("en-NG", {
      maximumFractionDigits: 1,
    });

  return (
    <>
      <style jsx global>{`
        .cumulative-sheet {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          padding: 0.28in;
          background: #fff;
          color: #172033;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }

        .cum-head {
          display: grid;
          grid-template-columns: 0.8in 1fr 0.8in;
          gap: 0.12in;
          align-items: center;
          border-bottom: 3px solid ${brandColor};
          padding-bottom: 0.12in;
        }

        .cum-photo,
        .cum-logo {
          width: 0.72in;
          height: 0.72in;
          border: 1px solid #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 7px;
          color: #64748b;
          padding: 4px;
          box-sizing: border-box;
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
          font-size: 19px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .cum-school p {
          margin: 3px 0;
          font-size: 9px;
          color: #475569;
        }

        .cum-school h2 {
          margin: 7px 0 3px;
          font-size: 14px;
          letter-spacing: 0.4px;
        }

        .cum-section {
          margin-top: 0.12in;
        }

        .cum-section-title {
          background: #eff6fa;
          border-left: 4px solid ${brandColor};
          padding: 5px 7px;
          margin: 0 0 5px;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 800;
        }

        .cum-student {
          display: grid;
          grid-template-columns: 1.5fr 1fr 0.7fr 0.7fr 1fr;
          border: 1px solid #cbd5e1;
        }

        .cum-student div {
          padding: 5px;
          border-right: 1px solid #cbd5e1;
          font-size: 9px;
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

        .cum-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 8px;
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
        }

        .cum-table .cum-grade {
          font-weight: 800;
          color: #075985;
          background: #e0f2fe;
        }

        .cum-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }

        .cum-card {
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          overflow: hidden;
          min-width: 0;
        }

        .cum-card h4 {
          margin: 0;
          background: ${brandColor};
          color: #fff;
          padding: 6px;
          font-size: 9px;
          text-transform: uppercase;
        }

        .cum-card p {
          display: flex;
          justify-content: space-between;
          gap: 5px;
          margin: 0;
          padding: 6px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 8px;
        }

        .cum-card p:last-child {
          border-bottom: 0;
        }

        .cum-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .cum-comment {
          border: 1px solid #cbd5e1;
          min-height: 0.55in;
          padding: 8px;
          font-size: 9px;
          line-height: 1.45;
        }

        .cum-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          padding: 14px 10px 4px;
          text-align: center;
          font-size: 8px;
        }

        .cum-signatures span {
          border-top: 1px solid #64748b;
          padding-top: 5px;
        }

        @page {
          size: letter portrait;
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
            width: 8.5in;
            min-height: 11in;
            margin: 0;
            padding: 0.28in;
            box-shadow: none;
          }

          .no-print {
            display: none !important;
          }

          .cum-section,
          .cum-card,
          .cum-comment,
          .cum-signatures {
            break-inside: avoid;
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
            grid-template-columns: 48px minmax(0, 1fr) 48px;
          }

          .cum-photo,
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
            min-width: 640px;
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
          <div className="cum-photo">
            STUDENT
            <br />
            PHOTO
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
                  <th rowSpan={2} style={{ width: "4%" }}>
                    S/N
                  </th>

                  <th rowSpan={2} style={{ width: "18%" }}>
                    Subject
                  </th>

                  {report.terms.map((term) => (
                    <th key={term._id} colSpan={2}>
                      {term.name}
                    </th>
                  ))}

                  <th colSpan={2}>Cumulative</th>
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

                    <td className="subject">
                      {subject.subjectName}
                    </td>

                    {report.terms.map((term) => {
                      const score = subject.terms[term._id];

                      return (
                        <React.Fragment key={term._id}>
                          <td>
                            {score ? formatScore(score.score) : "—"}
                          </td>
                          <td>{score?.grade || "—"}</td>
                        </React.Fragment>
                      );
                    })}

                    <td>
                      <strong>
                        {formatScore(subject.cumulativeTotal)}
                      </strong>
                    </td>

                    <td className="cum-grade">
                      {subject.cumulativeGrade || "—"}
                    </td>

                    <td>{subject.cumulativeRemark || "—"}</td>
                  </tr>
                ))}

                <tr>
                  <th colSpan={2}>TOTAL SCORE</th>

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
            3. Term Summaries
          </h3>

          <div className="cum-summary">
            {report.termSummaries.map((term) => (
              <div className="cum-card" key={term.termId}>
                <h4>{term.termName}</h4>

                <p>
                  <span>Total Score</span>
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
                  <strong>{term.attendance?.percentage ?? 0}%</strong>
                </p>
              </div>
            ))}

            <div className="cum-card">
              <h4>Cumulative Result</h4>

              <p>
                <span>Total Score</span>
                <strong>{formatScore(report.summary.totalScore)}</strong>
              </p>

              <p>
                <span>Average</span>
                <strong>{formatScore(report.summary.averageScore)}</strong>
              </p>

              <p>
                <span>Final Grade</span>
                <strong>{report.summary.grade || "—"}</strong>
              </p>

              <p>
                <span>Class Position</span>
                <strong>
                  {report.summary.positionLabel || "—"} /{" "}
                  {report.summary.classSize ?? "—"}
                </strong>
              </p>
            </div>
          </div>
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

              Attendance percentage:{" "}
              <strong>{report.attendance?.percentage ?? 0}%</strong>
            </div>
          </div>

          <div>
            <h3 className="cum-section-title">
              5. Teacher&apos;s Comment
            </h3>

            <div className="cum-comment">
              The student&apos;s cumulative average is{" "}
              {formatScore(report.summary.averageScore)}% (
              {report.summary.remark || "—"}). Continue to build on
              strengths and address subjects requiring improvement.
            </div>
          </div>
        </section>

        <section className="cum-section cum-bottom">
          <div>
            <h3 className="cum-section-title">
              6. Principal&apos;s Comment
            </h3>

            <div className="cum-comment">
              Academic performance for {report.session.name} has
              been reviewed. We encourage consistent effort and
              progress in the next academic session.
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

        <footer
          style={{
            marginTop: 10,
            borderTop: "1px solid #cbd5e1",
            paddingTop: 6,
            fontSize: 7,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Generated by EduTrack · Cumulative scores are calculated
          from results saved for this session.
        </footer>
      </article>
    </>
  );
}
