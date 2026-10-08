import mongoose from "mongoose";

const timetableRequirementSchema =
  new mongoose.Schema(
    {
      /*
      =========================================
      SCHOOL
      =========================================
      */
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true,
      },

      /*
      =========================================
      SESSION
      =========================================
      */
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
        index: true,
      },

      /*
      =========================================
      TERM
      =========================================
      */
      termId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Term",
        required: true,
        index: true,
      },

      /*
      =========================================
      CLASS
      =========================================
      */
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
        index: true,
      },

      /*
      =========================================
      SUBJECT
      =========================================
      */
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
        index: true,
      },

      /*
      =========================================
      TEACHER
      =========================================

      This references the User account because
      your Subject.teacherIds and
      Teacher.userId both reference User.
      */
      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
      =========================================
      PERIODS PER WEEK
      =========================================

      Example:

      Mathematics = 5
      English     = 5
      Biology     = 3
      */
      periodsPerWeek: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
      },

      /*
      =========================================
      DOUBLE PERIOD
      =========================================

      Some subjects may require:

      Period 1 + Period 2
      */

      allowDoublePeriod: {
        type: Boolean,
        default: false,
      },

      /*
      =========================================
      MAX CONSECUTIVE PERIODS
      =========================================

      Prevents something like:

      Maths
      Maths
      Maths
      Maths
      */

      maxConsecutivePeriods: {
        type: Number,
        default: 1,
        min: 1,
        max: 4,
      },

      /*
      =========================================
      ACTIVE
      =========================================
      */
      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
=========================================
PREVENT DUPLICATE REQUIREMENTS
=========================================

A class cannot have the same subject/teacher
requirement twice for the same session/term.
*/
timetableRequirementSchema.index(
  {
    schoolId: 1,
    sessionId: 1,
    termId: 1,
    classId: 1,
    subjectId: 1,
  },
  {
    unique: true,
  }
);

/*
=========================================
FAST GENERATOR LOOKUPS
=========================================
*/

timetableRequirementSchema.index({
  schoolId: 1,
  sessionId: 1,
  termId: 1,
  classId: 1,
  isActive: 1,
});

timetableRequirementSchema.index({
  schoolId: 1,
  sessionId: 1,
  termId: 1,
  teacherId: 1,
  isActive: 1,
});

export const TimetableRequirement =
  mongoose.models.TimetableRequirement ||
  mongoose.model(
    "TimetableRequirement",
    timetableRequirementSchema
  );

export default TimetableRequirement;
