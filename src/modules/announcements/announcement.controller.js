import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "./announcement.validation.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  listAnnouncements,
  updateAnnouncement,
} from "./announcement.service.js";

export async function createAnnouncementHandler(req, res) {
  const parsed = createAnnouncementSchema.parse(req.body);
  const data = await createAnnouncement(parsed, req.user);

  res.status(201).json({
    success: true,
    message: "Announcement created successfully",
    data,
  });
}

export async function listAnnouncementsHandler(req, res) {
  const data = await listAnnouncements(req.user);

  res.json({
    success: true,
    message: "Announcements fetched successfully",
    data,
  });
}

export async function getAnnouncementHandler(req, res) {
  const data = await getAnnouncementById(req.params.id, req.user);

  res.json({
    success: true,
    message: "Announcement fetched successfully",
    data,
  });
}

export async function updateAnnouncementHandler(req, res) {
  const parsed = updateAnnouncementSchema.parse(req.body);
  const data = await updateAnnouncement(req.params.id, parsed, req.user);

  res.json({
    success: true,
    message: "Announcement updated successfully",
    data,
  });
}

export async function deleteAnnouncementHandler(req, res) {
  const data = await deleteAnnouncement(req.params.id, req.user);

  res.json({
    success: true,
    message: "Announcement deleted successfully",
    data,
  });
}