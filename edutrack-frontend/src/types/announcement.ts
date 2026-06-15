// src/types/announcement.ts

export interface Announcement {
  _id: string;
  title: string;
  message: string;

  target?:
    | "all"
    | "students"
    | "teachers"
    | "parents";

  classId?: string;
  className?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementListResponse {
  success?: boolean;
  message?: string;
  announcements: Announcement[];
}

export interface AnnouncementFormValues {
  title: string;
  message: string;

  target:
    | "all"
    | "students"
    | "teachers"
    | "parents";

  classId?: string;
}