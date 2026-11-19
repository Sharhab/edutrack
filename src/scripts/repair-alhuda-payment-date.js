
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { SubPayment } from "../modules/billing/sub-payment.model.js";
import { verifyPaystackPayment } from "../modules/billing/paystack.service.js";

const REFERENCE =
  "EDUTRACK-edc41431-9230-4f7a-b5bd-f1468dd583f1";

async function repairPaymentDate() {
  try {
    await mongoose.connect(env.MONGO_URI);

    console.log("MongoDB connected");

    const payment = await SubPayment.findOne({
      reference: REFERENCE,
    }).populate("schoolId", "name");

    if (!payment) {
      throw new Error("Payment record not found.");
    }

    if (!payment.schoolId?.name?.toLowerCase().includes("al-huda")) {
      throw new Error("Payment does not belong to Al-Huda Academy.");
    }

    if (payment.status !== "success") {
      throw new Error("Payment is not marked successful.");
    }

    if (Number(payment.amount) !== 27000) {
      throw new Error("Payment amount does not match ₦27,000.");
    }

    if (payment.paidAt) {
      console.log("Payment already has a paid date:", payment.paidAt);
      return;
    }

    // Retrieve original transaction from Paystack.
    const response = await verifyPaystackPayment(REFERENCE);
    const transaction = response?.data;

    if (
      response?.status !== true ||
      transaction?.status !== "success" ||
      transaction?.reference !== REFERENCE ||
      transaction?.currency !== "NGN"
    ) {
      throw new Error("Paystack verification failed.");
    }

    // Confirm the exact amount in kobo.
    if (Number(transaction.amount) !== 2700000) {
      throw new Error("Paystack amount does not match ₦27,000.");
    }

    if (!transaction.paid_at) {
      throw new Error("Paystack did not return a payment date.");
    }

    const verifiedPaidAt = new Date(transaction.paid_at);

    if (Number.isNaN(verifiedPaidAt.getTime())) {
      throw new Error("Invalid payment date from Paystack.");
    }

    // Update ONLY the missing payment date.
    payment.paidAt = verifiedPaidAt;

    await payment.save();

    console.log("Payment date successfully updated.");
    console.log("School:", payment.schoolId.name);
    console.log("Amount: ₦27,000");
    console.log("Paid At:", verifiedPaidAt.toISOString());
    console.log("Reference:", REFERENCE);

  } catch (error) {
    console.error("Payment repair failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

repairPaymentDate();
