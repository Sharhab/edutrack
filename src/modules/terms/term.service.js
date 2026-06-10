import { Term } from "./term.model.js";
import { Session } from "../sessions/session.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function createTerm(payload, schoolId) {
  const session = await Session.findOne({
    _id: payload.sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(404, "Session not found for this school");
  }

  const exists = await Term.findOne({
    schoolId,
    sessionId: payload.sessionId,
    name: payload.name,
  });

  if (exists) {
    throw new ApiError(400, "Term already exists for this session");
  }

  if (payload.isCurrent) {
    await Term.updateMany({ schoolId }, { isCurrent: false });
  }

  const term = await Term.create({
    schoolId,
    sessionId: payload.sessionId,
    name: payload.name,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    isCurrent: payload.isCurrent,
  });

  return term;
}

export async function listTerms(schoolId) {
  return Term.find({ schoolId })
    .populate("sessionId", "name")
    .sort({ createdAt: -1 });
}

export async function getTermById(id, schoolId) {
  const term = await Term.findOne({ _id: id, schoolId }).populate(
    "sessionId",
    "name"
  );

  if (!term) {
    throw new ApiError(404, "Term not found");
  }

  return term;
}

export async function setCurrentTerm(id, schoolId) {
  const term = await Term.findOne({ _id: id, schoolId });

  if (!term) {
    throw new ApiError(404, "Term not found");
  }

  await Term.updateMany({ schoolId }, { isCurrent: false });

  term.isCurrent = true;
  await term.save();

  return term;
}