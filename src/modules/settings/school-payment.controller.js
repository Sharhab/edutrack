import {
    connectPaystack,
    getPaystackBanks,
    getSchoolPaymentSettings,
    resolvePaystackAccount,
    setSchoolPaymentEnabled,
    updatePaystackAccount,
  } from "./school-payment.service.js";

  import {
    connectPaystackSchema,
    paymentStatusSchema,
    updatePaystackAccountSchema,
  } from "./school-payment.validation.js";
  
  import { ApiError } from "../../utils/apiError.js";
  


  /* =========================================
   RESOLVE BANK ACCOUNT
========================================= */

export async function resolvePaystackAccountHandler(
    req,
    res
  ) {
    const { bankCode, accountNumber } =
      req.body;
  
    const result =
      await resolvePaystackAccount(
        bankCode,
        accountNumber
      );
  
    return res.json({
      success: true,
      data: result,
    });
  }
  
  /* =========================================
   GET PAYSTACK BANKS
========================================= */

export async function getPaystackBanksHandler(
    req,
    res
  ) {
    const banks =
      await getPaystackBanks();
  
    return res.json({
      success: true,
      data: banks,
    });
  }
  /* =========================================
     GET PAYMENT SETTINGS
  ========================================= */
  
  export async function getSchoolPaymentSettingsHandler(
    req,
    res
  ) {
    const settings =
      await getSchoolPaymentSettings(
        req.user.schoolId
      );
  
    return res.json({
      success: true,
      data: settings,
    });
  }
  
  /* =========================================
     CONNECT PAYSTACK
  ========================================= */
  
  export async function connectPaystackHandler(
    req,
    res
  ) {
    const validation =
      connectPaystackSchema.safeParse(
        req.body
      );
  
    if (!validation.success) {
      throw new ApiError(
        400,
        validation.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const result =
      await connectPaystack(
        req.user.schoolId,
        validation.data
      );
  
    return res.status(200).json(result);
  }
  
  /* =========================================
     UPDATE PAYSTACK ACCOUNT
  ========================================= */
  
  export async function updatePaystackAccountHandler(
    req,
    res
  ) {
    const validation =
      updatePaystackAccountSchema.safeParse(
        req.body
      );
  
    if (!validation.success) {
      throw new ApiError(
        400,
        validation.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const result =
      await updatePaystackAccount(
        req.user.schoolId,
        validation.data
      );
  
    return res.json(result);
  }
  
  /* =========================================
     ENABLE / DISABLE PAYMENTS
  ========================================= */
  
  export async function setSchoolPaymentEnabledHandler(
    req,
    res
  ) {
    const validation =
      paymentStatusSchema.safeParse(
        req.body
      );
  
    if (!validation.success) {
      throw new ApiError(
        400,
        validation.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const result =
      await setSchoolPaymentEnabled(
        req.user.schoolId,
        validation.data.enabled
      );
  
    return res.json(result);
  }