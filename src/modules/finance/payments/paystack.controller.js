import {
  verifyPaystackPayment,
  initializePaystackPayment,
  getPaystackBanks,
  resolvePaystackAccount,
  createSchoolPaystackSubaccount,
} from "./paystack.service.js";

import { StudentFee } from "../fees/studentFee.model.js";
import { Student } from "../../students/student.model.js";
import { Parent } from "../../parents/parent.model.js";
import { School } from "../../schools/school.model.js";

/* =========================================
   GET PAYSTACK BANKS
========================================= */
export async function getPaystackBanksHandler(req, res) {
  const banks = await getPaystackBanks();

  return res.json({
    success: true,
    data: banks.map((bank) => ({
      name: bank.name,
      code: bank.code,
      slug: bank.slug,
    })),
  });
}

/* =========================================
   RESOLVE SCHOOL BANK ACCOUNT
   Returns the verified account name.
   Does not save or connect the account.
========================================= */
export async function resolveSchoolPaystackAccountHandler(req, res) {
  const { bankCode, accountNumber } = req.body || {};

  if (!bankCode || !/^\d{10}$/.test(String(accountNumber || ""))) {
    return res.status(400).json({
      success: false,
      message: "Select a bank and enter a valid 10-digit account number",
    });
  }

  const result = await resolvePaystackAccount({
    bankCode: String(bankCode),
    accountNumber: String(accountNumber),
  });

  return res.json({
    success: true,
    data: {
      accountName: result.accountName,
      accountNumberLast4: String(accountNumber).slice(-4),
    },
  });
}

/* =========================================
   CONNECT SCHOOL PAYSTACK ACCOUNT
========================================= */
export async function connectSchoolPaystackHandler(req, res) {
  const schoolId = req.user?.schoolId;
  const { bankCode, accountNumber } = req.body || {};

  if (!schoolId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a school",
    });
  }

  if (!bankCode || !/^\d{10}$/.test(String(accountNumber || ""))) {
    return res.status(400).json({
      success: false,
      message: "Select a bank and enter a valid 10-digit account number",
    });
  }

  const normalizedBankCode = String(bankCode);
  const normalizedAccountNumber = String(accountNumber);

  const school = await School.findById(schoolId);

  if (!school) {
    return res.status(404).json({
      success: false,
      message: "School not found",
    });
  }

  if (school.paymentSettings?.paystack?.subaccountCode) {
    return res.status(409).json({
      success: false,
      message: "This school already has a Paystack account connected",
    });
  }

  // Always resolve again on the server.
  // Never trust an account name sent by the frontend.
  const verifiedAccount = await resolvePaystackAccount({
    bankCode: normalizedBankCode,
    accountNumber: normalizedAccountNumber,
  });

  const subaccount = await createSchoolPaystackSubaccount({
    businessName: school.name,
    bankCode: normalizedBankCode,
    accountNumber: normalizedAccountNumber,
    email: school.email,
    phone: school.phone,
  });

  school.paymentSettings = school.paymentSettings || {};
  school.paymentSettings.paystack =
    school.paymentSettings.paystack || {};

  school.paymentSettings.paystack.subaccountCode =
    subaccount.subaccount_code;

  school.paymentSettings.paystack.subaccountId =
    String(subaccount.id || "");

  school.paymentSettings.paystack.settlementBank =
    subaccount.settlement_bank || normalizedBankCode;

  school.paymentSettings.paystack.accountName =
    verifiedAccount.accountName;

  school.paymentSettings.paystack.accountNumberLast4 =
    normalizedAccountNumber.slice(-4);

  school.paymentSettings.paystack.connected = true;
  school.paymentSettings.paystack.connectedAt = new Date();

  // Enable only after Paystack has created the subaccount.
  school.paymentSettings.enabled = true;
  school.paymentSettings.provider = "paystack";

  await school.save();

  return res.status(201).json({
    success: true,
    message: "School Paystack account connected successfully",
    data: {
      enabled: true,
      connected: true,
      accountName: verifiedAccount.accountName,
      settlementBank:
        subaccount.settlement_bank || normalizedBankCode,
      accountNumberLast4: normalizedAccountNumber.slice(-4),
    },
  });
}

/* =========================================
   PAYMENT CALLBACK URL
========================================= */
function getPaymentCallbackUrl(req, school) {
  const origin = req.get("origin");

  if (!origin) {
    throw new Error("Frontend origin is missing");
  }

  let url;

  try {
    url = new URL(origin);
  } catch {
    throw new Error("Invalid frontend origin");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    url.protocol !== "https:" ||
    !hostname.endsWith(".edutrack.cloud") ||
    hostname === "www.edutrack.cloud"
  ) {
    throw new Error("Untrusted frontend origin");
  }

  const slug = hostname.split(".")[0];
  const expectedDomain = `${slug}.edutrack.cloud`;

  const schoolMatches =
    school.slug === slug ||
    school.domain?.toLowerCase() === expectedDomain;

  if (!schoolMatches) {
    throw new Error("Frontend subdomain does not match this school");
  }

  return `${url.origin}/payment/success?schoolId=${encodeURIComponent(
    String(school._id)
  )}`;
}

/* =========================================
   INITIALIZE PAYSTACK PAYMENT
========================================= */
export async function initializePaystackHandler(req, res) {
  try {
    const { studentFeeId } = req.body || {};

    const userId = req.user?._id || req.user?.id;
    const email = req.user?.email?.trim();

    if (!userId || !email) {
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

    const parent = await Parent.findOne({
      userId,
      schoolId: fee.schoolId,
    });

    if (!parent) {
      return res.status(403).json({
        success: false,
        message: "Parent profile not found for this account",
      });
    }

    const child = await Student.findOne({
      _id: fee.studentId,
      schoolId: fee.schoolId,
      parentIds: parent._id,
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

    const school = await School.findById(fee.schoolId).select(
      "_id slug domain"
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const callbackUrl = getPaymentCallbackUrl(req, school);

    const result = await initializePaystackPayment({
      schoolId: fee.schoolId,
      email,
      amount,
      callbackUrl,
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

console.log("PAYSTACK PARENT LOOKUP:", {
  userId: String(userId),
  feeSchoolId: String(fee.schoolId),
});

console.log("PAYSTACK PARENT FOUND:", parent
  ? {
      parentId: String(parent._id),
      parentUserId: String(parent.userId),
      parentSchoolId: String(parent.schoolId),
    }
  : null
);
/* =========================================
   VERIFY PAYSTACK PAYMENT
========================================= */
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
