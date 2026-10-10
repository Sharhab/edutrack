import {
  verifyPaystackPayment,
  initializePaystackPayment,
  getPaystackBanks,
  resolvePaystackAccount,
  createSchoolPaystackSubaccount,
  refreshSchoolPaystackSubaccountStatus,
} from "./paystack.service.js";
import { processFeePayment } from "../service/processFeePayment.service.js";
import { StudentFee } from "../fees/studentFee.model.js";
import { Student } from "../../students/student.model.js";
import { Parent } from "../../parents/parent.model.js";
import { School } from "../../schools/school.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { randomUUID } from "node:crypto";
import { PaymentIntent } from "../models/paymentIntent.model.js";
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

  // Save verification status only when Paystack returns it.
  school.paymentSettings.paystack.isVerified =
    typeof subaccount.is_verified === "boolean"
      ? subaccount.is_verified
      : false;

  school.paymentSettings.paystack.verificationCheckedAt =
    typeof subaccount.is_verified === "boolean"
      ? new Date()
      : null;

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
      isVerified:
        typeof subaccount.is_verified === "boolean"
          ? subaccount.is_verified
          : false,
      verificationCheckedAt:
        typeof subaccount.is_verified === "boolean"
          ? school.paymentSettings.paystack.verificationCheckedAt
          : null,
    },
  });
}

