import mongoose from "mongoose";

const discountSchema =
  new mongoose.Schema(
    {
      schoolId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
      },

      studentId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      type: {
        type: String,
        enum: [
          "percentage",
          "fixed",
        ],
        default: "fixed",
      },

      value: {
        type: Number,
        required: true,
        min: 0,
      },

      reason: {
        type: String,
        default: "",
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

discountSchema.index({
  schoolId: 1,
  studentId: 1,
});

export const Discount =
  mongoose.model(
    "Discount",
    discountSchema
  );