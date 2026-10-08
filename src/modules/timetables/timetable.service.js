import mongoose from "mongoose";

import Timetable from "./timetable.model.js";
import TimetableSetting from "./timetable-setting.model.js";
import TimetableRequirement from "./timetable-requirement.model.js";

import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Teacher } from "../teachers/teacher.model.js";

import { ApiError } from "../../utils/apiError.js";

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function createError(statusCode, message) {
  return new ApiError(statusCode, message);
}

async function validateAcademicContext({
  schoolId,
  sessionId,
  termId,
}) {
  if (!isValidObjectId(sessionId)) {
    throw createError(400, "Invalid session ID.");
  }

  if (!isValidObjectId(termId)) {
    throw createError(400, "Invalid term ID.");
  }

  const session = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!session) {
    throw createError(404, "Session not found.");
  }

  const term = await Term.findOne({
    _id: termId,
    sessionId,
    schoolId,
  });

  if (!term) {
    throw createError(
      404,
      "Term not found for the selected session."
    );
  }

  return {
    session,
    term,
  };
}

async function validateEntryReferences({
  schoolId,
  classId,
  subjectId,
  teacherId,
}) {
  if (!isValidObjectId(classId)) {
    throw createError(400, "Invalid class ID.");
  }

  if (!isValidObjectId(subjectId)) {
    throw createError(400, "Invalid subject ID.");
  }

  if (!isValidObjectId(teacherId)) {
    throw createError(400, "Invalid teacher ID.");
  }

  const [classItem, subject, teacher] = await Promise.all([
    ClassModel.findOne({
      _id: classId,
      schoolId,
      isActive: true,
    }),

    SubjectModel.findOne({
      _id: subjectId,
      schoolId,
      isActive: true,
    }),

    Teacher.findOne({
      userId: teacherId,
      schoolId,
      isActive: true,
    }),
  ]);

  if (!classItem) {
    throw createError(404, "Class not found.");
  }

  if (!subject) {
    throw createError(404, "Subject not found.");
  }

  if (!teacher) {
    throw createError(
      404,
      "Teacher not found for this school."
    );
  }

  return {
    classItem,
    subject,
    teacher,
  };
}

async function getSetting({
  schoolId,
  sessionId,
  termId,
}) {
  const setting = await TimetableSetting.findOne({
    schoolId,
    sessionId,
    termId,
    isActive: true,
  });

  if (!setting) {
    throw createError(
      404,
      "Timetable settings have not been configured for this session and term."
    );
  }

  return setting;
}

function findPeriod(setting, periodId) {
  return setting.periods.find(
    (period) =>
      period._id.toString() === periodId.toString()
  );
}

function validateDay(setting, day) {
  if (!VALID_DAYS.includes(day)) {
    throw createError(400, "Invalid timetable day.");
  }

  if (!setting.days.includes(day)) {
    throw createError(
      400,
      `${day} is not enabled in the timetable settings.`
    );
  }
}

async function checkClassConflict({
  schoolId,
  sessionId,
  termId,
  classId,
  day,
  periodId,
  excludeId,
}) {
  const filter = {
    schoolId,
    sessionId,
    termId,
    classId,
    day,
    periodId,
    isActive: true,
  };

  if (excludeId) {
    filter._id = {
      $ne: excludeId,
    };
  }

  return Timetable.findOne(filter);
}

async function checkTeacherConflict({
  schoolId,
  sessionId,
  termId,
  teacherId,
  day,
  periodId,
  excludeId,
}) {
  const filter = {
    schoolId,
    sessionId,
    termId,
    teacherId,
    day,
    periodId,
    isActive: true,
  };

  if (excludeId) {
    filter._id = {
      $ne: excludeId,
    };
  }

  return Timetable.findOne(filter);
}

