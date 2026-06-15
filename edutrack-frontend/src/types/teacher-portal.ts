export interface TeacherAssignedClass {
  _id: string;
  name: string;

  subjectName?: string;
  studentsCount?: number;
}

export interface TeacherPortalStudent {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  admissionNumber?: string;
  gender?: string;
  attendanceStatus?: "present" | "absent";
}

export interface TeacherPortalAnnouncement {
  _id: string;
  title: string;
  message: string;
  createdAt?: string;
}

/* =========================================
   OVERVIEW RESPONSE (IMPORTANT FIX)
========================================= */
export interface TeacherPortalOverviewResponse {
  success: boolean;
  data: {
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    classes: TeacherAssignedClass[];
    announcements: TeacherPortalAnnouncement[];
  };
}

/* =========================================
   CLASS STUDENTS RESPONSE (IMPORTANT FIX)
========================================= */
export interface TeacherClassStudentsResponse {
  success: boolean;
  data: TeacherPortalStudent[];
}