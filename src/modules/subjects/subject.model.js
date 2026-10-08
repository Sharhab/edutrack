import mongoose from "mongoose";

const subjectSchema =
  new mongoose.Schema(
    {
      /* =========================================
         SCHOOL
      ========================================= */
      schoolId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true,
      },

      /* =========================================
         BASIC INFO
      ========================================= */
      name: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        trim: true,
        uppercase: true,
      },

      description: {
        type: String,
        default: "",
      },

      /* =========================================
         CLASS / TEACHER ASSIGNMENT
      ========================================= */
      classIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],

      teacherIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      /**
       * IMPORTANT:
       * aligned with onboarding bootstrap
       */
      category: {
        type: String,
        enum: [
          "general",
          "core",
          "science",
          "commercial",
          "arts",
          "vocational",
          "elective",
        ],
        default: "general",
      },

      /**
       * IMPORTANT:
       * bootstrap already inserts this
       */
      isCore: {
        type: Boolean,
        default: false,
      },

      /* =========================================
         RESULT ENGINE V2
      ========================================= */

      ca1Max: {
        type: Number,
        default: 20,
      },

      ca2Max: {
        type: Number,
        default: 20,
      },

      assignmentMax: {
        type: Number,
        default: 10,
      },

      examMax: {
        type: Number,
        default: 50,
      },

      totalMark: {
        type: Number,
        default: 100,
      },

      passMark: {
        type: Number,
        default: 40,
      },

      gradingSystem: {
        type: String,
        enum: [
          "default",
          "waec",
          "custom",
        ],
        default: "default",
      },

      allowResultEntry: {
        type: Boolean,
        default: true,
      },

      publishable: {
        type: Boolean,
        default: true,
      },

      resultLocked: {
        type: Boolean,
        default: false,
      },

      autosaveEnabled: {
        type: Boolean,
        default: true,
      },

      resultEntryMode: {
        type: String,
        enum: [
          "simple",
          "enterprise",
          "live",
        ],
        default: "enterprise",
      },

      /* =========================================
         STATUS
      ========================================= */

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================
   INDEXES
========================================= */

subjectSchema.index({
  schoolId: 1,
  name: 1,
});

subjectSchema.index({
  schoolId: 1,
  code: 1,
});

/**
 * Prevent duplicate subjects
 */
subjectSchema.index(
  {
    schoolId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

/* =========================================
   EXPORT
========================================= */

export const SubjectModel =
  mongoose.model(
    "Subject",
    subjectSchema
  );
