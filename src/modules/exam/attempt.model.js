
import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    // Question ID -> selected option index
    answers: {
      type: Map,
      of: Number,
      default: {},
    },

    score: {
      type: Number,
      default: null,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
      index: true,
    },

    submissionSource: {
      type: String,
      enum: ["online", "offline_sync"],
      default: "online",
    },

    syncId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// One attempt per student per exam.
attemptSchema.index(
  { schoolId: 1, examId: 1, studentId: 1 },
  { unique: true }
);

// Prevent a synced offline submission from being accepted twice.
attemptSchema.index(
  { schoolId: 1, syncId: 1 },
  {
    unique: true,
    partialFilterExpression: { syncId: { $type: "string" } },
  }
);

export const ExamAttempt = mongoose.model(
  "ExamAttempt",
  attemptSchema
);
