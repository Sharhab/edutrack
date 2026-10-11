import { Session } from "./session.model.js";
import { Term } from "../terms/term.model.js";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function createSession(payload, schoolId) {
  const name = payload.name.trim();

  const exists = await Session.findOne({
    schoolId,
    name,
  });

  if (exists) {
    throw new ApiError(
      400,
      "Session already exists for this school"
    );
  }

  if (payload.isCurrent) {
    await Session.updateMany(
      { schoolId },
      { $set: { isCurrent: false } }
    );

    await Term.updateMany(
      { schoolId },
      { $set: { isCurrent: false } }
    );
  }

  const session = await Session.create({
    schoolId,
    name,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    isCurrent: payload.isCurrent,
  });

  if (payload.isCurrent) {
    await School.findByIdAndUpdate(schoolId, {
      $set: {
        currentSession: session.name,
        currentTerm: "",
      },
    });
  }

  return session;
}

export async function listSessions(schoolId) {
  return Session.find({ schoolId }).sort({
    startDate: -1,
    createdAt: -1,
  });
}

export async function getSessionById(id, schoolId) {
  const session = await Session.findOne({
    _id: id,
    schoolId,
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  return session;
}

export async function setCurrentSession(id, schoolId) {
  const session = await Session.findOne({
    _id: id,
    schoolId,
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  // Only one session can be current for this school.
  await Session.updateMany(
    { schoolId },
    { $set: { isCurrent: false } }
  );

  session.isCurrent = true;
  await session.save();

  // A term from another session must not remain current.
  await Term.updateMany(
    { schoolId },
    { $set: { isCurrent: false } }
  );

  // If the selected session already has a current term,
  // restore it as the current term.
  const currentTerm = await Term.findOne({
    schoolId,
    sessionId: session._id,
  }).sort({ order: 1 });

  if (currentTerm) {
    currentTerm.isCurrent = true;
    await currentTerm.save();
  }

  await School.findByIdAndUpdate(schoolId, {
    $set: {
      currentSession: session.name,
      currentTerm: currentTerm?.name || "",
    },
  });

  return session;
}
