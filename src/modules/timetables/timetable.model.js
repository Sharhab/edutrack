import mongoose from "mongoose";

const timetableEntrySchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
      index: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },

    periodId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    periodName: {
      type: String,
      required: true,
      trim: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    isDoublePeriod: {
      type: Boolean,
      default: false,
    },

    isBreak: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String,
      enum: ["manual", "generated"],
      default: "generated",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Main lookup index.
 */
timetableEntrySchema.index({
  schoolId: 1,
  sessionId: 1,
  termId: 1,
});

/*
 * Class timetable queries.
 */
timetableEntrySchema.index({
  schoolId: 1,
  sessionId: 1,
  termId: 1,
  classId: 1,
  day: 1,
});

/*
 * Teacher timetable queries.
 */
timetableEntrySchema.index({
  schoolId: 1,
  sessionId: 1,
  termId: 1,
  teacherId: 1,
  day: 1,
});

/*
 * Prevent two timetable entries from occupying
 * the same class/day/period.
 */
timetableEntrySchema.index(
  {
    schoolId: 1,
    sessionId: 1,
    termId: 1,
    classId: 1,
    day: 1,
    periodId: 1,
  },
  {
    unique: true,
  }
);

export const Timetable =
  mongoose.models.Timetable ||
  mongoose.model("Timetable", timetableEntrySchema);

export default Timetable;
