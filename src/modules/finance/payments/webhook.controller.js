import { processFeePayment } from "../service/processFeePayment.service.js";

export async function paystackWebhookHandler(
  req,
  res
) {
  const event = req.body;

  try {
    if (
      event.event === "charge.success"
    ) {
      const data = event.data;

      const metadata =
        data.metadata || {};

      // =====================================
      // IMPORTANT VALIDATION
      // =====================================

      if (!metadata.schoolId) {
        throw new Error(
          "schoolId missing in metadata"
        );
      }

      if (!metadata.studentId) {
        throw new Error(
          "studentId missing in metadata"
        );
      }

      if (!metadata.studentFeeId) {
        throw new Error(
          "studentFeeId missing in metadata"
        );
      }

      // =====================================
      // PROCESS PAYMENT
      // =====================================

      await processFeePayment({
        schoolId:
          metadata.schoolId,

        studentId:
          metadata.studentId,

        studentFeeId:
          metadata.studentFeeId,

        amountPaid:
          Number(data.amount || 0) /
          100,

        method: "paystack",

        reference: data.reference,

        session:
          metadata.session || "",

        term:
          metadata.term || "",

        metadata,
      });
    }

    return res.sendStatus(200);

  } catch (err) {
    console.error(
      "PAYSTACK ERROR:",
      err
    );

    return res.sendStatus(500);
  }
}