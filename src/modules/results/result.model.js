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
   /* =========================================
   ASSESSMENT SCORES
   TOTAL = 100
========================================= */

ca1: {
  type: Number,
  min: 0,
  max: 10,
},

ca2: {
  type: Number,
  min: 0,
  max: 10,
},

assignment: {
  type: Number,
  min: 0,
  max: 10,
},

exam: {
  type: Number,
  min: 0,
  max: 70,
},

/* =========================================
   DYNAMIC ASSESSMENT SCORES
   Existing fields remain for compatibility.
========================================= */

scores: {
  type: Map,
  of: {
    type: Number,
    min: 0,
    max: 100,
  },
  default: {},
},

/* =========================================
   ASSESSMENT SCHEME SNAPSHOT
   Preserves the scheme used for this result.
========================================= */

assessmentScheme: {
  version: {
    type: Number,
    default: 1,
    min: 1,
  },

  totalMax: {
    type: Number,
    default: 100,
    min: 1,
    max: 100,
  },

  components: [
    {
      _id: false,

      key: {
        type: String,
        required: true,
      },

      label: {
        type: String,
        required: true,
      },

      maxScore: {
        type: Number,
        required: true,
        min: 0.01,
        max: 100,
      },
    },
  ],
},
total: {
  type: Number,
  default: 0,
  min: 0,
  max: 100,
},
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
