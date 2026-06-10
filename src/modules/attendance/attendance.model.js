import mongoose from "mongoose";

const attendanceSchema =
  new mongoose.Schema(
    {
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true,
      },

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
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

      date: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "present",
          "absent",
          "late",
        ],
        required: true,
      },

      note: {
        type: String,
        default: "",
        trim: true,
      },

      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

attendanceSchema.index(
  {
    schoolId: 1,
    studentId: 1,
    classId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

export const Attendance =
  mongoose.model(
    "Attendance",
    attendanceSchema
  );