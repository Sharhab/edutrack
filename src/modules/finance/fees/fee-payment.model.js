import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "card", "online", "pos"],
      default: "cash",
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },

    reference: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "success",
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/*
 * Prevent duplicate non-empty payment references within a school.
 * Empty references remain allowed for manual payments without a reference.
 */
feePaymentSchema.index(
  { schoolId: 1, reference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reference: { $type: "string", $gt: "" },
    },
    name: "unique_school_payment_reference",
  }
);

/* Useful lookup index for a school's student payment history. */
feePaymentSchema.index(
  { schoolId: 1, studentId: 1 },
  { name: "school_student_payments" }
);

export const Payment =
  mongoose.models.FeePayment ||
  mongoose.model("FeePayment", feePaymentSchema, "payments");
