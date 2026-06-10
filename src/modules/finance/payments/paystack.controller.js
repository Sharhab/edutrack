import { verifyPaystackPayment, initializePaystackPayment } from "./paystack.service.js";

export async function initializePaystackHandler(req, res) {
  try {
    const { studentFeeId } = req.body;

    if (!studentFeeId) {
      return res.status(400).json({
        success: false,
        message: "studentFeeId is required",
      });
    }

    const fee = await StudentFee.findById(studentFeeId);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Student fee not found",
      });
    }

    const amount = Number(fee.balance || 0);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No outstanding balance",
      });
    }

    const result = await initializePaystackPayment({
      schoolId: fee.schoolId,
      email: req.user.email,
      amount,
      callbackUrl: `${process.env.FRONTEND_URL}/payment/success`,
      metadata: {
        schoolId: fee.schoolId,
        studentId: fee.studentId,
        studentFeeId: fee._id,
        session: fee.session,
        term: fee.term,
      },
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Payment init failed",
    });
  }
}

/**
 * ✅ THIS WAS MISSING (CAUSE OF YOUR ERROR)
 */
export async function verifyPaystackHandler(req, res) {
  try {
    const { reference } = req.params;
    const { schoolId } = req.query;

    const result = await verifyPaystackPayment(reference, schoolId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
}