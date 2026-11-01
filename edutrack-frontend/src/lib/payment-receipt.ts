
import jsPDF from "jspdf";
import type { PaymentRecord } from "../types/billing";

let interFontsPromise:
  | Promise<{ regular: string; bold: string }>
  | undefined;

async function loadInterFonts(): Promise<{
  regular: string;
  bold: string;
}> {
  if (!interFontsPromise) {
    interFontsPromise = Promise.all([
      fetch("/fonts/Inter-Regular.ttf"),
      fetch("/fonts/Inter-Bold.ttf"),
    ])
      .then(async ([regularResponse, boldResponse]) => {
        if (!regularResponse.ok || !boldResponse.ok) {
          throw new Error(
            "Failed to load Inter font files. Check public/fonts/.",
          );
        }

        const [regularBuffer, boldBuffer] = await Promise.all([
          regularResponse.arrayBuffer(),
          boldResponse.arrayBuffer(),
        ]);

        function toBase64(buffer: ArrayBuffer): string {
          const bytes = new Uint8Array(buffer);
          let binary = "";

          for (const byte of bytes) {
            binary += String.fromCharCode(byte);
          }

          return btoa(binary);
        }

        return {
          regular: toBase64(regularBuffer),
          bold: toBase64(boldBuffer),
        };
      })
      .catch((error: unknown) => {
        interFontsPromise = undefined;
        throw error;
      });
  }

  return interFontsPromise;
}

export async function registerInterFont(doc: jsPDF): Promise<void> {
  const fonts = await loadInterFonts();

  doc.addFileToVFS("Inter-Regular.ttf", fonts.regular);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");

  doc.addFileToVFS("Inter-Bold.ttf", fonts.bold);
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");

  doc.setFont("Inter", "normal");
}

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
  muted: [88, 107, 122] as [number, number, number],
  border: [220, 232, 237] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

type RGB = [number, number, number];

function getSchoolName(payment: PaymentRecord): string {
  if (payment.schoolName) return payment.schoolName;

  if (typeof payment.schoolId === "object" && payment.schoolId?.name) {
    return payment.schoolId.name;
  }

  return "EduTrack School";
}

