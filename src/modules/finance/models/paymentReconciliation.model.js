import mongoose from "mongoose";

const paymentReconciliationSchema = new mongoose.Schema(
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

    paymentIntentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentIntent",
      default: null,
    },

    reference: {
      type: String,
      required: true,
      trim: true,
    },

    expectedAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    verifiedAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN"],
    },

    reason: {
      type: String,
      required: true,
      enum: [
        "balance_changed",
        "overpayment",
        "fee_already_paid",
        "intent_mismatch",
        "recording_failed",
        "other",
      ],
    },

    status: {
      type: String,
      enum: ["pending", "resolved", "refunded", "dismissed"],
      default: "pending",
      index: true,
    },

    details: {
      type: String,
      default: "",
      trim: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// One reconciliation case per school and gateway reference.
paymentReconciliationSchema.index(
  { schoolId: 1, reference: 1 },
  {
    unique: true,
    name: "unique_school_reconciliation_reference",
  }
);

export const PaymentReconciliation =
  mongoose.models.PaymentReconciliation ||
  mongoose.model(
    "PaymentReconciliation",
    paymentReconciliationSchema
  );

export default PaymentReconciliation;
