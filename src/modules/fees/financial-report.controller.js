import {
  getFinancialSummary,
} from "./financial-report.service.js";

export async function getFinancialSummaryHandler(
  req,
  res
) {
  const data =
    await getFinancialSummary(
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}