function getSchoolAccount(payment: PaymentRecord): string {
  if (typeof payment.schoolId === "object" && payment.schoolId) {
    return (
      payment.schoolId.slug ||
      payment.schoolId.email ||
      "School account"
    );
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
  minSize = 8,
): string {
  let size = initialSize;

  doc.setFontSize(size);

  while (doc.getTextWidth(value) > maxWidth && size > minSize) {
    size -= 0.5;
    doc.setFontSize(size);
  }

  if (doc.getTextWidth(value) <= maxWidth) return value;

  let shortened = value;

  while (
    shortened.length > 4 &&
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
): void {
  doc.setFont("Inter", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.navy);
  doc.text(title, x, y);

  doc.setDrawColor(...C.teal);
  doc.setLineWidth(0.9);
  doc.line(x, y + 3, x + 17, y + 3);
}

function drawInfoRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  options: {
    bold?: boolean;
    valueColor?: RGB;
  } = {},
): void {
  const labelWidth = width * 0.39;
  const valueX = x + labelWidth;
  const valueWidth = width - labelWidth;

  doc.setFont("Inter", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  doc.text(label, x, y);

  doc.setFont("Inter", options.bold ? "bold" : "normal");
  doc.setFontSize(10);
  doc.setTextColor(...(options.valueColor || C.text));

  const valueToDraw = fitText(
    doc,
    value || "Not available",
    valueWidth,
    10,
    8,
  );

  doc.text(valueToDraw, valueX, y);
}

async function buildReceipt(payment: PaymentRecord): Promise<jsPDF> {
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

  // Register the Inter fonts before drawing any receipt text.
  await registerInterFont(doc);

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
  const method =
    payment.paymentMethod || payment.method || "Online payment";
  const amount = formatAmount(payment);

  // Background.
  doc.setFillColor(...C.white);
  doc.rect(0, 0, W, H, "F");

  // BRAND HEADER.
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, 38, "F");

  doc.setFillColor(...C.tealDark);
  doc.triangle(111, 0, 146, 0, 131, 38, "F");

  doc.setFillColor(...C.teal);
  doc.triangle(139, 0, 174, 0, 157, 38, "F");

  // Simple educational icon.
  doc.setFillColor(...C.white);
  doc.triangle(14, 10, 21, 7, 28, 10, "F");
  doc.triangle(14, 10, 21, 13, 28, 10, "F");

  doc.setDrawColor(...C.white);
  doc.setLineWidth(0.7);
  doc.line(17, 12, 17, 16);
  doc.line(25, 12, 25, 16);
  doc.line(17, 16, 25, 16);

  doc.setFont("Inter", "bold");
  doc.setFontSize(25);
  doc.setTextColor(...C.white);
  doc.text("EduTrack", 32, 15);

  doc.setFont("Inter", "normal");
  doc.setFontSize(9);
  doc.setTextColor(222, 239, 244);
  doc.text("SCHOOL MANAGEMENT PLATFORM", 32, 23);

  doc.setFont("Inter", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.white);
  doc.text("PAYMENT RECEIPT", W - M, 15, {
    align: "right",
  });

  doc.setFont("Inter", "normal");
  doc.setFontSize(8);
  doc.setTextColor(222, 239, 244);
  doc.text("OFFICIAL TRANSACTION RECORD", W - M, 23, {
    align: "right",
  });

  // PAYMENT STATUS.
  const statusY = 44;
  const statusH = 27;

  doc.setFillColor(...C.paleGreen);
  doc.roundedRect(M, statusY, CW, statusH, 3, 3, "F");

  doc.setDrawColor(190, 231, 202);
  doc.roundedRect(M, statusY, CW, statusH, 3, 3, "S");

  doc.setFillColor(...C.green);
  doc.circle(M + 8, statusY + 13.5, 4, "F");

  doc.setDrawColor(...C.white);
  doc.setLineWidth(1);
  doc.line(M + 5.8, statusY + 13.5, M + 7.5, statusY + 15.2);
  doc.line(M + 7.5, statusY + 15.2, M + 10.5, statusY + 11.8);

  doc.setFont("Inter", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 100, 49);
  doc.text("Payment Successful", M + 16, statusY + 11);

  doc.setFont("Inter", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 103, 71);
  doc.text(
    "Your payment has been recorded successfully.",
    M + 16,
    statusY + 18,
  );

  doc.setFont("Inter", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text("RECEIPT REFERENCE", W - M - 3, statusY + 9, {
    align: "right",
  });

  doc.setFont("Inter", "bold");
  doc.setFontSize(8.5);

  const referenceText = fitText(doc, reference, 48, 8.5, 7);
  doc.text(referenceText, W - M - 3, statusY + 17, {
    align: "right",
  });

  // AMOUNT PAID.
  const amountY = 78;
  const amountH = 36;

  doc.setFillColor(...C.paleBlue);
  doc.roundedRect(M, amountY, CW, amountH, 3, 3, "F");

  doc.setFillColor(...C.tealDark);
  doc.roundedRect(M, amountY, 43, amountH, 3, 3, "F");
  doc.rect(M + 39, amountY, 4, amountH, "F");

  doc.setFont("Inter", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text("AMOUNT", M + 6, amountY + 15);
  doc.text("PAID", M + 6, amountY + 23);

  const methodDividerX = W - M - 42;
  const amountTextX = M + 49;
  const amountWidth = methodDividerX - amountTextX - 5;

  doc.setFont("Inter", "bold");
  doc.setFontSize(25);
  doc.setTextColor(...C.navy);

  const fittedAmount = fitText(doc, amount, amountWidth, 25, 14);
  doc.text(fittedAmount, amountTextX, amountY + 18);

  doc.setFont("Inter", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text("Payment received", amountTextX, amountY + 27);

  doc.setDrawColor(172, 211, 222);
  doc.setLineWidth(0.5);
  doc.line(methodDividerX, amountY + 5, methodDividerX, amountY + 31);

  doc.setFont("Inter", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.navy);
  doc.text("METHOD", W - M - 3, amountY + 13, {
    align: "right",
  });

  doc.setFont("Inter", "normal");
  doc.setFontSize(9);

  const methodText = fitText(doc, method, 36, 9, 7);
  doc.text(methodText, W - M - 3, amountY + 22, {
    align: "right",
  });

  // TWO-COLUMN INFORMATION CARDS.
  const cardY = 122;
  const cardH = 52;
  const gap = 7;
  const cardW = (CW - gap) / 2;
  const leftX = M;
  const rightX = M + cardW + gap;

  // School card.
  doc.setFillColor(...C.paleBlue);
  doc.roundedRect(leftX, cardY, cardW, cardH, 3, 3, "F");

  drawSectionTitle(doc, "SCHOOL INFORMATION", leftX + 5, cardY + 10);

  doc.setFont("Inter", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.navy);

  const schoolLines = doc.splitTextToSize(schoolName, cardW - 10);
  doc.text(schoolLines.slice(0, 2), leftX + 5, cardY + 20);

  drawInfoRow(
    doc,
    "Account",
    schoolAccount,
    leftX + 5,
    cardY + 36,
    cardW - 10,
  );

  drawInfoRow(
    doc,
    "Platform",
    "EduTrack",
    leftX + 5,
    cardY + 46,
    cardW - 10,
  );

  // Subscription card.
  doc.setFillColor(...C.paleGray);
  doc.roundedRect(rightX, cardY, cardW, cardH, 3, 3, "F");

  drawSectionTitle(doc, "SUBSCRIPTION", rightX + 5, cardY + 10);

  drawInfoRow(
    doc,
    "Plan",
    plan,
    rightX + 5,
    cardY + 24,
    cardW - 10,
    { bold: true },
  );

  drawInfoRow(
    doc,
    "Billing cycle",
    cycle,
    rightX + 5,
    cardY + 35,
    cardW - 10,
  );

  drawInfoRow(
    doc,
    "Status",
    "Successful",
    rightX + 5,
    cardY + 46,
    cardW - 10,
    { bold: true, valueColor: C.green },
  );

  // TRANSACTION DETAILS.
  const detailsY = 190;

  drawSectionTitle(doc, "TRANSACTION DETAILS", M, detailsY);

  const tableY = detailsY + 10;
  const rowH = 11;

  const rows: [string, string][] = [
    ["Payment reference", reference],
    ["Payment date", paidDate],
    ["Payment method", method],
    ["Transaction status", "Successful"],
  ];

  rows.forEach(([label, value], index) => {
    const y = tableY + index * rowH;

    if (index % 2 === 0) {
      doc.setFillColor(248, 251, 252);
      doc.roundedRect(M, y - 5.5, CW, rowH, 1.5, 1.5, "F");
    }

    drawInfoRow(doc, label, value, M + 4, y + 1, CW - 8, {
      bold: label === "Transaction status",
      valueColor:
        label === "Transaction status" ? C.green : undefined,
    });
  });

  // THANK YOU.
  const thankY = 253;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, thankY, W - M, thankY);

  doc.setFont("Inter", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.navy);
  doc.text("Thank you for choosing EduTrack.", M, thankY + 10);

  doc.setFont("Inter", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  doc.text(
    "Please keep this receipt for your financial records.",
    M,
    thankY + 18,
  );

  doc.setFontSize(8.5);
  doc.text(
    "This receipt reflects the payment details recorded by EduTrack.",
    M,
    thankY + 25,
  );

  // BRANDED FOOTER.
  doc.setFillColor(222, 246, 245);
  doc.triangle(0, H - 23, 75, H - 23, 0, H - 10, "F");

  doc.setFillColor(...C.teal);
  doc.triangle(0, H - 15, 90, H - 15, 0, H - 5, "F");

  doc.setFillColor(...C.navy);
  doc.rect(0, H - 12, W, 12, "F");

  doc.setFont("Inter", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text("EduTrack", M, H - 4.5);

  doc.setFont("Inter", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 239, 243);
  doc.text("School management made simpler.", W / 2, H - 4.5, {
    align: "center",
  });

  doc.setFont("Inter", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text("edutrack.cloud", W - M, H - 4.5, {
    align: "right",
  });

  return doc;
}

export async function downloadPaymentReceipt(
  payment: PaymentRecord,
): Promise<void> {
  const doc = await buildReceipt(payment);
  const reference = payment.reference || payment._id;

  doc.save(`EduTrack-Receipt-${safeFileName(reference)}.pdf`);
}

export async function sharePaymentReceipt(
  payment: PaymentRecord,
): Promise<void> {
  const doc = await buildReceipt(payment);
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

  // Fallback for browsers without file sharing.
  doc.save(filename);
}
