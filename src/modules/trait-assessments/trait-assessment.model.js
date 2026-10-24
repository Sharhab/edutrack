
import mongoose from "mongoose";

const traitRatingSchema = new mongoose.Schema(
  {
    traitKey: { type: String, required: true },
    traitName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const studentAssessmentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
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
    psychomotor: { type: [traitRatingSchema], default: [] },
    affective: { type: [traitRatingSchema], default: [] },
    teacherComment: { type: String, default: "", maxlength: 1000 },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

studentAssessmentSchema.index(
  { schoolId: 1, studentId: 1, sessionId: 1, termId: 1 },
  { unique: true }
);

export const TraitAssessment = mongoose.model(
  "TraitAssessment",
  studentAssessmentSchema
);
