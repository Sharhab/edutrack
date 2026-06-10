// import express from "express";
// import { protect } from "../../middlewares/auth.middleware.js";
// import { asyncHandler } from "../../utils/asyncHandler.js";
// import {
//   createInvoiceHandler,
//   listInvoicesHandler,
//   getStudentInvoicesHandler,
// } from "./invoice.controller.js";

// import {
//   getStudentLedgerHandler,
// } from "./ledger.controller.js";

// import {
//   createReceiptHandler,
//   getReceiptHandler,
// } from "./receipt.controller.js";
// import {
//   createFeeStructureHandler,
//   listStudentFeesHandler,
//   payStudentFeeHandler,
// } from "./fee.controller.js";

// import {
//   getDefaultersHandler,
// } from "./defaulters.controller.js";

// import {
//   getFinancialSummaryHandler,
// } from "./financial-report.controller.js";
// const router = express.Router();

// router.use(protect);

// /**
//  * CREATE STRUCTURE
//  */
// router.post(
//   "/structures",
//   asyncHandler(
//     createFeeStructureHandler
//   )
// );

// /**
//  * LIST STUDENT FEES
//  */
// router.get(
//   "/students",
//   asyncHandler(
//     listStudentFeesHandler
//   )
// );

// /**
//  * =========================================
//  * INVOICES
//  * =========================================
//  */
// router.post(
//   "/invoices",
//   asyncHandler(
//     createInvoiceHandler
//   )
// );

// router.get(
//   "/invoices",
//   asyncHandler(
//     listInvoicesHandler
//   )
// );

// router.get(
//   "/student/:studentId/invoices",
//   asyncHandler(
//     getStudentInvoicesHandler
//   )
// );

// /**
//  * =========================================
//  * LEDGER
//  * =========================================
//  */
// router.get(
//   "/student/:studentId/ledger",
//   asyncHandler(
//     getStudentLedgerHandler
//   )
// );

// /**
//  * =========================================
//  * FINANCIAL REPORTS
//  * =========================================
//  */
// router.get(
//   "/reports/summary",
//   asyncHandler(
//     getFinancialSummaryHandler
//   )
// );

// /**
//  * =========================================
//  * DEFAULTERS
//  * =========================================
//  */
// router.get(
//   "/defaulters",
//   asyncHandler(
//     getDefaultersHandler
//   )
// );
// /**
//  * =========================================
//  * RECEIPTS
//  * =========================================
//  */
// router.post(
//   "/receipts",
//   asyncHandler(
//     createReceiptHandler
//   )
// );

// router.get(
//   "/receipts/:id",
//   asyncHandler(
//     getReceiptHandler
//   )
// );
// /**
//  * PAY
//  */
// router.post(
//   "/students/:id/pay",
//   asyncHandler(
//     payStudentFeeHandler
//   )
// );

// export default router;