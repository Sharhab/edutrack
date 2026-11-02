
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],
      validate: {
        validator: (options) =>
          options.length >= 2 && options.length <= 6,
        message: "Each question must have 2–6 options.",
      },
    },

    // Keep this field private in student-facing responses.
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    marks: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
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

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 300,
    },

    startsAt: {
      type: Date,
      required: true,
    },

    endsAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },

    shuffleQuestions: {
      type: Boolean,
      default: false,
    },

    shuffleOptions: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

examSchema.index({
  schoolId: 1,
  classId: 1,
  sessionId: 1,
  termId: 1,
  status: 1,
});

export const Exam = mongoose.model("Exam", examSchema);

