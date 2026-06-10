import { Session } from "./session.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function createSession(payload, schoolId) {
  const exists = await Session.findOne({
    schoolId,
    name: payload.name,
  });

  if (exists) {
    throw new ApiError(400, "Session already exists for this school");
  }

  if (payload.isCurrent) {
    await Session.updateMany({ schoolId }, { isCurrent: false });
  }

  const session = await Session.create({
    schoolId,
    name: payload.name,
    isCurrent: payload.isCurrent,
  });

  return session;
}

export async function listSessions(schoolId) {
  return Session.find({ schoolId }).sort({ createdAt: -1 });
}

export async function getSessionById(id, schoolId) {
  const session = await Session.findOne({ _id: id, schoolId });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  return session;
}

export async function setCurrentSession(id, schoolId) {
  const session = await Session.findOne({ _id: id, schoolId });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  await Session.updateMany({ schoolId }, { isCurrent: false });

  session.isCurrent = true;
  await session.save();

  return session;
}