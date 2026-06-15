/* =========================================
   STUDENT (BASIC)
========================================= */
export interface ResultStudent {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
}

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
   BULK ENTRY PAYLOAD (v2 - TEACHER ENTRY ENGINE)
========================================= */
export interface CreateResultPayload {
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;

  results: {
    studentId: string;

    ca1?: number;
    ca2?: number;
    assignment?: number;
    exam?: number;
  }[];
}

/* =========================================
   SINGLE RESULT ENTRY (LIVE UI ROW)
========================================= */
export interface ResultEntryRow {
  studentId: string;
  studentName: string;
  admissionNumber?: string;

  ca1: number;
  ca2: number;
  assignment: number;
  exam: number;

  total: number;
  grade: string;
  remark?: string;
}

/* =========================================
   RESULT RESPONSE (BACKEND NORMALIZED)
========================================= */
export interface ResultRecord {
  _id: string;

  studentId: ResultStudent;

  classId: {
    _id: string;
    name: string;
  };

  subjectId: {
    _id: string;
    name: string;
    code?: string;
  };

  sessionId: {
    _id: string;
    name: string;
  };

  termId: {
    _id: string;
    name: string;
  };

  ca1: number;
  ca2: number;
  assignment: number;
  exam: number;

  total: number;
  grade: string;
  remark: string;

  status: "draft" | "published";
  published?: boolean;
  locked?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================
   TEACHER RESULT FILTERS (OPTIONAL UI)
========================================= */
export interface ResultQueryParams {
  classId?: string;
  studentId?: string;
  subjectId?: string;
  sessionId?: string;
  termId?: string;
  status?: "draft" | "published";
}