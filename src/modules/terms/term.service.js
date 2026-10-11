import { Term } from "./term.model.js";
import { Session } from "../sessions/session.model.js";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

const STANDARD_TERM_ORDER = {
  "first term": 1,
  "1st term": 1,
  "second term": 2,
  "2nd term": 2,
  "third term": 3,
  "3rd term": 3,
};

async function resolveTermOrder(payload, schoolId) {
  if (payload.order) {
    return payload.order;
  }

  const standardOrder =
    STANDARD_TERM_ORDER[payload.name.trim().toLowerCase()];

  if (standardOrder) {
    return standardOrder;
  }

  const lastTerm = await Term.findOne({
    schoolId,
    sessionId: payload.sessionId,
  }).sort({ order: -1 });

  return (lastTerm?.order || 0) + 1;
}

export async function createTerm(payload, schoolId) {
  const session = await Session.findOne({
    _id: payload.sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(
      404,
      "Session not found for this school"
    );
  }

  const name = payload.name.trim();

  const exists = await Term.findOne({
    schoolId,
    sessionId: session._id,
    name,
  });

  if (exists) {
    throw new ApiError(
      400,
      "Term already exists for this session"
    );
  }

  const order = await resolveTermOrder(
    { ...payload, name },
    schoolId
  );

  if (payload.isCurrent) {
    await Session.updateMany(
      { schoolId },
      { $set: { isCurrent: false } }
    );

    await Term.updateMany(
      { schoolId },
      { $set: { isCurrent: false } }
    );

    session.isCurrent = true;
    await session.save();
  }

  const term = await Term.create({
    schoolId,
    sessionId: session._id,
    name,
    order,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    isCurrent: payload.isCurrent,
  });

  if (payload.isCurrent) {
    await School.findByIdAndUpdate(schoolId, {
      $set: {
        currentSession: session.name,
        currentTerm: term.name,
      },
    });
  }

  return term;
}

export async function listTerms(schoolId, sessionId) {
  const filter = { schoolId };

  if (sessionId) {
    const session = await Session.findOne({
      _id: sessionId,
      schoolId,
    });

    if (!session) {
      throw new ApiError(
        404,
        "Session not found for this school"
      );
    }

    filter.sessionId = session._id;
  }

  return Term.find(filter)
    .populate("sessionId", "name startDate endDate isCurrent")
    .sort({ order: 1, startDate: 1, createdAt: 1 });
}

export async function getTermById(id, schoolId) {
  const term = await Term.findOne({
    _id: id,
    schoolId,
  }).populate("sessionId", "name startDate endDate isCurrent");

  if (!term) {
    throw new ApiError(404, "Term not found");
  }

  return term;
}

export async function setCurrentTerm(id, schoolId) {
  const term = await Term.findOne({
    _id: id,
    schoolId,
  });

  if (!term) {
    throw new ApiError(404, "Term not found");
  }

  const session = await Session.findOne({
    _id: term.sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(
      404,
      "The term's session could not be found"
    );
  }

  await Session.updateMany(
    { schoolId },
    { $set: { isCurrent: false } }
  );

  await Term.updateMany(
    { schoolId },
    { $set: { isCurrent: false } }
  );

  session.isCurrent = true;
  term.isCurrent = true;

  await session.save();
  await term.save();

  await School.findByIdAndUpdate(schoolId, {
    $set: {
      currentSession: session.name,
      currentTerm: term.name,
    },
  });

  return term;
}
