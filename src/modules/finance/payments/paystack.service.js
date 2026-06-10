import axios from "axios";
import { School } from "../../schools/school.model.js";
import { ApiError } from "../../../utils/apiError.js";

/* =========================================
   PAYSTACK CONFIG
========================================= */
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/* =========================================
   GET SCHOOL SECRET KEY
========================================= */
async function getSchoolPaystackSecret(schoolId) {
  const school = await School.findById(schoolId).select(
    "settings.paystackSecretKey"
  );

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const secret = school?.settings?.paystackSecretKey;

  if (!secret) {
    throw new ApiError(
      400,
      "School Paystack secret key not configured"
    );
  }

  return secret;
}

/* =========================================
   INITIALIZE PAYSTACK PAYMENT (FIXED)
========================================= */
export async function initializePaystackPayment({
  schoolId,
  email,
  amount,
  callbackUrl,
  metadata = {},
}) {
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    throw new ApiError(400, "Valid amount required");
  }

  const secretKey = await getSchoolPaystackSecret(schoolId);

  // =========================================
  // STRICT METADATA ENFORCEMENT
  // =========================================
  const safeMetadata = {
    schoolId: String(metadata.schoolId || schoolId),
    studentId: String(metadata.studentId || ""),
    studentFeeId: String(metadata.studentFeeId || ""),

    session: metadata.session || "unknown",
    term: metadata.term || "unknown",

    source: "student-fee-payment",
  };

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,

        amount: Math.round(numericAmount * 100),

        currency: "NGN",

        callback_url: callbackUrl,

        metadata: safeMetadata,
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data?.data;

    return {
      authorizationUrl: data?.authorization_url,
      accessCode: data?.access_code,
      reference: data?.reference,

      // 🔥 IMPORTANT: expose metadata for frontend tracking
      metadata: safeMetadata,
    };
  } catch (error) {
    console.log(
      "❌ PAYSTACK INIT ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(500, "Failed to initialize payment");
  }
}

/* =========================================
   VERIFY PAYSTACK PAYMENT (FIXED)
========================================= */
export async function verifyPaystackPayment(reference, schoolId) {
  if (!reference) {
    throw new ApiError(400, "Payment reference required");
  }

  const secretKey = await getSchoolPaystackSecret(schoolId);

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const payment = response.data?.data;

    if (!payment) {
      throw new ApiError(400, "Invalid Paystack response");
    }

    // =========================================
    // NORMALIZED RESPONSE (IMPORTANT FOR WEBHOOK)
    // =========================================
    return {
      status: payment.status,
      reference: payment.reference,

      amount: Math.round(Number(payment.amount || 0) / 100),

      paidAt: payment.paid_at,
      channel: payment.channel,
      currency: payment.currency,

      metadata: {
        schoolId: payment.metadata?.schoolId,
        studentId: payment.metadata?.studentId,
        studentFeeId: payment.metadata?.studentFeeId,
        session: payment.metadata?.session,
        term: payment.metadata?.term,
      },

      gatewayResponse: payment.gateway_response,
      customer: payment.customer || {},
    };
  } catch (error) {
    console.log(
      "❌ PAYSTACK VERIFY ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(500, "Failed to verify payment");
  }
}