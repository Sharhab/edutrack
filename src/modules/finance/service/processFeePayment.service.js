
import mongoose from "mongoose";

import { StudentFee } from "../fees/studentFee.model.js";
import { Payment } from "../fees/fee-payment.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Receipt } from "../models/receipt.model.js";
import { Ledger } from "../models/ledger.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../../../utils/apiError.js";

function makeReceiptNumber() {
  return `RCT-${Date.now()}-${new mongoose.Types.ObjectId()
    .toString()
    .slice(-8)
    .toUpperCase()}`;
}

function validatePaymentPolicy(policy, paymentAmount, balance) {
  const mode = policy?.mode || "full_only";
  const tolerance = 0.01;

  if (mode === "full_only") {
    if (Math.abs(paymentAmount - balance) > tolerance) {
      throw new ApiError(
        400,
        "This fee requires full payment of the outstanding balance"
      );
    }

    return;
  }

  if (mode === "flexible_partial") {
    const minimum = Number(policy.minimumPaymentAmount || 0);

    if (paymentAmount > balance + tolerance) {
      throw new ApiError(
        400,
        "Payment exceeds the outstanding balance"
      );
    }

    // Permit the final payment to clear a balance below the minimum.
    if (
      minimum > 0 &&
      paymentAmount < minimum - tolerance &&
      paymentAmount < balance - tolerance
    ) {
      throw new ApiError(
        400,
        `The minimum payment is ${minimum}`
      );
    }

    return;
  }

  if (mode === "fixed_installment") {
    const installment = Number(policy.installmentAmount);

    if (!Number.isFinite(installment) || installment <= 0) {
      throw new ApiError(
        400,
        "The fee installment policy is not configured correctly"
      );
    }

    // The final installment may be smaller than the usual installment.
    const requiredAmount = Math.min(installment, balance);

    if (Math.abs(paymentAmount - requiredAmount) > tolerance) {
      throw new ApiError(
        400,
        `Payment must match the required installment amount of ${requiredAmount}`
      );
    }

    return;
  }

  throw new ApiError(400, "Unsupported fee payment policy");
}

export async function processFeePayment({
  schoolId,
  studentId,
  studentFeeId,
  amountPaid,
  method = "paystack",
  reference,
  metadata = {},
}) {
  if (!schoolId || !studentId || !studentFeeId || !reference) {
    throw new ApiError(400, "Missing payment identifiers");
  }

  const paymentAmount = Number(amountPaid);

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new ApiError(400, "Invalid payment amount");
  }

  if (method === "paystack" && metadata.schoolId &&
      String(metadata.schoolId) !== String(schoolId)) {
    throw new ApiError(400, "Payment school does not match");
  }

  if (method === "paystack" && metadata.studentId &&
      String(metadata.studentId) !== String(studentId)) {
    throw new ApiError(400, "Payment student does not match");
  }

  if (method === "paystack" && metadata.studentFeeId &&
      String(metadata.studentFeeId) !== String(studentFeeId)) {
    throw new ApiError(400, "Payment fee does not match");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Make repeated webhook/callback delivery idempotent.
    const existingPayment = await Payment.findOne({
      schoolId,
      reference,
    }).session(session);

    if (existingPayment) {
      const sameFee =
        String(existingPayment.studentFeeId) === String(studentFeeId);
      const sameStudent =
        String(existingPayment.studentId) === String(studentId);
      const sameAmount =
        Math.abs(Number(existingPayment.amount) - paymentAmount) < 0.01;

      if (!sameFee || !sameStudent || !sameAmount) {
        throw new ApiError(
          409,
          "This payment reference is already associated with a different payment"
        );
      }

      const existingReceipt = await Receipt.findOne({
        schoolId,
        paymentId: existingPayment._id,
      }).session(session);

      await session.commitTransaction();

      return {
        alreadyProcessed: true,
        payment: existingPayment,
        receipt: existingReceipt,
      };
    }

    const studentFee = await StudentFee.findOne({
      _id: studentFeeId,
      schoolId,
      studentId,
    }).session(session);

    if (!studentFee) {
      throw new ApiError(404, "Student fee not found");
    }

    const total = Number(studentFee.totalAmount || 0);
    const previousPaid = Number(studentFee.amountPaid || 0);
    const currentBalance = Math.max(total - previousPaid, 0);

    if (currentBalance <= 0) {
      throw new ApiError(
        400,
        "This student fee is already fully paid"
      );
    }

    if (paymentAmount > currentBalance + 0.01) {
      throw new ApiError(
        400,
        "Verified payment exceeds the outstanding student fee balance"
      );
    }

    // Re-read the fee plan policy on the server.
    const feePlan = await FeeStructure.findOne({
      _id: studentFee.feePlanId,
      schoolId,
    })
      .select("paymentPolicy")
      .session(session);

    const policy = feePlan?.paymentPolicy || { mode: "full_only" };

    validatePaymentPolicy(policy, paymentAmount, currentBalance);

    // Create the successful payment record.
    const [payment] = await Payment.create(
      [
        {
          schoolId,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          paymentMethod:
            method === "paystack" ? "online" : method,
          reference,
          status: "success",
          paidAt: new Date(),
          note:
            method === "paystack"
              ? "Paystack student fee payment"
              : "Student fee payment",
        },
      ],
      { session }
    );

    // Update the student's fee balance.
    studentFee.amountPaid = previousPaid + paymentAmount;
    studentFee.balance = Math.max(
      total - studentFee.amountPaid,
      0
    );
    studentFee.status =
      studentFee.balance <= 0 ? "paid" : "partial";

    await studentFee.save({ session });

    // Find the invoice for this fee and academic period.
    const invoiceQuery = {
      schoolId,
      studentId,
      feeStructureId: studentFee.feePlanId,
    };

    if (studentFee.sessionId) {
      invoiceQuery.sessionId = studentFee.sessionId;
    }

    if (studentFee.termId) {
      invoiceQuery.termId = studentFee.termId;
    }

    const invoice = await Invoice.findOne(invoiceQuery)
      .sort({ createdAt: -1 })
      .session(session);

    if (invoice) {
      invoice.amount = total;
      invoice.totalAmount = total;
      invoice.amountPaid = studentFee.amountPaid;
      invoice.balanceAmount = studentFee.balance;
      invoice.paymentStatus = studentFee.status;
      invoice.status = studentFee.status;

      await invoice.save({ session });
    }

    // Add the ledger entry.
    await Ledger.create(
      [
        {
          schoolId,
          studentId,
          type: "payment",
          amount: paymentAmount,
          balanceAfter: studentFee.balance,
          reference: String(payment._id),
          description:
            method === "paystack"
              ? "Paystack student fee payment"
              : "Student fee payment",
        },
      ],
      { session }
    );

    // Issue a receipt.
    const [receipt] = await Receipt.create(
      [
        {
          schoolId,
          paymentId: payment._id,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          amountPaid: studentFee.amountPaid,
          method: method === "paystack" ? "paystack" : method,
          status: "success",
          reference,
          title: studentFee.title,
          totalAmount: total,
          balance: studentFee.balance,
          session: studentFee.session || "",
          term: studentFee.term || "",
          receiptNumber: makeReceiptNumber(),
          issuedAt: new Date(),
          metadata,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      alreadyProcessed: false,
      payment,
      receipt,
      studentFee,
      invoice,
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw err;
  } finally {
    await session.endSession();
  }
}
