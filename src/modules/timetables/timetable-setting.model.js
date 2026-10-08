import mongoose from "mongoose";

const timetablePeriodSchema = new mongoose.Schema(
  {
    name: {
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

    isBreak: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const timetableSettingSchema = new mongoose.Schema(
  {
    /*
    =========================================
    SCHOOL
    =========================================
    */
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    /*
    =========================================
    SESSION
    =========================================
    */
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    /*
    =========================================
    TERM
    =========================================
    */
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
      index: true,
    },

    /*
    =========================================
    SCHOOL DAYS
    =========================================
    */
    days: [
      {
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
      },
    ],

    /*
    =========================================
    PERIODS
    =========================================
    */
    periods: [timetablePeriodSchema],

    /*
    =========================================
    STATUS
    =========================================
    */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
=========================================
ONE TIMETABLE SETTING PER SCHOOL/SESSION/TERM
=========================================
*/
timetableSettingSchema.index(
  {
    schoolId: 1,
    sessionId: 1,
    termId: 1,
  },
  {
    unique: true,
  }
);

export const TimetableSetting =
  mongoose.models.TimetableSetting ||
  mongoose.model(
    "TimetableSetting",
    timetableSettingSchema
  );

export default TimetableSetting;
