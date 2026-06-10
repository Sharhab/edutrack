import express from "express";

import { authorize } from "../../../middlewares/role.middleware.js";
import { tenantScope } from "../../../middlewares/tenantScope.middleware.js";
import { protect } from "../../../middlewares/auth.middleware.js";

import {
  getReceiptByPaymentHandler,
  downloadReceiptHandler,
} from "./receipt.controller.js";

const router = express.Router();

/* =========================================
   AUTH
========================================= */
router.use(protect);

router.use(
  authorize(
    "school_admin",
    "parent",
    "super_admin"
  )
);

router.use(tenantScope);

/* =========================================
   GET RECEIPT BY PAYMENT
========================================= */
router.get(
  "/payment/:paymentId",
  getReceiptByPaymentHandler
);

/* =========================================
   DOWNLOAD RECEIPT PDF
========================================= */
router.get(
  "/download/:paymentId",
  downloadReceiptHandler
);

/* =========================================
   EXPORT
========================================= */
export const receiptRoutes = router;

export default router;