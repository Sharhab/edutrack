
import jsPDF from "jspdf";
import type { PaymentRecord } from "../types/billing";

function getSchoolName(payment: PaymentRecord): string {
  if (payment.schoolName) return payment.schoolName;

  if (
    payment.schoolId &&
    typeof payment.schoolId === "object"
  ) {
    return payment.schoolId.name || "School";
  }

  return "School";
}

function getPlan(payment: PaymentRecord): string {
  if (
    payment.subscriptionId &&
    typeof payment.subscriptionId === "object"
  ) {
    return payment.subscriptionId.plan || "Subscription";
  }

  return "EduTrack Subscription";
}

function getReference(payment: PaymentRecord): string {
  return payment.reference || payment._id;
}

function formatAmount(payment: PaymentRecord): string {
  const amount = Number(payment.amount || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: payment.currency || "NGN",
  }).format(amount);
}

function createReceiptPdf(payment: PaymentRecord): jsPDF {
  if (payment.status !== "success") {
    throw new Error(
      "Receipts are available only for successful payments."
    );
  }

  const doc = new jsPDF();
  const school = getSchoolName(payment);
  const reference = getReference(payment);
  const date = payment.paidAt || payment.createdAt;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("EduTrack", 20, 25);

  doc.setFontSize(15);
  doc.text("PAYMENT RECEIPT", 20, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Receipt reference:", 20, 58);
  doc.text(reference, 65, 58);

  doc.text("School:", 20, 70);
  doc.text(school.slice(0, 60), 65, 70);

  doc.text("Subscription:", 20, 82);
  doc.text(getPlan(payment).slice(0, 60), 65, 82);

  doc.text("Payment date:", 20, 94);
  doc.text(
    date ? new Date(date).toLocaleString("en-NG") : "Not available",
    65,
    94
  );

  doc.text("Payment method:", 20, 106);
  doc.text(payment.method || payment.paymentMethod || "Paystack", 65, 106);

  doc.text("Status:", 20, 118);
  doc.setFont("helvetica", "bold");
  doc.text("SUCCESSFUL", 65, 118);

  doc.setFontSize(14);
  doc.text("Amount paid:", 20, 140);
  doc.text(formatAmount(payment), 65, 140);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Thank you for using EduTrack.",
    20,
    170
  );
  doc.text(
    "Keep this receipt for your records.",
    20,
    178
  );

  return doc;
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function downloadPaymentReceipt(payment: PaymentRecord): void {
  const doc = createReceiptPdf(payment);
  doc.save(
    `EduTrack-Receipt-${safeFilename(getReference(payment))}.pdf`
  );
}

export async function sharePaymentReceipt(
  payment: PaymentRecord
): Promise<"shared" | "downloaded" | "unsupported"> {
  const doc = createReceiptPdf(payment);
  const filename =
    `EduTrack-Receipt-${safeFilename(getReference(payment))}.pdf`;

  const blob = doc.output("blob");
  const file = new File([blob], filename, {
    type: "application/pdf",
  });

  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({
      title: "EduTrack Payment Receipt",
      text: `Payment receipt for ${getSchoolName(payment)}`,
      files: [file],
    });

    return "shared";
  }

  // Fallback: download the PDF so the user can share it manually.
  doc.save(filename);
  return "downloaded";
}
