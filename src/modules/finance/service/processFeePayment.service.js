import mongoose from "mongoose";

import { StudentFee } from "../fees/studentFee.model.js";
import { Payment } from "../fees/fee-payment.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Receipt } from "../models/receipt.model.js";
import { Ledger } from "../models/ledger.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../../../utils/apiError.js";
import { PaymentIntent } from "../models/paymentIntent.model.js";
import { PaymentReconciliation } from "../models/paymentReconciliation.model.js";

const MAX_TRANSACTION_ATTEMPTS = 3;
const RETRY_DELAY_MS = 150;

function makeReceiptNumber() {
  return `RCT-${Date.now()}-${new mongoose.Types.ObjectId()
    .toString()
    .slice(-8)
    .toUpperCase()}`;
}

function isRetryableTransactionError(error) {
  if (typeof error?.hasErrorLabel === "function") {
    if (
      error.hasErrorLabel("TransientTransactionError") ||
      error.hasErrorLabel("UnknownTransactionCommitResult")
    ) {
      return true;
    }
  }

  return error?.code === 112;
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

    // Allow the final payment to clear a balance below the minimum.
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

async function recordReconciliation({
  schoolId,
  studentId,
  studentFeeId,
  paymentReference,
  paymentAmount,
  validatedIntent,
  reconciliationReason,
  reconciliationDetails,
}) {
  if (!validatedIntent || !reconciliationReason) {
    return;
  }

  try {
    await PaymentReconciliation.updateOne(
      {
        schoolId,
        reference: paymentReference,
      },
      {
        $setOnInsert: {
          schoolId,
          studentId,
          studentFeeId,
          paymentIntentId: validatedIntent._id,
          reference: paymentReference,
          expectedAmount: validatedIntent.expectedAmount,
          verifiedAmount: paymentAmount,
          currency: "NGN",
          reason: reconciliationReason,
          status: "pending",
          details: reconciliationDetails,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(
      "PAYMENT RECONCILIATION RECORDING ERROR:",
      error
    );
  }
}

async function processFeePaymentAttempt({
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

  const paymentReference = String(reference).trim();
  const paymentAmount = Math.round(Number(amountPaid) * 100) / 100;

  if (
    !paymentReference ||
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    throw new ApiError(
      400,
      "Invalid payment reference or amount"
    );
  }

  if (
    method === "paystack" &&
    (
      (metadata.schoolId &&
        String(metadata.schoolId) !== String(schoolId)) ||
      (metadata.studentId &&
        String(metadata.studentId) !== String(studentId)) ||
      (metadata.studentFeeId &&
        String(metadata.studentFeeId) !== String(studentFeeId))
    )
  ) {
    throw new ApiError(400, "Payment metadata does not match");
  }

  const session = await mongoose.startSession();

  let validatedIntent = null;
  let reconciliationReason = null;
  let reconciliationDetails = "";

  try {
    session.startTransaction();

    if (method === "paystack") {
      const paymentIntent = await PaymentIntent.findOne({
        schoolId,
        reference: paymentReference,
      }).session(session);

      if (!paymentIntent) {
        throw new ApiError(
          404,
          "No saved payment intent exists for this Paystack reference"
        );
      }

      if (
        String(paymentIntent.studentId) !== String(studentId) ||
        String(paymentIntent.studentFeeId) !== String(studentFeeId) ||
        !metadata.paymentIntentId ||
        String(metadata.paymentIntentId) !== String(paymentIntent._id)
      ) {
        throw new ApiError(
          409,
          "Payment does not match the saved payment intent"
        );
      }

      if (
        paymentIntent.currency !== "NGN" ||
        Math.abs(
          Number(paymentIntent.expectedAmount) - paymentAmount
        ) > 0.01
      ) {
        throw new ApiError(
          409,
          "Verified amount or currency does not match the saved payment intent"
        );
      }

      validatedIntent = paymentIntent;
    }

    // Idempotency: do not post the same reference twice.
    const existingPayment = await Payment.findOne({
      schoolId,
      reference: paymentReference,
    }).session(session);

    if (existingPayment) {
      const matches =
        String(existingPayment.studentFeeId) === String(studentFeeId) &&
        String(existingPayment.studentId) === String(studentId) &&
        Math.abs(
          Number(existingPayment.amount) - paymentAmount
        ) < 0.01 &&
        existingPayment.status === "success";

      if (!matches) {
        throw new ApiError(
          409,
          "This reference is already associated with a different or unsuccessful payment"
        );
      }

      const existingReceipt = await Receipt.findOne({
        schoolId,
        paymentId: existingPayment._id,
      }).session(session);

      if (validatedIntent && validatedIntent.status !== "success") {
        validatedIntent.status = "success";
        validatedIntent.paidAt =
          existingPayment.paidAt || new Date();

        await validatedIntent.save({ session });
      }

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

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(previousPaid) ||
      total < 0 ||
      previousPaid < 0 ||
      previousPaid > total + 0.01
    ) {
      throw new ApiError(409, "Student fee amounts are invalid");
    }

    const currentBalance = Math.max(
      Math.round((total - previousPaid) * 100) / 100,
      0
    );

    if (currentBalance <= 0) {
      reconciliationReason = "fee_already_paid";
      reconciliationDetails =
        "Paystack payment was verified, but the student fee has no outstanding balance.";

      throw new ApiError(
        409,
        "Fee is already paid; the verified transaction requires reconciliation"
      );
    }

    if (paymentAmount > currentBalance + 0.001) {
      reconciliationReason = "overpayment";
      reconciliationDetails =
        "Verified payment exceeds the current outstanding student-fee balance.";

      throw new ApiError(
        409,
        "Verified payment exceeds the outstanding balance; reconciliation is required"
      );
    }

    const feePlan = await FeeStructure.findOne({
      _id: studentFee.feePlanId,
      schoolId,
    })
      .select("paymentPolicy")
      .session(session);

    try {
      validatePaymentPolicy(
        feePlan?.paymentPolicy || { mode: "full_only" },
        paymentAmount,
        currentBalance
      );
    } catch (error) {
      if (validatedIntent) {
        reconciliationReason = "balance_changed";
        reconciliationDetails =
          "The verified payment no longer matches the current fee payment policy or balance.";
      }

      throw error;
    }

    const newAmountPaid =
      Math.round((previousPaid + paymentAmount) * 100) / 100;

    const newBalance = Math.max(
      Math.round((total - newAmountPaid) * 100) / 100,
      0
    );

    const newStatus = newBalance <= 0 ? "paid" : "partial";

    /*
     * Compare-and-update protects against overwriting a fee balance
     * changed by another operation.
     *
     * Legacy documents may have no amountPaid field. Treat a missing
     * field as zero only when the value we read was zero.
     */
    const feeFilter = {
      _id: studentFee._id,
      schoolId,
      studentId,
      ...(previousPaid === 0
        ? {
            $or: [
              { amountPaid: 0 },
              { amountPaid: { $exists: false } },
            ],
          }
        : { amountPaid: previousPaid }),
    };

    const feeUpdate = await StudentFee.updateOne(
      feeFilter,
      {
        $set: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        },
      },
      { session }
    );

    if (feeUpdate.modifiedCount !== 1) {
      reconciliationReason = validatedIntent
        ? "balance_changed"
        : null;

      reconciliationDetails =
        "The student-fee balance changed while the payment was being processed.";

      throw new ApiError(
        409,
        "Student fee changed during payment processing; reconciliation may be required"
      );
    }

    const [payment] = await Payment.create(
      [
        {
          schoolId,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          paymentMethod:
            method === "paystack" ? "online" : method,
          reference: paymentReference,
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

    // Update only the invoice for this fee and academic period.
    const invoiceQuery = {
      schoolId,
      studentId,
      feeStructureId: studentFee.feePlanId,
    };

    if (studentFee.sessionId) {
      invoiceQuery.sessionId = studentFee.sessionId;
    } else {
      invoiceQuery.sessionId = { $exists: false };
    }

    if (studentFee.termId) {
      invoiceQuery.termId = studentFee.termId;
    } else {
      invoiceQuery.termId = { $exists: false };
    }

    const invoice = await Invoice.findOne(invoiceQuery)
      .sort({ createdAt: -1 })
      .session(session);

    if (invoice) {
      invoice.amount = total;
      invoice.totalAmount = total;
      invoice.amountPaid = newAmountPaid;
      invoice.balanceAmount = newBalance;
      invoice.paymentStatus = newStatus;
      invoice.status = newStatus;

      await invoice.save({ session });
    }

    await Ledger.create(
      [
        {
          schoolId,
          studentId,
          type: "payment",
          amount: paymentAmount,
          balanceAfter: newBalance,
          reference: payment._id.toString(),
          description:
            method === "paystack"
              ? "Paystack student fee payment"
              : "Student fee payment",
        },
      ],
      { session }
    );

    const receiptMethod =
      method === "paystack"
        ? "paystack"
        : [
            "manual",
            "bank",
            "cash",
            "bank_transfer",
            "pos",
          ].includes(method)
          ? method
          : "manual";

    const [receipt] = await Receipt.create(
      [
        {
          schoolId,
          paymentId: payment._id,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          amountPaid: newAmountPaid,
          method: receiptMethod,
          status: "success",
          reference: paymentReference,
          title: studentFee.title,
          totalAmount: total,
          balance: newBalance,
          session: studentFee.session || "",
          term: studentFee.term || "",
          receiptNumber: makeReceiptNumber(),
          issuedAt: new Date(),
          metadata,
        },
      ],
      { session }
    );

    if (validatedIntent) {
      validatedIntent.status = "success";
      validatedIntent.paidAt = new Date();

      await validatedIntent.save({ session });
    }

    await session.commitTransaction();

    return {
      alreadyProcessed: false,
      payment,
      receipt,
      studentFee: {
        ...studentFee.toObject(),
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      },
      invoice,
    };
  } catch (error) {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error(
          "PAYMENT TRANSACTION ABORT ERROR:",
          abortError
        );
      }
    }

    /*
     * Do not create a reconciliation case for a retryable transaction
     * error yet. The outer wrapper may retry the complete operation.
     */
    if (
      method === "paystack" &&
      validatedIntent &&
      reconciliationReason &&
      !isRetryableTransactionError(error)
    ) {
      await recordReconciliation({
        schoolId,
        studentId,
        studentFeeId,
        paymentReference,
        paymentAmount,
        validatedIntent,
        reconciliationReason,
        reconciliationDetails,
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

export async function processFeePayment(options) {
  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await processFeePaymentAttempt(options);
    } catch (error) {
      const shouldRetry =
        isRetryableTransactionError(error) &&
        attempt < MAX_TRANSACTION_ATTEMPTS;

      if (!shouldRetry) {
        throw error;
      }

      console.warn(
        `PAYMENT TRANSACTION RETRY: attempt ${attempt + 1} of ${MAX_TRANSACTION_ATTEMPTS}`,
        {
          reference: options?.reference,
          errorCode: error?.code,
          errorMessage: error?.message,
        }
      );

      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * attempt)
      );
    }
  }

  throw new Error(
    "Payment processing failed after retry attempts"
  );
}
