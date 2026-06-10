export interface AttendanceRecord {
_id: string;
studentId: string;
studentName: string;
classId?: string;
className?: string;
sessionId?: string;
sessionName?: string;
termId?: string;
termName?: string;
date: string;
status: "present" | "absent" | "late";
teacherName?: string;
createdAt: string;
updatedAt?: string;
}

/* =========================
BULK ATTENDANCE ROW
========================= */

export interface AttendanceStudentRow {
studentId: string;
studentName: string;
status: "present" | "absent" | "late";
}

/* =========================
FORM VALUES
========================= */

export interface AttendanceFormValues {
classId: string;
sessionId: string;
termId: string;
date: string;
records: AttendanceStudentRow[];
}

/* =========================
CREATE PAYLOAD
========================= */

export interface AttendanceCreatePayload {
classId: string;
sessionId: string;
termId: string;
date: string;
records: {
studentId: string;
status: "present" | "absent" | "late";
}[];
}

/* =========================
LIST RESPONSE
========================= */

export interface AttendanceListResponse {
  summary?: AttendanceSummary;
  records: AttendanceRecord[];
}
/* =========================
FILTERS
========================= */
export interface AttendanceFilters {
  classId?: string;
  studentId?: string;

  date?: string;
}

/* =========================
SUMMARY
========================= */

export interface AttendanceSummary {
total: number;
present: number;
absent: number;
late: number;
attendanceRate: number;
}
