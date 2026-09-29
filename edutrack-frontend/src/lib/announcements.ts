import api from "../lib/axios";
import {
  Announcement,
  AnnouncementFormValues,
  AnnouncementListResponse,
} from "../types/announcement";

const ENDPOINTS = {
  list: "/announcements",
  create: "/announcements",
  update: (id: string) => `/announcements/${id}`,
  remove: (id: string) => `/announcements/${id}`,
};

export async function getAnnouncements() {
  const { data } = await api.get<AnnouncementListResponse>(ENDPOINTS.list);
  return data.announcements || [];
}

export async function createAnnouncement(payload: AnnouncementFormValues) {
  const { data } = await api.post<Announcement>(ENDPOINTS.create, payload);
  return data;
}

export async function updateAnnouncement(id: string, payload: AnnouncementFormValues) {
  const { data } = await api.put<Announcement>(ENDPOINTS.update(id), payload);
  return data;
}

export async function deleteAnnouncement(id: string) {
  await api.delete(ENDPOINTS.remove(id));
}