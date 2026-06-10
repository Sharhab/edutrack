import {
  getParentDashboard,
  getMyChildren,
  getChildFinance,
  getChildInvoices,
  getChildResults,
} from "./parent-portal.service.js";

/**
 * =====================================
 * PARENT DASHBOARD
 * =====================================
 */
export async function parentDashboardHandler(
  req,
  res
) {
  const data = await getParentDashboard(
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
 * CHILDREN
 * =====================================
 */
export async function getMyChildrenHandler(
  req,
  res
) {
  const data = await getMyChildren(
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
 * CHILD FINANCE
 * =====================================
 */
export async function getChildFinanceHandler(
  req,
  res
) {
  const data = await getChildFinance(
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
 * CHILD INVOICES
 * =====================================
 */
export async function getChildInvoicesHandler(
  req,
  res
) {
  const data = await getChildInvoices(
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
 * CHILD RESULTS
 * =====================================
 */
export async function getChildResultsHandler(
  req,
  res
) {
  const data = await getChildResults(
    req.params.studentId,
    req.user.schoolId
  );

  res.json({
    success: true,
    data,
  });
}