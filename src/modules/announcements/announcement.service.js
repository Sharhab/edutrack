
import { Announcement } from "./announcement.model.js";
import { ApiError } from "../../utils/apiError.js";

function getAnnouncementFilter(user) {
  const filter = {
    schoolId: user.schoolId,
  };

  switch (user.role) {
    case "school_admin":
      break;

    case "teacher":
      filter.audience = { $in: ["all", "teachers"] };
      break;

    case "parent":
      filter.audience = { $in: ["all", "parents"] };
      break;

    case "student":
      filter.audience = { $in: ["all", "students"] };
      break;

    default:
      throw new ApiError(403, "You cannot access announcements");
  }

  return filter;
}

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
  return Announcement.find(getAnnouncementFilter(user))
    .populate("createdBy", "firstName lastName role")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getAnnouncementById(id, user) {
  const doc = await Announcement.findOne({
    ...getAnnouncementFilter(user),
    _id: id,
  })
    .populate("createdBy", "firstName lastName role")
    .lean();

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
