import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
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

    ca1: { type: Number, default: 0, min: 0, max: 20 },
    ca2: { type: Number, default: 0, min: 0, max: 20 },
    assignment: { type: Number, default: 0, min: 0, max: 10 },
    exam: { type: Number, default: 0, min: 0, max: 50 },

    total: { type: Number, default: 0 },
    grade: { type: String, default: "" },
    remark: { type: String, default: "" },

    /* =========================================
       🔥 FIXED: FULL LIFECYCLE SUPPORT
    ========================================= */

    status: {
  type: String,
  enum: [
    "draft",
    "generated",
    "published",
    "locked",
  ],
  default: "draft",
},

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   UNIQUE RESULT INDEX
========================================= */

resultSchema.index(
  {
    schoolId: 1,
    studentId: 1,
    subjectId: 1,
    sessionId: 1,
    termId: 1,
  },
  { unique: true }
);

/* =========================================
   🔥 LIFECYCLE SAFETY HOOK (IMPORTANT)
========================================= */

resultSchema.pre("save", function (next) {
  if (!this.status) {
    this.status = "draft";
  }

  const allowed = [
    "draft",
    "generated",
    "published",
    "locked",
  ];

  if (!allowed.includes(this.status)) {
    return next(
      new Error(`Invalid result status: ${this.status}`)
    );
  }

  next();
});

export const Result = mongoose.model("Result", resultSchema);