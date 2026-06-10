export interface Announcement {
  _id: string;
  title: string;
  message: string;
  target: "all" | "students" | "teachers" | "parents";
  classId?: string;
  className?: string;
  createdAt?: string;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
}

export interface AnnouncementFormValues {
  title: string;
  message: string;
  target: string;
  classId: string;
}