import { Announcement } from "./announcement.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function createAnnouncement(payload, user) {
  return Announcement.create({
    schoolId: user.schoolId,
    title: payload.title,
    message: payload.message,
    audience: payload.audience,
    createdBy: user._id,
  });
}

export async function listAnnouncements(user) {
  const filter = {
    schoolId: user.schoolId,
  };

  if (user.role === "teacher") {
    filter.audience = { $in: ["all", "teachers"] };
  }

  if (user.role === "parent") {
    filter.audience = { $in: ["all", "parents"] };
  }

  return Announcement.find(filter)
    .populate("createdBy", "firstName lastName role")
    .sort({ createdAt: -1 });
}

export async function getAnnouncementById(id, user) {
  const doc = await Announcement.findOne({
    _id: id,
    schoolId: user.schoolId,
  }).populate("createdBy", "firstName lastName role");

  if (!doc) {
    throw new ApiError(404, "Announcement not found");
  }

  return doc;
}

export async function updateAnnouncement(id, payload, user) {
  const doc = await Announcement.findOne({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!doc) {
    throw new ApiError(404, "Announcement not found");
  }

  if (payload.title !== undefined) doc.title = payload.title;
  if (payload.message !== undefined) doc.message = payload.message;
  if (payload.audience !== undefined) doc.audience = payload.audience;

  await doc.save();

  return Announcement.findById(doc._id).populate(
    "createdBy",
    "firstName lastName role"
  );
}

export async function deleteAnnouncement(id, user) {
  const doc = await Announcement.findOneAndDelete({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!doc) {
    throw new ApiError(404, "Announcement not found");
  }

  return { deleted: true };
}