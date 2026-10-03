import mongoose from "mongoose";

import { StudentFee } from "../fees/studentFee.model.js";
import { Payment } from "../fees/fee-payment.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Receipt } from "../models/receipt.model.js";
import { Ledger } from "../models/ledger.model.js";
import { ApiError } from "../../../utils/apiError.js";

function makeReceiptNumber() {
  return `RCT-${Date.now()}-${new mongoose.Types.ObjectId()
    .toString()
    .slice(-8)
    .toUpperCase()}`;
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

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Prevent a repeated webhook/verification call from recording
    // the same Paystack reference again.
    const existingPayment = await Payment.findOne({
      schoolId,
      reference,
    }).session(session);

    if (existingPayment) {
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
      throw new ApiError(400, "This student fee is already fully paid");
    }

    if (paymentAmount > currentBalance + 0.01) {
      throw new ApiError(
        400,
        "Verified payment exceeds the outstanding student fee balance"
      );
    }

    // 1. Create the fee payment record used by the school admin payments list.
    const [payment] = await Payment.create(
      [
        {
          schoolId,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          paymentMethod: "online",
          reference,
          status: "success",
          paidAt: new Date(),
          note: "Paystack student fee payment",
        },
      ],
      { session }
    );

    // 2. Update the student fee balance.
    studentFee.amountPaid = previousPaid + paymentAmount;
    studentFee.balance = Math.max(total - studentFee.amountPaid, 0);
    studentFee.status =
      studentFee.balance <= 0 ? "paid" : "partial";

    await studentFee.save({ session });

    // 3. Sync the matching invoice, if one exists.
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
      invoice.amountPaid = studentFee.amountPaid;
      invoice.balanceAmount = studentFee.balance;
      invoice.paymentStatus = studentFee.status;
      invoice.status = studentFee.status;

      await invoice.save({ session });
    }

    // 4. Add the student ledger entry.
    await Ledger.create(
      [
        {
          schoolId,
          studentId,
          type: "payment",
          amount: paymentAmount,
          balanceAfter: studentFee.balance,
          reference: payment._id.toString(),
          description: "Paystack student fee payment",
        },
      ],
      { session }
    );

    // 5. Create the receipt linked to the Payment record.
    const [receipt] = await Receipt.create(
      [
        {
          schoolId,
          paymentId: payment._id,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          amountPaid: studentFee.amountPaid,
          method: "paystack",
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
