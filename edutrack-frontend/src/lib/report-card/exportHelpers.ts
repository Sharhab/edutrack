/* =========================================
   EXPORT HELPERS (UI → PDF / CSV / PRINT)
========================================= */

import {
  StudentReportCard,
  ClassReport,
  ReportCardSubject,
} from "../../types/report-card";

/* =========================================
   CLEAN STRING FORMATTER
========================================= */

export function safeText(value: any) {
  if (value === null || value === undefined) return "";
  return String(value);
}

/* =========================================
   FLATTEN STUDENT REPORT (PDF READY)
========================================= */

export function formatStudentReportForPdf(
  report: StudentReportCard
) {
  return {
    studentName: `${report.student.firstName} ${report.student.lastName}`,
    admissionNumber: report.student.admissionNumber,

    class: report.student.className,
    level: report.student.classLevel,

    session: report.session.name,
    term: report.term.name,

    subjects: report.results.map((s: ReportCardSubject) => ({
      subject: s.subjectName,
      code: s.subjectCode,

      ca1: s.ca1,
      ca2: s.ca2,
      assignment: s.assignment,
      exam: s.exam,

      total: s.total,
      grade: s.grade,
      remark: s.remark,
    })),

    summary: report.summary,

    attendance: report.attendance,
  };
}

/* =========================================
   FLATTEN CLASS REPORT (BULK PDF)
========================================= */

export function formatClassReportForPdf(
  report: ClassReport
) {
  return {
    className: report.class.name,
    level: report.class.level,

    sessionId: report.sessionId,
    termId: report.termId,

    totalStudents: report.totalStudents,

    students: report.students.map((s) => ({
      name: `${s.firstName} ${s.lastName}`,
      admissionNumber: s.admissionNumber,

      totalScore: s.totalScore,
      averageScore: s.averageScore,

      position: s.position,
      positionLabel: s.positionLabel,

      subjects: s.subjects,
    })),
  };
}

/* =========================================
   CSV EXPORT FORMATTER (OPTIONAL)
========================================= */

export function flattenSubjectsForCsv(
  subjects: ReportCardSubject[]
) {
  return subjects.map((s) => ({
    subject: s.subjectName,
    code: s.subjectCode,
    ca1: s.ca1,
    ca2: s.ca2,
    assignment: s.assignment,
    exam: s.exam,
    total: s.total,
    grade: s.grade,
  }));
}