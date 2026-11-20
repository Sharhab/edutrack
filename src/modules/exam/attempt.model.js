

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
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
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

    // Assessment component snapshot.
    // These values are copied from the exam when the
    // attempt is finalized, so historical attempts retain
    // their original assessment mapping.
    assessmentKey: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 80,
      default: null,
    },

    assessmentMaxScore: {
      type: Number,
      min: 0,
      default: null,
    },

    assessmentSchemeVersion: {
      type: Number,
      min: 1,
      default: null,
    },

    assessmentAggregationMethod: {
  type: String,
  enum: ["average", "highest", "selected"],
  default: null,
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
  {
    schoolId: 1,
    examId: 1,
    studentId: 1,
  },
  { unique: true }
);

// Prevent a synced offline submission from being accepted twice.
attemptSchema.index(
  {
    schoolId: 1,
    syncId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      syncId: { $type: "string" },
    },
  }
);

// Efficient lookup of submitted attempts for a particular exam.
attemptSchema.index({
  schoolId: 1,
  examId: 1,
  status: 1,
  studentId: 1,
});

export const ExamAttempt = mongoose.model(
  "ExamAttempt",
  attemptSchema
);
