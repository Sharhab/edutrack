
import {
  verifyPaystackPayment,
  initializePaystackPayment,
} from "./paystack.service.js";
import { StudentFee } from "../fees/studentFee.model.js";
import { Student } from "../../students/student.model.js";

export async function initializePaystackHandler(req, res) {
  try {
    const { studentFeeId } = req.body;
    const parentId = req.user?._id;

    if (!parentId || !req.user?.email) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

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

    const child = await Student.findOne({
      _id: fee.studentId,
      schoolId: fee.schoolId,
      parentId,
    });

    if (!child) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay this student's fee",
      });
    }

    const amount = Number(fee.balance || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No outstanding balance",
      });
    }

    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

    if (!frontendUrl) {
      return res.status(500).json({
        success: false,
        message: "FRONTEND_URL is not configured",
      });
    }

    const result = await initializePaystackPayment({
      schoolId: fee.schoolId,
      email: req.user.email,
      amount,
      callbackUrl: `${frontendUrl}/payment/success?schoolId=${encodeURIComponent(
        String(fee.schoolId)
      )}`,
      metadata: {
        source: "student_fee",
        schoolId: String(fee.schoolId),
        studentId: String(fee.studentId),
        studentFeeId: String(fee._id),
        session: fee.session,
        term: fee.term,
      },
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("PAYSTACK INITIALIZATION ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Payment initialization failed",
    });
  }
}

export async function verifyPaystackHandler(req, res) {
  try {
    const { reference } = req.params;
    const { schoolId } = req.query;

    if (!reference || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Payment reference and schoolId are required",
      });
    }

    const result = await verifyPaystackPayment(reference, schoolId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("PAYSTACK VERIFICATION ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Payment verification failed",
    });
  }
}
