import mongoose from "mongoose";

const teacherAssignmentSchema =
  new mongoose.Schema(
    {
      /**
       * =========================================
       * CLASS
       * =========================================
       */
      classId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
      },

      /**
       * =========================================
       * SUBJECT
       * =========================================
       */
      subjectId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },

      /**
       * =========================================
       * OPTIONAL TIMETABLE SUPPORT
       * =========================================
       */
      periods: [
        {
          day: {
            type: String,
            trim: true,
          },

          startTime: {
            type: String,
            trim: true,
          },

          endTime: {
            type: String,
            trim: true,
          },
        },
      ],
    },
    {
      _id: false,
    }
  );

const teacherSchema =
  new mongoose.Schema(
    {
      /**
       * =========================================
       * SCHOOL
       * =========================================
       */
      schoolId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "School",

        required: true,

        index: true,
      },

      /**
       * =========================================
       * LINKED USER ACCOUNT
       * =========================================
       */
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        unique: true,
      },

      /**
       * =========================================
       * EMPLOYEE ID
       * OPTIONAL FOR BULK IMPORTS
       * =========================================
       */
      employeeId: {
        type: String,

        trim: true,

        default: "",
      },

      /**
       * =========================================
       * PROFILE
       * =========================================
       */
      qualification: {
        type: String,

        default: "",

        trim: true,
      },

      /**
       * =========================================
       * ASSIGNED SUBJECTS
       * =========================================
       */
      subjectIds: [
        {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "Subject",
        },
      ],

      /**
       * =========================================
       * ASSIGNED CLASSES
       * =========================================
       */
      classIds: [
        {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "Class",
        },
      ],

      /**
       * =========================================
       * ADVANCED CLASS + SUBJECT MAPPING
       * =========================================
       */
      assignments: [
        teacherAssignmentSchema,
      ],

      /**
       * =========================================
       * OPTIONAL CLASS TEACHER
       * =========================================
       */
      classTeacherOf: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Class",

        default: null,
      },

      /**
       * =========================================
       * EMPLOYMENT STATUS
       * =========================================
       */
      status: {
        type: String,

        enum: [
          "active",
          "inactive",
        ],

        default: "active",
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * =========================================
 * UNIQUE EMPLOYEE ID
 * ONLY WHEN PROVIDED
 * =========================================
 */
teacherSchema.index(
  {
    schoolId: 1,
    employeeId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      employeeId: {
        $exists: true,
        $ne: "",
      },
    },
  }
);

/**
 * =========================================
 * FAST QUERY INDEXES
 * =========================================
 */
teacherSchema.index({
  schoolId: 1,
  classIds: 1,
});

teacherSchema.index({
  schoolId: 1,
  subjectIds: 1,
});

teacherSchema.index({
  "assignments.classId": 1,
});

teacherSchema.index({
  "assignments.subjectId": 1,
});

/**
 * =========================================
 * VIRTUALS
 * =========================================
 */
teacherSchema.virtual(
  "assignedClasses",
  {
    ref: "Class",

    localField: "classIds",

    foreignField: "_id",
  }
);

teacherSchema.virtual(
  "assignedSubjects",
  {
    ref: "Subject",

    localField: "subjectIds",

    foreignField: "_id",
  }
);

/**
 * =========================================
 * JSON SETTINGS
 * =========================================
 */
teacherSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

teacherSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

export const Teacher =
  mongoose.model(
    "Teacher",
    teacherSchema
  );

export default Teacher;