/* =========================================
   REFRESH SCHOOL PAYSTACK VERIFICATION
========================================= */
export async function refreshSchoolPaystackStatusHandler(req, res) {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a school",
      });
    }

    const status =
      await refreshSchoolPaystackSubaccountStatus(schoolId);

    return res.json({
      success: true,
      message: "Paystack account status refreshed",
      data: status,
    });
  } catch (err) {
    console.error("PAYSTACK STATUS REFRESH ERROR:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message:
        err.message || "Could not refresh Paystack account status",
    });
  }
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
  let paymentIntent = null;

  try {
    const { studentFeeId, amount: requestedAmount } = req.body || {};
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

    // Confirm this account belongs to a parent at the same school.
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

    // Confirm the parent is linked to this student.
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

    // Calculate the outstanding balance in naira.
    const total = Number(fee.totalAmount);
    const amountAlreadyPaid = Number(fee.amountPaid || 0);

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(amountAlreadyPaid) ||
      total < 0 ||
      amountAlreadyPaid < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Student fee amounts are invalid",
      });
    }

    const balance =
      Math.round((total - amountAlreadyPaid) * 100) / 100;

    if (balance <= 0) {
      return res.status(400).json({
        success: false,
        message: "No outstanding balance",
      });
    }

    // Load the fee payment policy belonging to this school.
    const feePlan = await FeeStructure.findOne({
      _id: fee.feePlanId,
      schoolId: fee.schoolId,
    }).select("paymentPolicy");

    const policy = feePlan?.paymentPolicy || {};
    const mode = policy.mode || "full_only";

    let amount;

    if (mode === "full_only") {
      amount = balance;

      if (
        requestedAmount !== undefined &&
        requestedAmount !== null &&
        requestedAmount !== "" &&
        (
          !Number.isFinite(Number(requestedAmount)) ||
          Math.abs(Number(requestedAmount) - balance) > 0.01
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "This fee requires full payment",
          data: { balance },
        });
      }
    } else if (mode === "flexible_partial") {
      amount =
        requestedAmount === undefined ||
        requestedAmount === null ||
        requestedAmount === ""
          ? balance
          : Number(requestedAmount);

      const minimum = Number(policy.minimumPaymentAmount || 0);

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > balance + 0.001
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid amount not exceeding the balance",
          data: { balance },
        });
      }

      // Allow a smaller final payment when it clears the balance.
      if (
        minimum > 0 &&
        amount < minimum - 0.001 &&
        amount < balance - 0.001
      ) {
        return res.status(400).json({
          success: false,
          message: `The minimum payment is ${minimum}`,
          data: {
            minimumPaymentAmount: minimum,
            balance,
          },
        });
      }
    } else if (mode === "fixed_installment") {
      const installment = Number(policy.installmentAmount);

      if (!Number.isFinite(installment) || installment <= 0) {
        return res.status(400).json({
          success: false,
          message: "The school's installment policy is not configured correctly",
        });
      }

      const requiredAmount = Math.min(installment, balance);

      amount =
        requestedAmount === undefined ||
        requestedAmount === null ||
        requestedAmount === ""
          ? requiredAmount
          : Number(requestedAmount);

      if (
        !Number.isFinite(amount) ||
        Math.abs(amount - requiredAmount) > 0.01
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment must match the required installment amount",
          data: {
            requiredAmount,
            balance,
          },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported fee payment policy",
      });
    }

    // Normalize to two decimal places.
    amount = Math.round(amount * 100) / 100;

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > balance + 0.001
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
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

    // Generate the reference before contacting Paystack.
    const reference =
      `EDU-${randomUUID().replace(/-/g, "").toUpperCase()}`;

    // Persist the expected payment first.
    paymentIntent = await PaymentIntent.create({
      schoolId: fee.schoolId,
      studentId: fee.studentId,
      studentFeeId: fee._id,
      feePlanId: fee.feePlanId || null,
      reference,
      expectedAmount: amount,
      currency: "NGN",
      sessionId: fee.sessionId || null,
      termId: fee.termId || null,
      status: "initializing",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      metadata: {
        session: fee.session || "",
        term: fee.term || "",
      },
    });

    // The Paystack service now requires this exact reference
    // and the saved payment intent ID.
    const result = await initializePaystackPayment({
      schoolId: fee.schoolId,
      email,
      amount,
      callbackUrl,
      reference,
      metadata: {
        schoolId: String(fee.schoolId),
        studentId: String(fee.studentId),
        studentFeeId: String(fee._id),
        paymentIntentId: String(paymentIntent._id),
        session: fee.session || "",
        term: fee.term || "",
      },
    });

    paymentIntent.status = "pending";
    await paymentIntent.save();

    return res.json({
      success: true,
      data: {
        ...result,
        amount,
        balance,
      },
    });
  } catch (err) {
    console.error("PAYSTACK INITIALIZATION ERROR:", err);

    // Keep an unresolved intent in "initializing".
    // A timeout alone cannot prove Paystack rejected the request.
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Payment initialization failed",
    });
  }
}



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

    // Ask Paystack to verify the transaction.
    const result = await verifyPaystackPayment(reference, schoolId);

    // Do not record a transaction unless Paystack confirms success.
    if (
      result.status !== "success" ||
      result.currency !== "NGN" ||
      String(result.reference) !== String(reference)
    ) {
      return res.status(400).json({
        success: false,
        message: "Paystack has not confirmed this payment as successful",
        data: result,
      });
    }

    const metadata = result.metadata || {};

    // Confirm the verified transaction contains the required fee identifiers.
    if (
      String(metadata.schoolId) !== String(schoolId) ||
      !metadata.studentId ||
      !metadata.studentFeeId
    ) {
      return res.status(400).json({
        success: false,
        message: "Verified payment is missing valid student fee information",
      });
    }

    // Save the payment using the same processor as the webhook.
    // This also prevents the webhook and browser callback from recording it twice.
    const feePayment = await processFeePayment({
      schoolId,
      studentId: metadata.studentId,
      studentFeeId: metadata.studentFeeId,
      amountPaid: result.amount,
      method: "paystack",
      reference: result.reference,
      metadata,
    });

    return res.json({
      success: true,
      message: feePayment.alreadyProcessed
        ? "Payment was already recorded"
        : "Payment verified and recorded successfully",
      data: {
        ...result,
        feePayment: {
          alreadyProcessed: feePayment.alreadyProcessed,
          paymentId: feePayment.payment?._id,
          receiptNumber: feePayment.receipt?.receiptNumber,
        },
      },
    });
  } catch (err) {
    console.error("PAYSTACK VERIFICATION ERROR:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Payment verification failed",
    });
  }
}
