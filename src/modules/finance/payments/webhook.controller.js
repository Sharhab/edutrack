
import { createHmac, timingSafeEqual } from "node:crypto";
import { processFeePayment } from "../service/processFeePayment.service.js";
import {
  getPaystackSecret,
  verifyPaystackPayment,
} from "./paystack.service.js";

function isValidPaystackSignature(req) {
  const signature = req.headers["x-paystack-signature"];

  if (
    typeof signature !== "string" ||
    !/^[a-f0-9]{128}$/i.test(signature) ||
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

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function paystackWebhookHandler(req, res) {
  try {
    // Reject requests that do not have a valid Paystack signature.
    if (!isValidPaystackSignature(req)) {
      console.warn("PAYSTACK WEBHOOK: Invalid signature");
      return res.sendStatus(401);
    }

    const event = req.body;

    // This handler processes successful charges only.
    if (event?.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;
    const eventMetadata = data?.metadata || {};
    const reference = data?.reference;

    if (!reference) {
      console.error("PAYSTACK WEBHOOK: Missing reference");
      return res.sendStatus(400);
    }

    const schoolId = eventMetadata.schoolId;
    const eventStudentId = eventMetadata.studentId;
    const eventStudentFeeId = eventMetadata.studentFeeId;

    if (!schoolId || !eventStudentId || !eventStudentFeeId) {
      console.error(
        "PAYSTACK WEBHOOK: Required payment metadata is missing"
      );

      // Do not acknowledge a malformed payment event as processed.
      return res.sendStatus(400);
    }

    // Independently verify the transaction using Paystack's API.
    const verifiedPayment = await verifyPaystackPayment(
      reference,
      schoolId
    );

    if (
      verifiedPayment.status !== "success" ||
      verifiedPayment.currency !== "NGN" ||
      String(verifiedPayment.reference) !== String(reference)
    ) {
      console.error(
        "PAYSTACK WEBHOOK: Transaction verification failed",
        { reference }
      );

      return res.sendStatus(400);
    }

    const verifiedMetadata = verifiedPayment.metadata || {};

    // Use the identifiers returned by Paystack's verification API,
    // and ensure they match the signed webhook event.
   
if (
  !verifiedMetadata.schoolId ||
  !verifiedMetadata.studentId ||
  !verifiedMetadata.studentFeeId ||
  !verifiedMetadata.paymentIntentId ||
  String(verifiedMetadata.schoolId) !== String(schoolId) ||
  String(verifiedMetadata.studentId) !== String(eventStudentId) ||
  String(verifiedMetadata.studentFeeId) !== String(eventStudentFeeId) ||
  !eventMetadata.paymentIntentId ||
  String(verifiedMetadata.paymentIntentId) !==
    String(eventMetadata.paymentIntentId)
) {
  console.error(
    "PAYSTACK WEBHOOK: Verified metadata or Payment Intent does not match the event",
    { reference }
  );

  return res.sendStatus(400);
}

    // If the event includes the saved intent ID, pass it through
    // so processFeePayment can validate it against the saved intent.
    const metadata = {
      ...verifiedMetadata,
      paymentIntentId: eventMetadata.paymentIntentId || undefined,
      session: verifiedMetadata.session || eventMetadata.session || "",
      term: verifiedMetadata.term || eventMetadata.term || "",
    };

    const amountPaid = Number(verifiedPayment.amount);

    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      console.error(
        "PAYSTACK WEBHOOK: Invalid verified amount",
        { reference }
      );

      return res.sendStatus(400);
    }

    // This service checks the saved PaymentIntent and records the
    // payment, fee balance, invoice, ledger entry, and receipt.
    await processFeePayment({
      schoolId: verifiedMetadata.schoolId,
      studentId: verifiedMetadata.studentId,
      studentFeeId: verifiedMetadata.studentFeeId,
      amountPaid,
      method: "paystack",
      reference: verifiedPayment.reference,
      metadata,
    });

    return res.sendStatus(200);
  } catch (err) {
    // Return 500 for processing errors so Paystack can retry delivery.
    console.error("PAYSTACK WEBHOOK ERROR:", err);

    return res.sendStatus(500);
  }
}
