
/* =========================================
   STUDENT (BASIC)
========================================= */
export interface ResultStudent {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
}

/* =========================================
   ASSESSMENT SCHEME
========================================= */
export interface ResultAssessmentComponent {
  key: string;
  label: string;
  maxScore: number;
}

export interface ResultAssessmentScheme {
  version: number;
  totalMax: number;
  components: ResultAssessmentComponent[];
}

/* =========================================
   RESULT FORM VALUES (LEGACY COMPATIBILITY)
========================================= */
export interface ResultFormValues {
  studentId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;

  ca1: string;
  ca2: string;
  assignment: string;
  exam: string;

  remark?: string;
}

/* =========================================
   BULK ENTRY PAYLOAD
========================================= */
export interface CreateResultPayload {
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;

  results: {
    studentId: string;

    // Dynamic assessment components.
    scores?: Record<string, number | null>;

    // Legacy fields retained for compatibility.
    ca1?: number | null;
    ca2?: number | null;
    assignment?: number | null;
    exam?: number | null;
  }[];
}

/* =========================================
   SINGLE RESULT ENTRY (LIVE UI ROW)
========================================= */
export interface ResultEntryRow {
  studentId: string;
  studentName: string;
  admissionNumber?: string;

  scores?: Record<string, number | null>;

  ca1: number | null;
  ca2: number | null;
  assignment: number | null;
  exam: number | null;

  total: number | null;
  grade: string;
  remark?: string;
}

/* =========================================
   RESPONSE RELATION TYPES
   Supports populated and normalized API values.
========================================= */
export type ResultRelation<T> = string | T;

export interface ResultClass {
  _id: string;
  name: string;
}

export interface ResultSubject {
  _id: string;
  name: string;
  code?: string;
}

export interface ResultAcademicPeriod {
  _id: string;
  name: string;
}

/* =========================================
   RESULT RESPONSE
========================================= */
export interface ResultRecord {
  _id: string;

  studentId: ResultRelation<ResultStudent>;
  studentName?: string;
  admissionNumber?: string;

  classId: ResultRelation<ResultClass>;
  className?: string;

  subjectId: ResultRelation<ResultSubject>;
  subjectName?: string;
  subjectCode?: string;

  sessionId: ResultRelation<ResultAcademicPeriod>;
  sessionName?: string;

  termId: ResultRelation<ResultAcademicPeriod>;
  termName?: string;

  // Dynamic scoring.
  scores?: Record<string, number | null>;
  assessmentScheme?: ResultAssessmentScheme | null;

  // Legacy scoring fields.
  ca1: number | null;
  ca2: number | null;
  assignment: number | null;
  exam: number | null;

  total: number | null;
  grade: string;
  remark: string;

  status: "draft" | "generated" | "published" | "locked";
  published?: boolean;
  locked?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================
   TEACHER RESULT FILTERS
========================================= */
export interface ResultQueryParams {
  classId?: string;
  studentId?: string;
  subjectId?: string;
  sessionId?: string;
  termId?: string;
  status?: "draft" | "generated" | "published" | "locked";
}
