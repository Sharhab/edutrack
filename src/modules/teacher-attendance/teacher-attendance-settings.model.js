
import mongoose from "mongoose";

const teacherAttendanceSettingsSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
      index: true,
    },

    // Registered school location
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null,
      },

      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null,
      },

      label: {
        type: String,
        trim: true,
        default: "",
        maxlength: 250,
      },
    },

    // Permitted distance from school
    geofenceRadiusMetres: {
      type: Number,
      min: 25,
      max: 1000,
      default: 100,
    },

    verificationMethod: {
      type: String,
      enum: ["gps"],
      default: "gps",
    },

    // School attendance schedule
    reportingTime: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      default: "08:00",
    },

    closingTime: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      default: "15:00",
    },

    lateGraceMinutes: {
      type: Number,
      min: 0,
      max: 180,
      default: 15,
    },

    clockInEnabled: {
      type: Boolean,
      default: true,
    },

    clockOutRequired: {
      type: Boolean,
      default: true,
    },

    timezone: {
      type: String,
      trim: true,
      default: "Africa/Lagos",
    },

    workingDays: {
      type: [String],
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      default: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

teacherAttendanceSettingsSchema.index(
  { schoolId: 1 },
  { unique: true }
);

export const TeacherAttendanceSettings =
  mongoose.models.TeacherAttendanceSettings ||
  mongoose.model(
    "TeacherAttendanceSettings",
    teacherAttendanceSettingsSchema
  );

export default TeacherAttendanceSettings;
