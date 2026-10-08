import {
  createTimetableSettingSchema,
  updateTimetableSettingSchema,
} from "./timetable-setting.validation.js";

import {
  createTimetableSetting,
  deleteTimetableSetting,
  getTimetableSetting,
  updateTimetableSetting,
} from "./timetable-setting.service.js";

/*
=========================================
GET TIMETABLE SETTINGS
=========================================
*/

export async function getTimetableSettingHandler(
  req,
  res
) {
  const { sessionId, termId } = req.query;

  if (!sessionId || !termId) {
    return res.status(400).json({
      success: false,
      message:
        "sessionId and termId are required",
    });
  }

  const data =
    await getTimetableSetting(
      req.user.schoolId,
      sessionId,
      termId
    );

  res.status(200).json({
    success: true,
    data,
  });
}

/*
=========================================
CREATE TIMETABLE SETTINGS
=========================================
*/

export async function createTimetableSettingHandler(
  req,
  res
) {
  const parsed =
    createTimetableSettingSchema.parse(
      req.body
    );

  const data =
    await createTimetableSetting(
      parsed,
      req.user.schoolId
    );

  res.status(201).json({
    success: true,
    message:
      "Timetable settings created successfully",
    data,
  });
}

/*
=========================================
UPDATE TIMETABLE SETTINGS
=========================================
*/

export async function updateTimetableSettingHandler(
  req,
  res
) {
  const parsed =
    updateTimetableSettingSchema.parse(
      req.body
    );

  const data =
    await updateTimetableSetting(
      req.params.id,
      parsed,
      req.user.schoolId
    );

  res.status(200).json({
    success: true,
    message:
      "Timetable settings updated successfully",
    data,
  });
}

/*
=========================================
DELETE TIMETABLE SETTINGS
=========================================
*/

export async function deleteTimetableSettingHandler(
  req,
  res
) {
  await deleteTimetableSetting(
    req.params.id,
    req.user.schoolId
  );

  res.status(200).json({
    success: true,
    message:
      "Timetable settings deleted successfully",
  });
}
