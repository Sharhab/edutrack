import mongoose from "mongoose";

const lessonNoteContentSchema = new mongoose.Schema(
  {
    previousKnowledge: {
      type: String,
      required: true,
    },
    learningObjectives: [{
      type: String,
      required: true,
    }],
    instructionalMaterials: [{
      type: String,
    }],
    introduction: {
      type: String,
      required: true,
    },
    lessonDevelopment: [{
      stage: { type: String, required: true },
      teacherActivities: { type: String, required: true },
      learnerActivities: { type: String, required: true },
    }],
    evaluationQuestions: [{
      type: String,
    }],
    conclusion: {
      type: String,
      required: true,
    },
    assignment: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const lessonNoteSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    week: {
      type: Number,
      min: 1,
      max: 20,
      default: null,
    },
    durationMinutes: {
      type: Number,
      min: 10,
      max: 240,
      default: 40,
    },
    curriculumRequirements: {
      type: String,
      default: "",
      maxlength: 10000,
    },
    content: {
      type: lessonNoteContentSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "saved"],
      default: "draft",
    },
  },
  { timestamps: true }
);

lessonNoteSchema.index({
  schoolId: 1,
  userId: 1,
  updatedAt: -1,
});

export const LessonNote =
  mongoose.models.LessonNote ||
  mongoose.model("LessonNote", lessonNoteSchema);

export default LessonNote;
