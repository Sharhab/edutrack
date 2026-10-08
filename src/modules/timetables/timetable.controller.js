import {
  createTimetableEntryService,
  listTimetableService,
  getTimetableEntryService,
  updateTimetableEntryService,
  deleteTimetableEntryService,
  clearTimetableService,
  getTimetableStatsService,
  generateTimetableService,
} from "./timetable.service.js";

export async function createTimetableEntryHandler(req, res) {
  const {
    sessionId,
    termId,
    classId,
    subjectId,
    teacherId,
    day,
    periodId,
    isDoublePeriod,
    source,
  } = req.body;

  const entry = await createTimetableEntryService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
    classId,
    subjectId,
    teacherId,
    day,
    periodId,
    isDoublePeriod,
    source,
  });

  res.status(201).json({
    success: true,
    message: "Timetable entry created successfully.",
    data: entry,
  });
}

export async function listTimetableHandler(req, res) {
  const {
    sessionId,
    termId,
    classId,
    teacherId,
    day,
    isActive,
  } = req.query;

  const activeFilter =
    isActive === "true"
      ? true
      : isActive === "false"
      ? false
      : undefined;

  const entries = await listTimetableService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
    classId,
    teacherId,
    day,
    isActive: activeFilter,
  });

  res.status(200).json({
    success: true,
    data: entries,
  });
}

export async function getTimetableEntryHandler(req, res) {
  const entry = await getTimetableEntryService({
    schoolId: req.user.schoolId,
    id: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: entry,
  });
}

export async function updateTimetableEntryHandler(req, res) {
  const {
    day,
    periodId,
    classId,
    subjectId,
    teacherId,
    isDoublePeriod,
    isActive,
  } = req.body;

  const entry = await updateTimetableEntryService({
    schoolId: req.user.schoolId,
    id: req.params.id,
    day,
    periodId,
    classId,
    subjectId,
    teacherId,
    isDoublePeriod,
    isActive,
  });

  res.status(200).json({
    success: true,
    message: "Timetable entry updated successfully.",
    data: entry,
  });
}

export async function deleteTimetableEntryHandler(req, res) {
  const result = await deleteTimetableEntryService({
    schoolId: req.user.schoolId,
    id: req.params.id,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
}

export async function clearTimetableHandler(req, res) {
  const { sessionId, termId } = req.body;

  const result = await clearTimetableService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
  });

  res.status(200).json({
    success: true,
    message: "Timetable cleared successfully.",
    data: result,
  });
}

export async function getTimetableStatsHandler(req, res) {
  const { sessionId, termId } = req.query;

  const stats = await getTimetableStatsService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
  });

  res.status(200).json({
    success: true,
    data: stats,
  });
}

export async function generateTimetableHandler(req, res) {
  const {
    sessionId,
    termId,
    clearExisting,
  } = req.body;

  const result = await generateTimetableService({
    schoolId: req.user.schoolId,
    sessionId,
    termId,
    clearExisting:
      clearExisting === undefined
        ? true
        : Boolean(clearExisting),
  });

  res.status(200).json({
    success: true,
    message: "Timetable generated successfully.",
    data: result,
  });
}
