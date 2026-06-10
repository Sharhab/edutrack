import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
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

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeInvoice",
      required: true,
    },

    type: {
      type: String,
      enum: ["sms", "email", "whatsapp"],
      default: "sms",
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },

    message: {
      type: String,
      required: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Reminder =
  mongoose.model("Reminder", reminderSchema);