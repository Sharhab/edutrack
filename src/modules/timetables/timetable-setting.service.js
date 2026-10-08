import mongoose from "mongoose";

import TimetableSetting from "./timetable-setting.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";

/*
=========================================
VALIDATE SESSION
=========================================
*/

async function validateSession(sessionId, schoolId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new ApiError(400, "Invalid session ID");
  }

  const session = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(
      404,
      "Session not found"
    );
  }

  return session;
}

/*
=========================================
VALIDATE TERM
=========================================
*/

async function validateTerm(
  termId,
  sessionId,
  schoolId
) {
  if (!mongoose.Types.ObjectId.isValid(termId)) {
    throw new ApiError(400, "Invalid term ID");
  }

  const term = await Term.findOne({
    _id: termId,
    sessionId,
    schoolId,
  });

  if (!term) {
    throw new ApiError(
      404,
      "Term not found for the selected session"
    );
  }

  return term;
}

/*
=========================================
GET TIMETABLE SETTINGS
=========================================
*/

export async function getTimetableSetting(
  schoolId,
  sessionId,
  termId
) {
  await validateSession(
    sessionId,
    schoolId
  );

  await validateTerm(
    termId,
    sessionId,
    schoolId
  );

  return TimetableSetting.findOne({
    schoolId,
    sessionId,
    termId,
  }).populate("sessionId", "name")
    .populate("termId", "name");
}

/*
=========================================
CREATE TIMETABLE SETTINGS
=========================================
*/

export async function createTimetableSetting(
  payload,
  schoolId
) {
  await validateSession(
    payload.sessionId,
    schoolId
  );

  await validateTerm(
    payload.termId,
    payload.sessionId,
    schoolId
  );

  const existing =
    await TimetableSetting.findOne({
      schoolId,
      sessionId: payload.sessionId,
      termId: payload.termId,
    });

  if (existing) {
    throw new ApiError(
      409,
      "Timetable settings already exist for this session and term"
    );
  }

  return TimetableSetting.create({
    schoolId,
    sessionId: payload.sessionId,
    termId: payload.termId,
    days: payload.days,
    periods: payload.periods,
    isActive: true,
  });
}

/*
=========================================
UPDATE TIMETABLE SETTINGS
=========================================
*/

export async function updateTimetableSetting(
  id,
  payload,
  schoolId
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      "Invalid timetable setting ID"
    );
  }

  const setting =
    await TimetableSetting.findOne({
      _id: id,
      schoolId,
    });

  if (!setting) {
    throw new ApiError(
      404,
      "Timetable settings not found"
    );
  }

  const sessionId =
    payload.sessionId ||
    setting.sessionId.toString();

  const termId =
    payload.termId ||
    setting.termId.toString();

  await validateSession(
    sessionId,
    schoolId
  );

  await validateTerm(
    termId,
    sessionId,
    schoolId
  );

  /*
  =========================================
  CHECK DUPLICATE WHEN SESSION/TERM CHANGES
  =========================================
  */

  if (
    sessionId !==
      setting.sessionId.toString() ||
    termId !==
      setting.termId.toString()
  ) {
    const duplicate =
      await TimetableSetting.findOne({
        schoolId,
        sessionId,
        termId,
        _id: { $ne: id },
      });

    if (duplicate) {
      throw new ApiError(
        409,
        "Timetable settings already exist for this session and term"
      );
    }
  }

  setting.sessionId = sessionId;
  setting.termId = termId;

  if (payload.days !== undefined) {
    setting.days = payload.days;
  }

  if (payload.periods !== undefined) {
    setting.periods = payload.periods;
  }

  if (payload.isActive !== undefined) {
    setting.isActive =
      payload.isActive;
  }

  await setting.save();

  return setting;
}

/*
=========================================
DELETE TIMETABLE SETTINGS
=========================================
*/

export async function deleteTimetableSetting(
  id,
  schoolId
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      "Invalid timetable setting ID"
    );
  }

  const setting =
    await TimetableSetting.findOneAndDelete({
      _id: id,
      schoolId,
    });

  if (!setting) {
    throw new ApiError(
      404,
      "Timetable settings not found"
    );
  }

  return setting;
}
