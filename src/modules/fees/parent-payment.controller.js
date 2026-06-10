import {
  getParentChildren,
  getParentInvoices,
  initializeParentPayment,
  verifyParentPayment,
} from "./parent-payment.service.js";

/**
 * =====================================
 * GET CHILDREN
 * =====================================
 */
export async function getParentChildrenHandler(
  req,
  res
) {
  const data =
    await getParentChildren(
      req.user._id,
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}

/**
 * =====================================
 * GET INVOICES
 * =====================================
 */
export async function getParentInvoicesHandler(
  req,
  res
) {
  const data =
    await getParentInvoices(
      req.params.studentId,
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}

/**
 * =====================================
 * INIT PAYMENT
 * =====================================
 */
export async function initializeParentPaymentHandler(
  req,
  res
) {
  const data =
    await initializeParentPayment(
      req.body,
      req.user
    );

  res.json({
    success: true,
    data,
  });
}

/**
 * =====================================
 * VERIFY PAYMENT
 * =====================================
 */
export async function verifyParentPaymentHandler(
  req,
  res
) {
  const data =
    await verifyParentPayment(
      req.params.reference,
      req.user
    );

  res.json({
    success: true,
    data,
  });
}