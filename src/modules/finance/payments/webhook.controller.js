import { createHmac, timingSafeEqual } from "node:crypto";
import { processFeePayment } from "../service/processFeePayment.service.js";
import { getPaystackSecret } from "./paystack.service.js";

function isValidPaystackSignature(req) {
  const signature = req.headers["x-paystack-signature"];

  if (
    typeof signature !== "string" ||
    !req.rawBody ||
    !Buffer.isBuffer(req.rawBody)
  ) {
    return false;
  }

  const secretKey = getPaystackSecret();

  const expectedSignature = createHmac("sha512", secretKey)
    .update(req.rawBody)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function paystackWebhookHandler(req, res) {
  try {
    // Verify that this request genuinely came from Paystack.
    if (!isValidPaystackSignature(req)) {
      console.warn("PAYSTACK WEBHOOK: Invalid signature");
      return res.sendStatus(401);
    }

    const event = req.body;

    // Acknowledge other event types without processing them here.
    if (event?.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;
    const metadata = data?.metadata || {};

    if (!data?.reference) {
      throw new Error("Paystack reference missing");
    }

    if (data.currency !== "NGN") {
      throw new Error("Unsupported payment currency");
    }

    if (!metadata.schoolId || !metadata.studentId || !metadata.studentFeeId) {
      throw new Error("Required student-fee metadata is missing");
    }

    const amountPaid = Number(data.amount) / 100;

    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      throw new Error("Invalid Paystack payment amount");
    }

    await processFeePayment({
      schoolId: metadata.schoolId,
      studentId: metadata.studentId,
      studentFeeId: metadata.studentFeeId,
      amountPaid,
      method: "paystack",
      reference: data.reference,
      metadata,
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error("PAYSTACK WEBHOOK ERROR:", err);
    return res.sendStatus(500);
  }
}
