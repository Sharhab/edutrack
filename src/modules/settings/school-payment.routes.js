import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
    getPaystackBanksHandler,
    getSchoolPaymentSettingsHandler,
    resolvePaystackAccountHandler,
    connectPaystackHandler,
    updatePaystackAccountHandler,
    setSchoolPaymentEnabledHandler,
  } from "./school-payment.controller.js";


const router = express.Router();

/* =========================================
   SCHOOL ADMIN AUTHORIZATION
========================================= */

router.use(protect);
router.use(authorize("school_admin"));

/* =========================================
   GET PAYMENT SETTINGS
========================================= */

router.get(
  "/",
  asyncHandler(
    getSchoolPaymentSettingsHandler
  )
);

/* =========================================
   CONNECT PAYSTACK
========================================= */

router.post(
  "/connect",
  asyncHandler(
    connectPaystackHandler
  )
);

/* =========================================
   UPDATE PAYSTACK ACCOUNT
========================================= */

router.put(
  "/account",
  asyncHandler(
    updatePaystackAccountHandler
  )
);

/* =========================================
   ENABLE / DISABLE ONLINE PAYMENTS
========================================= */

router.put(
  "/status",
  asyncHandler(
    setSchoolPaymentEnabledHandler
  )
);

/* =========================================
   GET PAYSTACK BANKS
========================================= */

router.get(
    "/banks",
    asyncHandler(
      getPaystackBanksHandler
    )
  );

  /* =========================================
   RESOLVE BANK ACCOUNT
========================================= */

router.post(
    "/resolve-account",
    asyncHandler(
      resolvePaystackAccountHandler
    )
  );

export default router;