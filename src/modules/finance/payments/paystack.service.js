import axios from "axios";
import { School } from "../../schools/school.model.js";
import { ApiError } from "../../../utils/apiError.js";

/* =========================================
   PAYSTACK CONFIG
========================================= */
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/* =========================================
   GET EDUTrack PAYSTACK SECRET KEY
========================================= */
export function getPaystackSecret() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new ApiError(
      500,
      "EduTrack Paystack secret key is not configured"
    );
  }

  return secretKey;
}

/* =========================================
   PAYSTACK BANK LIST
========================================= */
export async function getPaystackBanks() {
  const secretKey = getPaystackSecret();

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank`,
      {
        params: { country: "nigeria", currency: "NGN" },
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "PAYSTACK BANK LIST ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(502, "Could not load banks from Paystack");
  }
}

/* =========================================
   RESOLVE NIGERIAN BANK ACCOUNT
========================================= */
export async function resolvePaystackAccount({
  bankCode,
  accountNumber,
}) {
  const secretKey = getPaystackSecret();

  if (!bankCode || !/^\d{10}$/.test(String(accountNumber || ""))) {
    throw new ApiError(400, "Select a bank and enter a valid 10-digit account number");
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve`,
      {
        params: {
          account_number: String(accountNumber),
          bank_code: String(bankCode),
        },
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = response.data?.data;

    if (!response.data?.status || !data?.account_name) {
      throw new ApiError(400, "Could not verify this bank account");
    }

    return {
      accountName: data.account_name,
      accountNumber: data.account_number,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    console.error(
      "PAYSTACK ACCOUNT RESOLUTION ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(
      error.response?.status === 400 ? 400 : 502,
      error.response?.data?.message ||
        "Could not verify this bank account"
    );
  }
}

/* =========================================
   CREATE SCHOOL SUBACCOUNT
========================================= */
export async function createSchoolPaystackSubaccount({
  businessName,
  bankCode,
  accountNumber,
  email,
  phone,
}) {
  const secretKey = getPaystackSecret();

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/subaccount`,
      {
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: 0,
        primary_contact_email: email,
        primary_contact_phone: phone || undefined,
        description: `School fee settlement for ${businessName}`,
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data?.data;

    if (!response.data?.status || !data?.subaccount_code) {
      throw new ApiError(502, "Paystack did not return a subaccount code");
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    console.error(
      "PAYSTACK SUBACCOUNT ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(
      error.response?.status === 400 ? 400 : 502,
      error.response?.data?.message ||
        "Could not connect this school to Paystack"
    );
  }
}
/* =========================================
   GET SCHOOL PAYSTACK SUBACCOUNT
========================================= */
async function getSchoolPaystackSubaccount(schoolId) {
  const school = await School.findById(schoolId).select(
    "paymentSettings"
  );

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const paymentSettings = school.paymentSettings;

  if (!paymentSettings?.enabled) {
    throw new ApiError(
      400,
      "Online payments are not enabled for this school"
    );
  }

  const subaccountCode =
    paymentSettings?.paystack?.subaccountCode;

  if (!subaccountCode) {
    throw new ApiError(
      400,
      "School Paystack account is not connected"
    );
  }

  return subaccountCode;
}

/* =========================================
   INITIALIZE PAYSTACK PAYMENT
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

  const secretKey = getPaystackSecret();

  const subaccountCode =
    await getSchoolPaystackSubaccount(schoolId);

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

        // =====================================
        // SCHOOL'S PAYSTACK SUBACCOUNT
        // =====================================
        subaccount: subaccountCode,

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

      metadata: safeMetadata,
    };
  } catch (error) {
    console.log(
      "❌ PAYSTACK INIT ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(
      500,
      "Failed to initialize payment"
    );
  }
}

/* =========================================
   VERIFY PAYSTACK PAYMENT
========================================= */
export async function verifyPaystackPayment(
  reference,
  schoolId
) {
  if (!reference) {
    throw new ApiError(
      400,
      "Payment reference required"
    );
  }

  if (!schoolId) {
    throw new ApiError(
      400,
      "School ID required"
    );
  }

  const secretKey = getPaystackSecret();

  // Make sure the school exists and is connected.
  await getSchoolPaystackSubaccount(schoolId);

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
      throw new ApiError(
        400,
        "Invalid Paystack response"
      );
    }

    return {
      status: payment.status,
      reference: payment.reference,

      amount: Math.round(
        Number(payment.amount || 0) / 100
      ),

      paidAt: payment.paid_at,
      channel: payment.channel,
      currency: payment.currency,

      metadata: {
        schoolId:
          payment.metadata?.schoolId,

        studentId:
          payment.metadata?.studentId,

        studentFeeId:
          payment.metadata?.studentFeeId,

        session:
          payment.metadata?.session,

        term:
          payment.metadata?.term,
      },

      gatewayResponse:
        payment.gateway_response,

      customer:
        payment.customer || {},
    };
  } catch (error) {
    console.log(
      "❌ PAYSTACK VERIFY ERROR:",
      error.response?.data || error.message
    );

    throw new ApiError(
      500,
      "Failed to verify payment"
    );
  }
}
