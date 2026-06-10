import mongoose from "mongoose";
import { StudentFee } from "../fees/studentFee.model.js";
import { Receipt } from "../models/receipt.model.js";
import { ApiError } from "../../../utils/apiError.js";

export async function processFeePayment({
  schoolId,
  studentId,
  amountPaid,
  method,
  reference,
  metadata = {},
}) {
  if (!schoolId || !studentId) {
    throw new ApiError(400, "Missing payment identifiers");
  }

  const studentFee = await StudentFee.findOne({
    schoolId,
    studentId,
  });

  if (!studentFee) {
    throw new ApiError(404, "Student fee not found");
  }

  // =========================================
  // UPDATE SOURCE OF TRUTH (StudentFee)
  // =========================================
  studentFee.amountPaid = (studentFee.amountPaid || 0) + amountPaid;
  studentFee.balance =
    (studentFee.totalAmount || 0) - studentFee.amountPaid;

  if (studentFee.balance <= 0) {
    studentFee.status = "paid";
  } else {
    studentFee.status = "partial";
  }

  await studentFee.save();

  // =========================================
  // CREATE RECEIPT (AUTO)
  // =========================================
  const receipt = await Receipt.create({
    schoolId,
    studentId,
    studentFeeId: studentFee._id,

    amountPaid,
    method,
    reference,

    session: studentFee.session || "",
    term: studentFee.term || "",

    issuedAt: new Date(),
    metadata,
  });

  return {
    studentFee,
    receipt,
  };
}