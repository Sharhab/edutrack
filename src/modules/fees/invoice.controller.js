import {
  createInvoice,
  listInvoices,
  getStudentInvoices,
} from "./invoice.service.js";

export async function createInvoiceHandler(
  req,
  res
) {
  const invoice =
    await createInvoice(
      req.body,
      req.user.schoolId
    );

  res.status(201).json({
    success: true,
    message:
      "Invoice created successfully",
    data: invoice,
  });
}

export async function listInvoicesHandler(
  req,
  res
) {
  const data =
    await listInvoices(
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}

export async function getStudentInvoicesHandler(
  req,
  res
) {
  const data =
    await getStudentInvoices(
      req.params.studentId,
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}