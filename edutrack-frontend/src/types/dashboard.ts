export interface DashboardStat {
  title: string;
  value: string | number;
  subtitle?: string;
}

/* =========================================
   ANNOUNCEMENTS
========================================= */

export interface AnnouncementItem {
  _id: string;
  title: string;
  message?: string;
  createdAt?: string;
}

/* =========================================
   SCHOOL ADMIN
========================================= */

export interface SchoolAdminDashboardData {
  stats: {
    students: number;
    teachers: number;
    parents: number;
    classes: number;
    subjects: number;

    attendance: number;

    revenue: number;
    expected: number;
    outstanding: number;

    invoicesTotal: number;
    invoicesPaid: number;
    invoicesPending: number;
  };

  recentAnnouncements: AnnouncementItem[];

  recentResults: any[];
}

/* =========================================
   TEACHER
========================================= */

export interface TeacherClassItem {
  _id: string;
  name: string;
  level?: string;
}

export interface TeacherSubjectItem {
  _id: string;
  name: string;
  code?: string;
}

export interface TeacherAssignmentItem {
  classId: {
    _id: string;
    name: string;
    level?: string;
  };

  subjectId: {
    _id: string;
    name: string;
    code?: string;
  };
}

export interface TeacherDashboardStats {
  myClasses: number;
  mySubjects: number;

  students: number;

  attendancePending: number;

  resultsDrafted: number;
}

export interface TeacherDashboardData {
  stats: TeacherDashboardStats;

  myClasses: TeacherClassItem[];

  mySubjects: TeacherSubjectItem[];

  assignments: TeacherAssignmentItem[];

  recentAnnouncements: AnnouncementItem[];
}

/* =========================================
   PARENT
========================================= */

export interface ParentChildSummary {
  _id: string;

  name: string;

  className?: string;

  attendanceRate?: number;

  latestResultStatus?: string;
}

export interface ParentDashboardData {
  stats: {
    childrenLinked: number;

    unreadNotices: number;

    attendanceRate?: number;

    latestResultReleased?: boolean;
  };

  children: ParentChildSummary[];

  recentAnnouncements: AnnouncementItem[];
}