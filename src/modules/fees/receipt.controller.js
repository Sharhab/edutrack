import {
  createReceipt,
  getReceipts,
} from "./receipt.service.js";

import { Receipt } from "../finance/models/receipt.model.js"

import { ApiError } from "../../utils/apiError.js";

/* ===============================
   CREATE RECEIPT
================================ */
export async function createReceiptHandler(
  req,
  res
) {
  const data =
    await createReceipt({
      schoolId:
        req.user.schoolId,

      paymentId:
        req.body.paymentId,

      studentId:
        req.body.studentId,

      amount:
        req.body.amount,

      method:
        req.body.method,
    });

  res.json({
    success: true,
    data,
  });
}

/* ===============================
   LIST RECEIPTS
================================ */
export async function listReceiptsHandler(
  req,
  res
) {
  const data =
    await getReceipts(
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}

/* ===============================
   GET SINGLE RECEIPT
================================ */
export async function getReceiptHandler(
  req,
  res
) {
  const receipt =
    await Receipt.findOne({
      _id: req.params.id,

      schoolId:
        req.user.schoolId,
    }).populate(
      "studentId",
      "firstName lastName"
    );

  if (!receipt) {
    throw new ApiError(
      404,
      "Receipt not found"
    );
  }

  res.json({
    success: true,
    data: receipt,
  });
}