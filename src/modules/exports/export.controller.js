import {
  exportAttendance,
  exportInvoices,
  exportResults,
  exportStudents,
} from "./export.service.js";

function sendCsv(res, filename, content) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(content);
}

export async function exportStudentsHandler(req, res) {
  const csv = await exportStudents(req.user);
  return sendCsv(res, "students.csv", csv);
}

export async function exportResultsHandler(req, res) {
  const csv = await exportResults(req.user);
  return sendCsv(res, "results.csv", csv);
}

export async function exportAttendanceHandler(req, res) {
  const csv = await exportAttendance(req.user);
  return sendCsv(res, "attendance.csv", csv);
}

export async function exportInvoicesHandler(req, res) {
  const csv = await exportInvoices(req.user);
  return sendCsv(res, "invoices.csv", csv);
}