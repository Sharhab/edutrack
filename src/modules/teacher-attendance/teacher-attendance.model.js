
import mongoose from "mongoose";

const attendanceLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      required: true,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      required: true,
    },
    accuracyMetres: {
      type: Number,
      min: 0,
      default: null,
    },
    distanceFromSchoolMetres: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: false }
);

const adjustmentSchema = new mongoose.Schema(
  {
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      required: true,
    },
    adjustedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teacherAttendanceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },

    // Date in the school's configured timezone: YYYY-MM-DD.
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    status: {
      type: String,
      enum: [
        "present",
        "late",
        "absent",
        "half_day",
        "on_leave",
        "excused",
      ],
      default: "present",
      required: true,
    },

    clockInAt: {
      type: Date,
      default: null,
    },

    clockOutAt: {
      type: Date,
      default: null,
    },

    clockInLocation: {
      type: attendanceLocationSchema,
      default: null,
    },

    clockOutLocation: {
      type: attendanceLocationSchema,
      default: null,
    },

    lateMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

   source: {
  type: String,
  enum: ["gps", "admin", "system"],
  default: "gps",
},

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    adjustments: {
      type: [adjustmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// A teacher can have only one attendance record per school day.
teacherAttendanceSchema.index(
  { schoolId: 1, teacherId: 1, date: 1 },
  { unique: true }
);

teacherAttendanceSchema.index({
  schoolId: 1,
  date: 1,
  status: 1,
});

teacherAttendanceSchema.index({
  schoolId: 1,
  teacherId: 1,
  date: -1,
});

export const TeacherAttendance =
  mongoose.models.TeacherAttendance ||
  mongoose.model("TeacherAttendance", teacherAttendanceSchema);

export default TeacherAttendance;
