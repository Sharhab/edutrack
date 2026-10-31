

import jsPDF from "jspdf";
import type { PaymentRecord } from "../types/billing";

const BRAND = {
  teal: [13, 148, 136] as [number, number, number],
  dark: [15, 45, 65] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  pale: [240, 253, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
};

function getSchoolName(payment: PaymentRecord): string {
  if (payment.schoolName) return payment.schoolName;

  if (typeof payment.schoolId === "object" && payment.schoolId?.name) {
    return payment.schoolId.name;
  }

  return "EduTrack School";
}

function getPlanName(payment: PaymentRecord): string {
  if (
    typeof payment.subscriptionId === "object" &&
    payment.subscriptionId?.plan
  ) {
    return payment.subscriptionId.plan;
  }

  return "School subscription";
}

function formatAmount(payment: PaymentRecord): string {
  const currency = payment.currency || "NGN";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(payment.amount);
}

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 60);
}

function addLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueX: number,
  maxWidth: number,
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(label, x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.dark);

  const lines = doc.splitTextToSize(value || "Not available", maxWidth);
  doc.text(lines, valueX, y);
}

function buildReceipt(payment: PaymentRecord): jsPDF {
  if (payment.status !== "success") {
    throw new Error(
      "A receipt can only be generated for a successful payment.",
    );
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const schoolName = getSchoolName(payment);
  const reference = payment.reference || payment._id;
  const paidDate = formatDate(payment.paidAt || payment.createdAt);
  const method = payment.paymentMethod || payment.method || "Online payment";
  const plan = getPlanName(payment);
  const amount = formatAmount(payment);

  // White page background.
  doc.setFillColor(...BRAND.white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Premium brand header.
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setFillColor(...BRAND.teal);
  doc.rect(0, 42, pageWidth, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(...BRAND.white);
  doc.text("EduTrack", margin, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(204, 230, 237);
  doc.text("SCHOOL MANAGEMENT PLATFORM", margin, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND.white);
  doc.text("PAYMENT RECEIPT", pageWidth - margin, 19, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(204, 230, 237);
  doc.text("OFFICIAL SUBSCRIPTION PAYMENT RECORD", pageWidth - margin, 26, {
    align: "right",
  });

  // Successful payment status.
  const statusY = 55;
  doc.setFillColor(...BRAND.pale);
  doc.roundedRect(margin, statusY, contentWidth, 21, 3, 3, "F");

  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, statusY, contentWidth, 21, 3, 3, "S");

  doc.setFillColor(...BRAND.green);
  doc.circle(margin + 7, statusY + 10.5, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text("PAYMENT SUCCESSFUL", margin + 14, statusY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text("Transaction recorded successfully", margin + 14, statusY + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.dark);
  doc.text("Receipt reference", pageWidth - margin - 2, statusY + 8, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    doc.splitTextToSize(reference, 48),
    pageWidth - margin - 2,
    statusY + 14,
    { align: "right" },
  );

  // Amount card.
  const amountY = 84;
  doc.setFillColor(246, 250, 252);
  doc.roundedRect(margin, amountY, contentWidth, 36, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("TOTAL AMOUNT PAID", margin + 7, amountY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.setTextColor(...BRAND.dark);

  // Fit long amounts within the available space.
  let amountFontSize = 25;
  while (
    amountFontSize > 15 &&
    doc.getTextWidth(amount) > contentWidth - 14
  ) {
    amountFontSize -= 1;
    doc.setFontSize(amountFontSize);
  }

  doc.text(amount, margin + 7, amountY + 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.teal);
  doc.text("Paid via " + method, pageWidth - margin - 7, amountY + 23, {
    align: "right",
  });

  // School information.
  const sectionY = 133;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text("SCHOOL INFORMATION", margin, sectionY);

  doc.setDrawColor(...BRAND.teal);
  doc.setLineWidth(0.7);
  doc.line(margin, sectionY + 3, margin + 18, sectionY + 3);

  addLabelValue(
    doc,
    "School name",
    schoolName,
    margin,
    sectionY + 13,
    margin + 32,
    contentWidth - 35,
  );

  addLabelValue(
    doc,
    "School account",
    typeof payment.schoolId === "object"
      ? payment.schoolId?.slug || payment.schoolId?.email || "Not available"
      : payment.schoolId || payment.tenantId || "Not available",
    margin,
    sectionY + 23,
    margin + 32,
    contentWidth - 35,
  );

  // Subscription details.
  const subscriptionY = 174;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text("SUBSCRIPTION DETAILS", margin, subscriptionY);

  doc.setDrawColor(...BRAND.teal);
  doc.line(margin, subscriptionY + 3, margin + 18, subscriptionY + 3);

  addLabelValue(
    doc,
    "Subscription plan",
    plan,
    margin,
    subscriptionY + 13,
    margin + 38,
    contentWidth - 42,
  );

  addLabelValue(
    doc,
    "Billing cycle",
    typeof payment.subscriptionId === "object"
      ? payment.subscriptionId?.billingCycle || "Not available"
      : "Not available",
    margin,
    subscriptionY + 23,
    margin + 38,
    contentWidth - 42,
  );

  // Transaction details.
  const transactionY = 215;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text("TRANSACTION DETAILS", margin, transactionY);

  doc.setDrawColor(...BRAND.teal);
  doc.line(margin, transactionY + 3, margin + 18, transactionY + 3);

  addLabelValue(
    doc,
    "Payment reference",
    reference,
    margin,
    transactionY + 13,
    margin + 38,
    contentWidth - 42,
  );

  addLabelValue(
    doc,
    "Payment date",
    paidDate,
    margin,
    transactionY + 23,
    margin + 38,
    contentWidth - 42,
  );

  addLabelValue(
    doc,
    "Payment method",
    method,
    margin,
    transactionY + 33,
    margin + 38,
    contentWidth - 42,
  );

  addLabelValue(
    doc,
    "Transaction status",
    "Successful",
    margin,
    transactionY + 43,
    margin + 38,
    contentWidth - 42,
  );

  // Divider and thank-you message.
  const footerY = 270;

  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.dark);
  doc.text("Thank you for choosing EduTrack.", margin, footerY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);

  const note =
    "Please retain this receipt for your financial records. This document confirms the successful payment recorded by EduTrack.";

  doc.text(doc.splitTextToSize(note, contentWidth), margin, footerY + 17);

  // Branded footer.
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, pageHeight - 13, pageWidth, 13, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.white);
  doc.text("EduTrack", margin, pageHeight - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(204, 230, 237);
  doc.text(
    "School management made simpler.",
    pageWidth - margin,
    pageHeight - 5,
    { align: "right" },
  );

  return doc;
}

export function downloadPaymentReceipt(payment: PaymentRecord): void {
  const doc = buildReceipt(payment);
  const reference = payment.reference || payment._id;

  doc.save(`EduTrack-Receipt-${safeFileName(reference)}.pdf`);
}

export async function sharePaymentReceipt(
  payment: PaymentRecord,
): Promise<void> {
  const doc = buildReceipt(payment);
  const reference = payment.reference || payment._id;
  const filename = `EduTrack-Receipt-${safeFileName(reference)}.pdf`;

  const blob = doc.output("blob");
  const file = new File([blob], filename, {
    type: "application/pdf",
  });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      title: "EduTrack Payment Receipt",
      text: `Payment receipt for ${getSchoolName(payment)}.`,
      files: [file],
    });
    return;
  }

  // Browsers without file sharing can still download the receipt.
  doc.save(filename);
}