async function createTimetableEntry({
  schoolId,
  sessionId,
  termId,
  classId,
  subjectId,
  teacherId,
  day,
  periodId,
  isDoublePeriod = false,
  source = "manual",
}) {
  await validateAcademicContext({
    schoolId,
    sessionId,
    termId,
  });

  const setting = await getSetting({
    schoolId,
    sessionId,
    termId,
  });

  validateDay(setting, day);

  if (!isValidObjectId(periodId)) {
    throw createError(400, "Invalid period ID.");
  }

  const period = findPeriod(setting, periodId);

  if (!period) {
    throw createError(
      404,
      "Selected timetable period was not found."
    );
  }

  if (!period.isActive) {
    throw createError(
      400,
      "The selected timetable period is inactive."
    );
  }

  if (period.isBreak) {
    throw createError(
      400,
      "A break period cannot be assigned to a subject."
    );
  }

  const { classItem, subject, teacher } =
    await validateEntryReferences({
      schoolId,
      classId,
      subjectId,
      teacherId,
    });

  const classConflict = await checkClassConflict({
    schoolId,
    sessionId,
    termId,
    classId,
    day,
    periodId,
  });

  if (classConflict) {
    throw createError(
      409,
      `${classItem.name} already has a timetable entry on ${day} during ${period.name}.`
    );
  }

  const teacherConflict = await checkTeacherConflict({
    schoolId,
    sessionId,
    termId,
    teacherId,
    day,
    periodId,
  });

  if (teacherConflict) {
    throw createError(
      409,
      `The selected teacher already has a timetable entry on ${day} during ${period.name}.`
    );
  }

  const entry = await Timetable.create({
    schoolId,
    sessionId,
    termId,
    classId,
    subjectId,
    teacherId,
    day,
    periodId,
    periodName: period.name,
    startTime: period.startTime,
    endTime: period.endTime,
    isDoublePeriod,
    isBreak: false,
    source,
    isActive: true,
  });

  return Timetable.findById(entry._id)
    .populate(
      "classId",
      "name code level"
    )
    .populate(
      "subjectId",
      "name code category isCore"
    )
    .populate(
      "teacherId",
      "firstName middleName lastName email"
    )
    .populate(
      "sessionId",
      "name startDate endDate"
    )
    .populate(
      "termId",
      "name startDate endDate"
    );
}

