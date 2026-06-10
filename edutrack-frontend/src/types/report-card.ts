/* =========================================
   ATTENDANCE
========================================= */

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage?: number;
};

/* =========================================
   SUBJECT RESULT
========================================= */

export type ReportCardSubject = {
  _id?: string;

  subjectName: string;
  subjectCode: string;

  ca1: number;
  ca2: number;
  assignment: number;
  exam: number;

  total: number;

  grade: string;
  remark: string;
};

/* =========================================
   SUMMARY
========================================= */

export type ReportCardSummary = {
  subjectsCount: number;

  totalScore: number;
  averageScore: number;

  position: number | null;
  positionLabel: string;
};

/* =========================================
   STUDENT
========================================= */

export type ReportCardStudent = {
  _id: string;

  admissionNumber: string;

  firstName: string;
  lastName: string;

  gender?: string;

  className: string;
  classLevel?: string;
};

/* =========================================
   SESSION + TERM
========================================= */

export type SessionInfo = {
  _id: string;
  name: string;
};

export type TermInfo = {
  _id: string;
  name: string;
};

/* =========================================
   FULL STUDENT REPORT CARD
========================================= */

export type StudentReportCard = {
  student: ReportCardStudent;

  session: SessionInfo;
  term: TermInfo;

  results: ReportCardSubject[];

  summary: ReportCardSummary;

  attendance: AttendanceSummary;
};

/* =========================================
   API RESPONSE WRAPPER
========================================= */

export type StudentReportCardResponse = {
  reportCard: StudentReportCard;
};

/* =========================================
   CLASS RANKING STUDENT
========================================= */

export type RankingStudent = {
  studentId: string;

  admissionNumber: string;

  firstName: string;
  lastName: string;

  totalScore: number;
  averageScore: number;

  position: number;
  positionLabel: string;

  subjects: ReportCardSubject[];
};

/* =========================================
   CLASS REPORT
   (FIXED: supports BOTH backend formats)
========================================= */

export type ClassReport = {
  class: {
    _id: string;
    name: string;
    level?: string;
  };

  totalStudents: number;

  sessionId: string;
  termId: string;

  /**
   * FORMAT 1: NEW CLASS RANKING STYLE
   */
  students?: RankingStudent[];

  /**
   * FORMAT 2: OLD / CURRENT API STYLE
   * wrapper around reportCard
   */
  reports?: Array<{
    reportCard: StudentReportCard;
  }>;

  /**
   * OPTIONAL: backend metadata
   */
  generatedAt?: string;
};

/* =========================================
   CLASS RESPONSE WRAPPER (FIXED)
========================================= */

export type ClassReportResponse = {
  classReport: ClassReport;
};

/* =========================================
   SCHOOL BRANDING
========================================= */

export type SchoolBranding = {
  schoolName?: string;
  schoolLogo?: string;

  primaryColor?: string;
  secondaryColor?: string;

  principalSignature?: string;
  schoolStamp?: string;
};

/* =========================================
   RESULT SUMMARY DASHBOARD
========================================= */

export type ResultSummaryItem = {
  classId: string;
  className: string;

  draft: number;
  generated: number;
  published: number;
  locked: number;

  totalResults: number;

  progress: number;
};

/* =========================================
   FILTERS
========================================= */

export type ReportCardFilter = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  studentId?: string;
};