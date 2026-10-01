import axios from "axios";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================
   PAYSTACK CONFIG
========================================= */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

/* =========================================
   PAYSTACK SECRET KEY
========================================= */

function getPaystackSecret() {
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
   PAYSTACK HEADERS
========================================= */

function getPaystackHeaders() {
  return {
    Authorization: `Bearer ${getPaystackSecret()}`,
    "Content-Type": "application/json",
  };
}

/* =========================================
   GET SCHOOL
========================================= */

async function getSchool(schoolId) {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(
      404,
      "School not found"
    );
  }

  return school;
}

/* =========================================
   GET PAYMENT SETTINGS
========================================= */

export async function getSchoolPaymentSettings(
  schoolId
) {
  const school = await getSchool(schoolId);

  const paymentSettings =
    school.paymentSettings || {};

  const paystack =
    paymentSettings.paystack || {};

  return {
    enabled:
      paymentSettings.enabled || false,

    provider:
      paymentSettings.provider || "paystack",

    paystack: {
      connected:
        paystack.connected || false,

      subaccountCode:
        paystack.subaccountCode || "",

      subaccountId:
        paystack.subaccountId || "",

      settlementBank:
        paystack.settlementBank || "",

      accountNumberLast4:
        paystack.accountNumberLast4 || "",

      connectedAt:
        paystack.connectedAt || null,
    },
  };
}

/* =========================================
   CONNECT PAYSTACK
========================================= */
/* =========================================
   CONNECT PAYSTACK
========================================= */