export async function createTimetableEntryService({
  schoolId,
  sessionId,
  termId,
  classId,
  subjectId,
  teacherId,
  day,
  periodId,
  isDoublePeriod = false,
  source = "manual",
}) {
  return createTimetableEntry({
    schoolId,
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
}

export async function listTimetableService({
  schoolId,
  sessionId,
  termId,
  classId,
  teacherId,
  day,
  isActive,
}) {
  await validateAcademicContext({
    schoolId,
    sessionId,
    termId,
  });

  const filter = {
    schoolId,
    sessionId,
    termId,
  };

  if (classId) {
    if (!isValidObjectId(classId)) {
      throw createError(400, "Invalid class ID.");
    }

    filter.classId = classId;
  }

  if (teacherId) {
    if (!isValidObjectId(teacherId)) {
      throw createError(400, "Invalid teacher ID.");
    }

    filter.teacherId = teacherId;
  }

  if (day) {
    validateDay(
      await getSetting({
        schoolId,
        sessionId,
        termId,
      }),
      day
    );

    filter.day = day;
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  return Timetable.find(filter)
    .sort({
      day: 1,
      startTime: 1,
    })
    .populate(
      "classId",
      "name code level"
    )
    .populate(
      "subjectId",
      "name code category isCore"
    )
    .populate(
      "teacherId",
      "firstName middleName lastName email"
    )
    .populate(
      "sessionId",
      "name startDate endDate"
    )
    .populate(
      "termId",
      "name startDate endDate"
    );
}

export async function getTimetableEntryService({
  schoolId,
  id,
}) {
  if (!isValidObjectId(id)) {
    throw createError(400, "Invalid timetable entry ID.");
  }

  const entry = await Timetable.findOne({
    _id: id,
    schoolId,
  })
    .populate(
      "classId",
      "name code level"
    )
    .populate(
      "subjectId",
      "name code category isCore"
    )
    .populate(
      "teacherId",
      "firstName middleName lastName email"
    )
    .populate(
      "sessionId",
      "name startDate endDate"
    )
    .populate(
      "termId",
      "name startDate endDate"
    );

  if (!entry) {
    throw createError(
      404,
      "Timetable entry not found."
    );
  }

  return entry;
}

export async function updateTimetableEntryService({
  schoolId,
  id,
  day,
  periodId,
  classId,
  subjectId,
  teacherId,
  isDoublePeriod,
  isActive,
}) {
  if (!isValidObjectId(id)) {
    throw createError(400, "Invalid timetable entry ID.");
  }

  const existing = await Timetable.findOne({
    _id: id,
    schoolId,
  });

  if (!existing) {
    throw createError(
      404,
      "Timetable entry not found."
    );
  }

  const nextDay = day ?? existing.day;
  const nextPeriodId = periodId ?? existing.periodId;
  const nextClassId = classId ?? existing.classId;
  const nextSubjectId = subjectId ?? existing.subjectId;
  const nextTeacherId = teacherId ?? existing.teacherId;

  await validateAcademicContext({
    schoolId,
    sessionId: existing.sessionId,
    termId: existing.termId,
  });

  const setting = await getSetting({
    schoolId,
    sessionId: existing.sessionId,
    termId: existing.termId,
  });

  validateDay(setting, nextDay);

  if (!isValidObjectId(nextPeriodId)) {
    throw createError(400, "Invalid period ID.");
  }

  const period = findPeriod(
    setting,
    nextPeriodId
  );

  if (!period) {
    throw createError(
      404,
      "Selected timetable period was not found."
    );
  }

  if (!period.isActive) {
    throw createError(
      400,
      "The selected timetable period is inactive."
    );
  }

  if (period.isBreak) {
    throw createError(
      400,
      "A break period cannot be assigned to a subject."
    );
  }

  const { classItem } = await validateEntryReferences({
    schoolId,
    classId: nextClassId,
    subjectId: nextSubjectId,
    teacherId: nextTeacherId,
  });

  const classConflict = await checkClassConflict({
    schoolId,
    sessionId: existing.sessionId,
    termId: existing.termId,
    classId: nextClassId,
    day: nextDay,
    periodId: nextPeriodId,
    excludeId: existing._id,
  });

  if (classConflict) {
    throw createError(
      409,
      `${classItem.name} already has a timetable entry on ${nextDay} during ${period.name}.`
    );
  }

  const teacherConflict = await checkTeacherConflict({
    schoolId,
    sessionId: existing.sessionId,
    termId: existing.termId,
    teacherId: nextTeacherId,
    day: nextDay,
    periodId: nextPeriodId,
    excludeId: existing._id,
  });

  if (teacherConflict) {
    throw createError(
      409,
      `The selected teacher already has a timetable entry on ${nextDay} during ${period.name}.`
    );
  }

  existing.day = nextDay;
  existing.periodId = nextPeriodId;
  existing.periodName = period.name;
  existing.startTime = period.startTime;
  existing.endTime = period.endTime;
  existing.classId = nextClassId;
  existing.subjectId = nextSubjectId;
  existing.teacherId = nextTeacherId;

  if (typeof isDoublePeriod === "boolean") {
    existing.isDoublePeriod = isDoublePeriod;
  }

  if (typeof isActive === "boolean") {
    existing.isActive = isActive;
  }

  await existing.save();

  return getTimetableEntryService({
    schoolId,
    id: existing._id,
  });
}

export async function deleteTimetableEntryService({
  schoolId,
  id,
}) {
  if (!isValidObjectId(id)) {
    throw createError(400, "Invalid timetable entry ID.");
  }

  const entry = await Timetable.findOneAndDelete({
    _id: id,
    schoolId,
  });

  if (!entry) {
    throw createError(
      404,
      "Timetable entry not found."
    );
  }

  return {
    message: "Timetable entry deleted successfully.",
  };
}

export async function clearTimetableService({
  schoolId,
  sessionId,
  termId,
}) {
  await validateAcademicContext({
    schoolId,
    sessionId,
    termId,
  });

  const result = await Timetable.deleteMany({
    schoolId,
    sessionId,
    termId,
  });

  return {
    deletedCount: result.deletedCount || 0,
  };
}

export async function getTimetableStatsService({
  schoolId,
  sessionId,
  termId,
}) {
  await validateAcademicContext({
    schoolId,
    sessionId,
    termId,
  });

  const [
    totalEntries,
    activeEntries,
    classes,
    teachers,
  ] = await Promise.all([
    Timetable.countDocuments({
      schoolId,
      sessionId,
      termId,
    }),

    Timetable.countDocuments({
      schoolId,
      sessionId,
      termId,
      isActive: true,
    }),

    Timetable.distinct("classId", {
      schoolId,
      sessionId,
      termId,
      isActive: true,
    }),

    Timetable.distinct("teacherId", {
      schoolId,
      sessionId,
      termId,
      isActive: true,
    }),
  ]);

  return {
    totalEntries,
    activeEntries,
    classesCount: classes.length,
    teachersCount: teachers.length,
  };
}

/*
 * Generate a timetable from the configured requirements.
 *
 * This first version uses a deterministic greedy approach.
 * A later generator layer can improve balancing and optimization.
 */
export async function generateTimetableService({
  schoolId,
  sessionId,
  termId,
  clearExisting = true,
}) {
  await validateAcademicContext({
    schoolId,
    sessionId,
    termId,
  });

  const setting = await getSetting({
    schoolId,
    sessionId,
    termId,
  });

  const requirements =
    await TimetableRequirement.find({
      schoolId,
      sessionId,
      termId,
      isActive: true,
    })
      .sort({
        classId: 1,
        subjectId: 1,
      })
      .lean();

  if (requirements.length === 0) {
    throw createError(
      400,
      "No active timetable requirements were found."
    );
  }

  const activePeriods = setting.periods.filter(
    (period) =>
      period.isActive &&
      !period.isBreak
  );

  if (activePeriods.length === 0) {
    throw createError(
      400,
      "No active teaching periods are configured."
    );
  }

  if (setting.days.length === 0) {
    throw createError(
      400,
      "No timetable days are configured."
    );
  }

  if (clearExisting) {
    await Timetable.deleteMany({
      schoolId,
      sessionId,
      termId,
    });
  }

  const generatedEntries = [];
  const conflicts = [];

  const classSlots = new Set();
  const teacherSlots = new Set();

  for (const requirement of requirements) {
    let periodsCreated = 0;

    for (
      let dayIndex = 0;
      dayIndex < setting.days.length &&
      periodsCreated < requirement.periodsPerWeek;
      dayIndex += 1
    ) {
      const day = setting.days[dayIndex];

      for (
        let periodIndex = 0;
        periodIndex < activePeriods.length &&
        periodsCreated < requirement.periodsPerWeek;
        periodIndex += 1
      ) {
        const period = activePeriods[periodIndex];

        const classSlotKey = [
          requirement.classId.toString(),
          day,
          period._id.toString(),
        ].join(":");

        const teacherSlotKey = [
          requirement.teacherId.toString(),
          day,
          period._id.toString(),
        ].join(":");

        if (classSlots.has(classSlotKey)) {
          continue;
        }

        if (teacherSlots.has(teacherSlotKey)) {
          continue;
        }

        classSlots.add(classSlotKey);
        teacherSlots.add(teacherSlotKey);

        generatedEntries.push({
          schoolId,
          sessionId,
          termId,
          classId: requirement.classId,
          subjectId: requirement.subjectId,
          teacherId: requirement.teacherId,
          day,
          periodId: period._id,
          periodName: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          isDoublePeriod: false,
          isBreak: false,
          source: "generated",
          isActive: true,
        });

        periodsCreated += 1;
      }
    }

    if (
      periodsCreated < requirement.periodsPerWeek
    ) {
      conflicts.push({
        classId: requirement.classId,
        subjectId: requirement.subjectId,
        teacherId: requirement.teacherId,
        required: requirement.periodsPerWeek,
        scheduled: periodsCreated,
        unscheduled:
          requirement.periodsPerWeek -
          periodsCreated,
      });
    }
  }

  if (generatedEntries.length > 0) {
    await Timetable.insertMany(
      generatedEntries,
      {
        ordered: false,
      }
    );
  }

  return {
    totalRequirements: requirements.length,
    generated: generatedEntries.length,
    conflicts,
  };
}
