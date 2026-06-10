import { Student } from "../students/student.model.js";
import { Result } from "../results/result.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Invoice } from "../finance/models/invoice.model.js";

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(headers, rows) {
  const headerLine = headers.map(csvEscape).join(",");
  const lines = rows.map((row) => row.map(csvEscape).join(","));
  return [headerLine, ...lines].join("\n");
}

export async function exportStudents(user) {
  const docs = await Student.find(
    user.role === "super_admin" ? {} : { schoolId: user.schoolId }
  ).populate("classId", "name level");

  const csv = toCsv(
    ["ID", "Admission Number", "First Name", "Last Name", "Gender", "Status", "Class", "Level"],
    docs.map((d) => [
      d._id,
      d.admissionNumber,
      d.firstName,
      d.lastName,
      d.gender,
      d.status,
      d.classId?.name || "",
      d.classId?.level || "",
    ])
  );

  return csv;
}

export async function exportResults(user) {
  const docs = await Result.find(
    user.role === "super_admin" ? {} : { schoolId: user.schoolId }
  )
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("subjectId", "name code")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name");

  const csv = toCsv(
    ["ID", "Student", "Admission Number", "Subject", "Code", "Class", "Session", "Term", "CA1", "CA2", "Assignment", "Exam", "Total", "Grade", "Remark"],
    docs.map((d) => [
      d._id,
      `${d.studentId?.firstName || ""} ${d.studentId?.lastName || ""}`.trim(),
      d.studentId?.admissionNumber || "",
      d.subjectId?.name || "",
      d.subjectId?.code || "",
      d.classId?.name || "",
      d.sessionId?.name || "",
      d.termId?.name || "",
      d.ca1,
      d.ca2,
      d.assignment,
      d.exam,
      d.total,
      d.grade,
      d.remark,
    ])
  );

  return csv;
}

export async function exportAttendance(user) {
  const docs = await Attendance.find(
    user.role === "super_admin" ? {} : { schoolId: user.schoolId }
  )
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name");

  const csv = toCsv(
    ["ID", "Student", "Admission Number", "Class", "Session", "Term", "Date", "Status"],
    docs.map((d) => [
      d._id,
      `${d.studentId?.firstName || ""} ${d.studentId?.lastName || ""}`.trim(),
      d.studentId?.admissionNumber || "",
      d.classId?.name || "",
      d.sessionId?.name || "",
      d.termId?.name || "",
      d.date,
      d.status,
    ])
  );

  return csv;
}

export async function exportInvoices(user) {
  const docs = await Invoice.find(
    user.role === "super_admin" ? {} : { schoolId: user.schoolId }
  ).populate("schoolId", "name slug email");

  const csv = toCsv(
    ["ID", "Invoice Number", "School", "Email", "Amount", "Status", "Due Date", "Paid At", "Description"],
    docs.map((d) => [
      d._id,
      d.invoiceNumber,
      d.schoolId?.name || "",
      d.schoolId?.email || "",
      d.amount,
      d.status,
      d.dueDate ? new Date(d.dueDate).toISOString() : "",
      d.paidAt ? new Date(d.paidAt).toISOString() : "",
      d.description || "",
    ])
  );

  return csv;
}