import mongoose from "mongoose";

const paymentIntentSchema = new mongoose.Schema(
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

    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
      index: true,
    },

    feePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      default: null,
    },

    reference: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    expectedAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
      required: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "initializing",
        "pending",
        "success",
        "failed",
        "expired",
      ],
      default: "initializing",
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentIntentSchema.index({
  schoolId: 1,
  studentFeeId: 1,
  status: 1,
});

export const PaymentIntent =
  mongoose.models.PaymentIntent ||
  mongoose.model("PaymentIntent", paymentIntentSchema);

export default PaymentIntent;