export async function connectPaystack(
    schoolId,
    {
      bankCode,
      accountNumber,
      percentageCharge = 0,
    }
  ) {
    const school = await getSchool(schoolId);
  
    if (!bankCode) {
      throw new ApiError(
        400,
        "Bank code is required"
      );
    }
  
    if (!accountNumber) {
      throw new ApiError(
        400,
        "Bank account number is required"
      );
    }
  
    if (
      !/^\d{10}$/.test(
        String(accountNumber)
      )
    ) {
      throw new ApiError(
        400,
        "Bank account number must be 10 digits"
      );
    }
  
    const charge = Number(
      percentageCharge
    );
  
    if (
      Number.isNaN(charge) ||
      charge < 0 ||
      charge > 100
    ) {
      throw new ApiError(
        400,
        "Percentage charge must be between 0 and 100"
      );
    }
  
    /*
     * Prevent creating another subaccount
     * for a school that is already connected.
     */
    if (
      school.paymentSettings?.paystack
        ?.subaccountCode
    ) {
      throw new ApiError(
        400,
        "This school already has a connected Paystack account"
      );
    }
  
    /* =========================================
       VERIFY BANK ACCOUNT FIRST
    ========================================= */
  
    const resolvedAccount =
      await resolvePaystackAccount(
        bankCode,
        accountNumber
      );
  
    if (
      !resolvedAccount?.accountName
    ) {
      throw new ApiError(
        400,
        "Unable to verify bank account"
      );
    }
  
    /* =========================================
       CREATE PAYSTACK SUBACCOUNT
    ========================================= */
  
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/subaccount`,
        {
          business_name:
            school.name,
  
          settlement_bank:
            String(bankCode),
  
          account_number:
            String(accountNumber),
  
          percentage_charge:
            charge,
  
          primary_contact_email:
            school.email || "",
  
          primary_contact_name:
            school.principalName ||
            school.name,
  
          primary_contact_phone:
            school.phone || "",
  
          description:
            `EduTrack school fee collection - ${school.name}`,
  
          metadata: JSON.stringify({
            schoolId: String(
              school._id
            ),
            source:
              "edutrack-school-payment",
          }),
        },
        {
          headers:
            getPaystackHeaders(),
        }
      );
  
      const data =
        response.data?.data;
  
      if (
        !data?.subaccount_code
      ) {
        throw new ApiError(
          500,
          "Paystack did not return a subaccount code"
        );
      }
  
      /* =========================================
         SAVE SCHOOL PAYMENT SETTINGS
      ========================================= */
  
      school.paymentSettings = {
        enabled: true,
  
        provider: "paystack",
  
        paystack: {
          subaccountCode:
            data.subaccount_code,
  
          subaccountId:
            String(data.id || ""),
  
          settlementBank:
            data.settlement_bank ||
            String(bankCode),
  
          accountNumberLast4:
            String(
              accountNumber
            ).slice(-4),
  
          connected: true,
  
          connectedAt:
            new Date(),
        },
      };
  
      await school.save();
  
      return {
        success: true,
  
        message:
          "Paystack account connected successfully",
  
        account: {
          accountName:
            resolvedAccount.accountName,
  
          accountNumberLast4:
            String(
              accountNumber
            ).slice(-4),
        },
  
        paymentSettings:
          await getSchoolPaymentSettings(
            schoolId
          ),
      };
    } catch (error) {
      console.error(
        "❌ PAYSTACK SUBACCOUNT CREATION ERROR:",
        error.response?.data ||
          error.message
      );
  
      if (
        error instanceof ApiError
      ) {
        throw error;
      }
  
      throw new ApiError(
        500,
        error.response?.data
          ?.message ||
          "Failed to connect Paystack account"
      );
    }
  }
/* =========================================
   UPDATE PAYSTACK SUBACCOUNT
========================================= */

export async function updatePaystackAccount(
  schoolId,
  {
    bankCode,
    accountNumber,
    percentageCharge,
  }
) {
  const school =
    await getSchool(schoolId);

  const paystack =
    school.paymentSettings?.paystack;

  if (!paystack?.subaccountCode) {
    throw new ApiError(
      400,
      "School Paystack account is not connected"
    );
  }

  const payload = {};

  if (bankCode !== undefined) {
    payload.settlement_bank =
      String(bankCode);
  }

  if (accountNumber !== undefined) {
    if (
      !/^\d{10}$/.test(
        String(accountNumber)
      )
    ) {
      throw new ApiError(
        400,
        "Bank account number must be 10 digits"
      );
    }

    payload.account_number =
      String(accountNumber);
  }

  if (
    percentageCharge !== undefined
  ) {
    const charge = Number(
      percentageCharge
    );

    if (
      Number.isNaN(charge) ||
      charge < 0 ||
      charge > 100
    ) {
      throw new ApiError(
        400,
        "Percentage charge must be between 0 and 100"
      );
    }

    payload.percentage_charge =
      charge;
  }

  if (!Object.keys(payload).length) {
    throw new ApiError(
      400,
      "No payment settings provided"
    );
  }

  try {
    const response =
      await axios.put(
        `${PAYSTACK_BASE_URL}/subaccount/${paystack.subaccountCode}`,
        payload,
        {
          headers:
            getPaystackHeaders(),
        }
      );

    const data =
      response.data?.data;

    if (!data) {
      throw new ApiError(
        500,
        "Invalid Paystack response"
      );
    }

    school.paymentSettings.paystack =
      {
        ...school.paymentSettings
          .paystack,

        settlementBank:
          data.settlement_bank ||
          paystack.settlementBank,

        accountNumberLast4:
          accountNumber !== undefined
            ? String(
                accountNumber
              ).slice(-4)
            : paystack.accountNumberLast4,
      };

    await school.save();

    return {
      success: true,

      message:
        "Paystack account updated successfully",

      paymentSettings:
        await getSchoolPaymentSettings(
          schoolId
        ),
    };
  } catch (error) {
    console.error(
      "❌ PAYSTACK SUBACCOUNT UPDATE ERROR:",
      error.response?.data ||
        error.message
    );

    if (
      error instanceof ApiError
    ) {
      throw error;
    }

    throw new ApiError(
      500,
      error.response?.data
        ?.message ||
        "Failed to update Paystack account"
    );
  }
}

/* =========================================
   ENABLE / DISABLE PAYMENTS
========================================= */

export async function setSchoolPaymentEnabled(
  schoolId,
  enabled
) {
  const school =
    await getSchool(schoolId);

  const paystack =
    school.paymentSettings?.paystack;

  if (!paystack?.subaccountCode) {
    throw new ApiError(
      400,
      "School Paystack account is not connected"
    );
  }

  try {
    await axios.put(
      `${PAYSTACK_BASE_URL}/subaccount/${paystack.subaccountCode}`,
      {
        active: Boolean(enabled),
      },
      {
        headers:
          getPaystackHeaders(),
      }
    );

    school.paymentSettings.enabled =
      Boolean(enabled);

    school.paymentSettings.paystack.connected =
      Boolean(enabled);

    await school.save();

    return {
      success: true,

      message: enabled
        ? "Online payments enabled"
        : "Online payments disabled",

      paymentSettings:
        await getSchoolPaymentSettings(
          schoolId
        ),
    };
  } catch (error) {
    console.error(
      "❌ PAYSTACK STATUS UPDATE ERROR:",
      error.response?.data ||
        error.message
    );

    throw new ApiError(
      500,
      error.response?.data
        ?.message ||
        "Failed to update payment status"
    );
  }
}

/* =========================================
   GET PAYSTACK BANKS
========================================= */

export async function getPaystackBanks() {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank`,
        {
          params: {
            country: "nigeria",
            currency: "NGN",
            perPage: 100,
          },
          headers: getPaystackHeaders(),
        }
      );
  
      const banks = response.data?.data || [];
  
      return banks.map((bank) => ({
        id: bank.id,
        name: bank.name,
        code: bank.code,
        slug: bank.slug,
      }));
    } catch (error) {
      console.error(
        "❌ PAYSTACK BANK LIST ERROR:",
        error.response?.data || error.message
      );
  
      throw new ApiError(
        500,
        "Failed to load Paystack banks"
      );
    }
  }

  /* =========================================
   RESOLVE BANK ACCOUNT
========================================= */

export async function resolvePaystackAccount(
    bankCode,
    accountNumber
  ) {
    if (!bankCode) {
      throw new ApiError(
        400,
        "Bank code is required"
      );
    }
  
    if (!/^\d{10}$/.test(String(accountNumber))) {
      throw new ApiError(
        400,
        "Bank account number must be 10 digits"
      );
    }
  
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank/resolve`,
        {
          params: {
            account_number: String(accountNumber),
            bank_code: String(bankCode),
          },
          headers: getPaystackHeaders(),
        }
      );
  
      const data = response.data?.data;
  
      if (!data?.account_name) {
        throw new ApiError(
          400,
          "Could not resolve bank account"
        );
      }
  
      return {
        accountNumber:
          data.account_number,
  
        accountName:
          data.account_name,
  
        bankId:
          data.bank_id || null,
      };
    } catch (error) {
      console.error(
        "❌ PAYSTACK ACCOUNT RESOLVE ERROR:",
        error.response?.data ||
          error.message
      );
  
      if (
        error instanceof ApiError
      ) {
        throw error;
      }
  
      throw new ApiError(
        400,
        error.response?.data?.message ||
          "Could not verify bank account. Check the bank and account number."
      );
    }
  }