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

  ca1: number | null;
ca2: number | null;
assignment: number | null;
exam: number | null;
total: number | null;
  grade: string;
  remark: string;
};

/* =========================================
   SUMMARY
========================================= */


export type ReportCardSummary = {
  subjectsCount: number;
  totalScore: number | null;
  averageScore: number | null;
  position: number | null;
  positionLabel: string;
  classAverage?: number | null;
  highestInClass?: number | null;
  lowestInClass?: number | null;
  rankedStudents?: number;
};

/* =========================================
   PERFORMANCE COMMENTS
========================================= */

export type ReportCardComments = {
  performanceLevel?: string;
  classTeacher?: string;
  principal?: string;
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

  positionLabel?: string; // 👈 ADD THIS
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
  startDate?: string | null;
  endDate?: string | null;
  nextTermResumptionDate?: string | null;
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

  comments?: ReportCardComments;

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
  averageScore: number | null;
  position: number | null;
  positionLabel: string;
  subjects: ReportCardSubject[];
};


export type ClassReport = {
  class: {
    _id: string;
    name: string;
    level?: string;
  };

  totalStudents: number;

  sessionId: string;
  termId: string;

  students: RankingStudent[];

  reports?: Array<{
    reportCard: StudentReportCard;
  }>;

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
