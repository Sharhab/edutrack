
import mongoose from "mongoose";

const teacherAttendanceJobLockSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

const TeacherAttendanceJobLock =
  mongoose.models.TeacherAttendanceJobLock ||
  mongoose.model(
    "TeacherAttendanceJobLock",
    teacherAttendanceJobLockSchema
  );

export default TeacherAttendanceJobLock;
