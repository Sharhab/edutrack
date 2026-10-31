


import jsPDF from "jspdf";
import type { PaymentRecord } from "../types/billing";

const C = {
  navy: [13, 48, 69] as [number, number, number],
  teal: [13, 148, 136] as [number, number, number],
  tealDark: [8, 112, 117] as [number, number, number],
  paleTeal: [231, 248, 246] as [number, number, number],
  paleBlue: [235, 247, 253] as [number, number, number],
  paleGray: [246, 249, 251] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  paleGreen: [232, 248, 237] as [number, number, number],
  text: [20, 39, 56] as [number, number, number],
  muted: [99, 116, 130] as [number, number, number],
  border: [220, 232, 237] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function getSchoolName(payment: PaymentRecord): string {
  if (payment.schoolName) return payment.schoolName;

  if (typeof payment.schoolId === "object" && payment.schoolId?.name) {
    return payment.schoolId.name;
  }

  return "EduTrack School";
}

function getSchoolAccount(payment: PaymentRecord): string {
  if (typeof payment.schoolId === "object" && payment.schoolId) {
    return payment.schoolId.slug || payment.schoolId.email || "School account";
  }

  return payment.schoolId || payment.tenantId || "School account";
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

function getBillingCycle(payment: PaymentRecord): string {
  if (
    typeof payment.subscriptionId === "object" &&
    payment.subscriptionId?.billingCycle
  ) {
    return payment.subscriptionId.billingCycle;
  }

  return "Not available";
}

function formatAmount(payment: PaymentRecord): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: payment.currency || "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(payment.amount);
}

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 70);
}

function fitText(
  doc: jsPDF,
  value: string,
  maxWidth: number,
  initialSize: number,
  minSize = 7,
): string {
  let size = initialSize;

  doc.setFontSize(size);

  while (doc.getTextWidth(value) > maxWidth && size > minSize) {
    size -= 0.5;
    doc.setFontSize(size);
  }

  if (doc.getTextWidth(value) <= maxWidth) return value;

  // Truncate exceptionally long values rather than overflowing a card.
  let shortened = value;

  while (
    shortened.length > 3 &&
    doc.getTextWidth(`${shortened}...`) > maxWidth
  ) {
    shortened = shortened.slice(0, -1);
  }

  return `${shortened}...`;
}

function drawSectionTitle(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.navy);
  doc.text(title, x, y);

  doc.setDrawColor(...C.teal);
  doc.setLineWidth(0.8);
  doc.line(x, y + 2.5, x + 15, y + 2.5);
}

function drawInfoRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  options: { bold?: boolean; valueColor?: [number, number, number] } = {},
) {
  const labelWidth = width * 0.39;
  const valueX = x + labelWidth;
  const valueWidth = width - labelWidth;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(label, x, y);

  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(8);
  doc.setTextColor(...(options.valueColor || C.text));

  const valueToDraw = fitText(doc, value || "Not available", valueWidth, 8);
  doc.text(valueToDraw, valueX, y);
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
    compress: true,
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = W - M * 2;

  const schoolName = getSchoolName(payment);
  const schoolAccount = getSchoolAccount(payment);
  const plan = getPlanName(payment);
  const cycle = getBillingCycle(payment);
  const reference = payment.reference || payment._id;
  const paidDate = formatDate(payment.paidAt || payment.createdAt);
  const method = payment.paymentMethod || payment.method || "Online payment";
  const amount = formatAmount(payment);

  // Clean white page.
  doc.setFillColor(...C.white);
  doc.rect(0, 0, W, H, "F");

  // Branded header.
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, 35, "F");

  // Layered teal accents create a gradient-like brand treatment.
  doc.setFillColor(...C.tealDark);
  doc.triangle(112, 0, 143, 0, 132, 35, "F");

  doc.setFillColor(...C.teal);
  doc.triangle(133, 0, 164, 0, 151, 35, "F");

  // Simple graduation-cap motif.
  doc.setFillColor(...C.white);
  doc.triangle(14, 10, 21, 7, 28, 10, "F");
  doc.triangle(14, 10, 21, 13, 28, 10, "F");

  doc.setDrawColor(...C.white);
  doc.setLineWidth(0.7);
  doc.line(17, 12, 17, 16);
  doc.line(25, 12, 25, 16);
  doc.line(17, 16, 25, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(...C.white);
  doc.text("EduTrack", 32, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(214, 238, 241);
  doc.text("SCHOOL MANAGEMENT PLATFORM", 32, 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.white);
  doc.text("PAYMENT RECEIPT", W - M, 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(214, 238, 241);
  doc.text("OFFICIAL TRANSACTION RECORD", W - M, 20, {
    align: "right",
  });

  // Successful payment panel.
  const statusY = 42;
  const statusH = 25;

  doc.setFillColor(...C.paleGreen);
  doc.roundedRect(M, statusY, CW, statusH, 3, 3, "F");

  doc.setDrawColor(190, 231, 202);
  doc.roundedRect(M, statusY, CW, statusH, 3, 3, "S");

  doc.setFillColor(...C.green);
  doc.circle(M + 8, statusY + 12.5, 4, "F");

  doc.setDrawColor(...C.white);
  doc.setLineWidth(1);
  doc.line(M + 5.8, statusY + 12.5, M + 7.5, statusY + 14.2);
  doc.line(M + 7.5, statusY + 14.2, M + 10.5, statusY + 10.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 100, 49);
  doc.text("Payment Successful", M + 16, statusY + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 103, 71);
  doc.text("Your payment has been recorded successfully.", M + 16, statusY + 16);

  // Reference block.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("RECEIPT REFERENCE", W - M - 2, statusY + 8, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.navy);

  const shortReference = fitText(doc, reference, 47, 7.5, 6);
  doc.text(shortReference, W - M - 2, statusY + 15, {
    align: "right",
  });

  // Amount-paid banner.
  const amountY = 74;
  const amountH = 31;

  doc.setFillColor(...C.paleBlue);
  doc.roundedRect(M, amountY, CW, amountH, 3, 3, "F");

  doc.setFillColor(...C.tealDark);
  doc.roundedRect(M, amountY, 43, amountH, 3, 3, "F");
  doc.rect(M + 39, amountY, 4, amountH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text("AMOUNT PAID", M + 6, amountY + 17);

  const methodDividerX = W - M - 42;
  doc.setDrawColor(172, 211, 222);
  doc.setLineWidth(0.4);
  doc.line(methodDividerX, amountY + 5, methodDividerX, amountY + 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...C.navy);

  const amountText = fitText(
    doc,
    amount,
    methodDividerX - (M + 49) - 4,
    18,
    11,
  );

  doc.text(amountText, M + 49, amountY + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("Payment received", M + 49, amountY + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.navy);
  doc.text("METHOD", W - M - 3, amountY + 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const methodText = fitText(doc, method, 35, 7.5, 6);
  doc.text(methodText, W - M - 3, amountY + 17, { align: "right" });

  // Two-column information cards.
  const cardY = 113;
  const cardH = 49;
  const gap = 7;
  const cardW = (CW - gap) / 2;
  const leftX = M;
  const rightX = M + cardW + gap;

  // School card.
  doc.setFillColor(...C.paleBlue);
  doc.roundedRect(leftX, cardY, cardW, cardH, 3, 3, "F");

  drawSectionTitle(doc, "SCHOOL INFORMATION", leftX + 5, cardY + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.navy);

  const schoolLines = doc.splitTextToSize(schoolName, cardW - 10);
  doc.text(schoolLines.slice(0, 2), leftX + 5, cardY + 18);

  drawInfoRow(
    doc,
    "Account",
    schoolAccount,
    leftX + 5,
    cardY + 32,
    cardW - 10,
  );

  drawInfoRow(
    doc,
    "Platform",
    "EduTrack",
    leftX + 5,
    cardY + 41,
    cardW - 10,
  );

  // Subscription card.
  doc.setFillColor(...C.paleGray);
  doc.roundedRect(rightX, cardY, cardW, cardH, 3, 3, "F");

  drawSectionTitle(doc, "SUBSCRIPTION DETAILS", rightX + 5, cardY + 9);

  drawInfoRow(
    doc,
    "Plan",
    plan,
    rightX + 5,
    cardY + 20,
    cardW - 10,
    { bold: true },
  );

  drawInfoRow(
    doc,
    "Billing cycle",
    cycle,
    rightX + 5,
    cardY + 30,
    cardW - 10,
  );

  drawInfoRow(
    doc,
    "Status",
    "Successful",
    rightX + 5,
    cardY + 40,
    cardW - 10,
    { bold: true, valueColor: C.green },
  );

  // Transaction details.
  const detailsY = 177;

  drawSectionTitle(doc, "TRANSACTION DETAILS", M, detailsY);

  const tableY = detailsY + 7;
  const rowH = 10;

  const rows = [
    ["Payment reference", reference],
    ["Payment date", paidDate],
    ["Payment method", method],
    ["Transaction status", "Successful"],
  ];

  rows.forEach(([label, value], index) => {
    const y = tableY + index * rowH;

    if (index % 2 === 0) {
      doc.setFillColor(248, 251, 252);
      doc.roundedRect(M, y - 5, CW, rowH, 1, 1, "F");
    }

    drawInfoRow(doc, label, value, M + 4, y + 1, CW - 8, {
      bold: label === "Transaction status",
      valueColor:
        label === "Transaction status" ? C.green : undefined,
    });
  });

  // Thank-you section.
  const thankY = 235;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, thankY, W - M, thankY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.navy);
  doc.text("Thank you for choosing EduTrack.", M, thankY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);

  doc.text(
    "Please keep this receipt for your financial records.",
    M,
    thankY + 17,
  );

  doc.text(
    "This document records the payment details available to EduTrack.",
    M,
    thankY + 23,
  );

  // Layered geometric footer accents.
  doc.setFillColor(222, 246, 245);
  doc.triangle(0, H - 22, 75, H - 22, 0, H - 10, "F");

  doc.setFillColor(...C.teal);
  doc.triangle(0, H - 14, 90, H - 14, 0, H - 5, "F");

  doc.setFillColor(...C.navy);
  doc.rect(0, H - 12, W, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text("EduTrack", M, H - 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(220, 239, 243);
  doc.text("School management made simpler.", W / 2, H - 4.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.white);
  doc.text("edutrack.cloud", W - M, H - 4.5, { align: "right" });

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

  // Fall back to a regular PDF download on unsupported browsers.
  doc.save(filename);
}
