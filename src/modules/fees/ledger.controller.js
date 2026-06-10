import {
  getStudentLedger,
} from "./ledger.service.js";

export async function getStudentLedgerHandler(
  req,
  res
) {
  const data =
    await getStudentLedger(
      req.params.studentId,
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}