import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export default async function generateReceiptPDF(receipt, res) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${receipt._id}.pdf`
  );

  doc.pipe(res);

  // =========================================
  // SCHOOL HEADER
  // =========================================
  doc
    .fontSize(20)
    .text("SCHOOL RECEIPT", { align: "center" })
    .moveDown();

  doc
    .fontSize(12)
    .text(`Receipt ID: ${receipt._id}`)
    .text(`Reference: ${receipt.reference}`)
    .text(`Date: ${new Date(receipt.createdAt).toLocaleString()}`)
    .moveDown();

  // =========================================
  // STUDENT INFO
  // =========================================
  doc
    .fontSize(14)
    .text("Student Details", { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(
      `Name: ${receipt.studentId.firstName} ${receipt.studentId.lastName}`
    )
    .text(`Admission No: ${receipt.studentId.admissionNumber || ""}`)
    .moveDown();

  // =========================================
  // PAYMENT INFO
  // =========================================
  doc
    .fontSize(14)
    .text("Payment Details", { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Amount Paid: ₦${receipt.amountPaid}`)
    .text(`Method: ${receipt.method}`)
    .text(`Session: ${receipt.session}`)
    .text(`Term: ${receipt.term}`)
    .moveDown();

  // =========================================
  // QR CODE (verification link)
  // =========================================
  const verifyUrl = `https://your-domain.com/verify-receipt/${receipt._id}`;

  const qr = await QRCode.toDataURL(verifyUrl);

  doc.image(qr, { fit: [120, 120], align: "center" });

  doc
    .fontSize(10)
    .text("Scan to verify receipt", { align: "center" });

  // =========================================
  // FOOTER
  // =========================================
  doc.moveDown();
  doc
    .fontSize(10)
    .text("Thank you for your payment", { align: "center" });

  doc.end();
}