import mongoose from "mongoose";

const assignmentHistorySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    teacherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const formMasterAssignmentSchema = new mongoose.Schema(
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
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    teacherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    history: {
      type: [assignmentHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// One current assignment record per class in each academic session.
formMasterAssignmentSchema.index(
  { schoolId: 1, sessionId: 1, classId: 1 },
  { unique: true }
);

formMasterAssignmentSchema.index({
  schoolId: 1,
  sessionId: 1,
  teacherId: 1,
});

export const FormMasterAssignment = mongoose.model(
  "FormMasterAssignment",
  formMasterAssignmentSchema
);

export default FormMasterAssignment;
