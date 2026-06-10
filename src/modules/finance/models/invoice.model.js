import mongoose from "mongoose";

const invoiceSchema =
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
         STUDENT
      ========================================= */
      studentId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Student",

        required: true,

        index: true,
      },

      sessionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Session",
},

termId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Term",
},

      /* =========================================
         INVOICE NUMBER
      ========================================= */
      invoiceNumber: {
        type: String,

        required: true,

        unique: true,

        trim: true,
      },

      /* =========================================
         FEE STRUCTURE
      ========================================= */
      feeStructureId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "FeeStructure",

        required: true,
      },

      /* =========================================
         TITLE
      ========================================= */
      title: {
        type: String,

        default: "",

        trim: true,
      },

      /* =========================================
         LEGACY AMOUNT
      ========================================= */
      amount: {
        type: Number,

        required: true,

        min: 0,

        default: 0,
      },

      /* =========================================
         TOTAL AMOUNT
      ========================================= */
      totalAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      /* =========================================
         AMOUNT PAID
      ========================================= */
      amountPaid: {
        type: Number,

        default: 0,

        min: 0,
      },

      /* =========================================
         BALANCE AMOUNT
      ========================================= */
      balanceAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      /* =========================================
         PAYMENT STATUS
      ========================================= */
      paymentStatus: {
        type: String,

        enum: [
          "unpaid",
          "partial",
          "paid",
        ],

        default: "unpaid",
      },

      /* =========================================
         LEGACY STATUS
      ========================================= */
      status: {
        type: String,

        enum: [
          "unpaid",
          "partial",
          "paid",
          "cancelled",
        ],

        default: "unpaid",
      },

      /* =========================================
         DUE DATE
      ========================================= */
      dueDate: {
        type: Date,

        default: null,
      },

      /* =========================================
         ISSUE DATE
      ========================================= */
      issuedAt: {
        type: Date,

        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================
   INDEXES
========================================= */

invoiceSchema.index({
  schoolId: 1,
  invoiceNumber: 1,
});

invoiceSchema.index({
  schoolId: 1,
  studentId: 1,
});

invoiceSchema.index({
  schoolId: 1,
  paymentStatus: 1,
});

/* =========================================
   EXPORT
========================================= */

export const Invoice =
  mongoose.models.Invoice ||
  mongoose.model(
    "Invoice",
    invoiceSchema
  );

export default Invoice;