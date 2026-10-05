import { Receipt } from "../models/receipt.model.js";
import { StudentFee } from "./studentFee.model.js";
import { Student } from "../../students/student.model.js";
import { Parent } from "../../parents/parent.model.js";
import { School } from "../../schools/school.model.js";

/* =========================================
   HELPERS
========================================= */

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(amount) {
  const value = Number(amount || 0);

  return value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function numberToWords(number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertLessThanThousand(num) {
    let result = "";

    if (num >= 100) {
      result += `${ones[Math.floor(num / 100)]} Hundred`;
      num %= 100;

      if (num > 0) {
        result += " ";
      }
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)];

      if (num % 10 > 0) {
        result += `-${ones[num % 10]}`;
      }
    } else if (num > 0) {
      result += ones[num];
    }

    return result;
  }

  const value = Number(number || 0);

  if (!Number.isFinite(value)) {
    return "Zero Naira Only";
  }

  const whole = Math.floor(value);
  const kobo = Math.round((value - whole) * 100);

  if (whole === 0 && kobo === 0) {
    return "Zero Naira Only";
  }

  let result = "";

  if (whole >= 1_000_000) {
    result += `${convertLessThanThousand(
      Math.floor(whole / 1_000_000)
    )} Million`;

    const remainder = whole % 1_000_000;

    if (remainder > 0) {
      result += ` ${numberToWords(remainder)
        .replace(" Naira Only", "")
        .replace(" Naira", "")}`;
    }

    result += " Naira";
  } else if (whole >= 1000) {
    result += `${convertLessThanThousand(
      Math.floor(whole / 1000)
    )} Thousand`;

    const remainder = whole % 1000;

    if (remainder > 0) {
      result += ` ${convertLessThanThousand(remainder)}`;
    }

    result += " Naira";
  } else {
    result = `${convertLessThanThousand(whole)} Naira`;
  }

  if (kobo > 0) {
    result += ` and ${convertLessThanThousand(kobo)} Kobo`;
  }

  return `${result} Only`;
}

/* =========================================
   GET PARENT'S PAID RECEIPTS
========================================= */

export async function listReceiptsHandler(req, res) {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is required",
      });
    }

    let filter = {
      schoolId,
      status: {
        $in: ["success", "paid"],
      },
    };

    /* =====================================
       PARENT
    ===================================== */

    if (req.user?.role === "parent") {
      const userId = req.user?._id || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const parent = await Parent.findOne({
        userId,
        schoolId,
      }).select("_id");

      if (!parent) {
        return res.status(403).json({
          success: false,
          message: "Parent profile not found",
        });
      }

      const children = await Student.find({
        schoolId,
        parentIds: parent._id,
      }).select("_id");

      const studentIds = children.map(
        (student) => student._id
      );

      filter.studentId = {
        $in: studentIds,
      };
    }

    /* =====================================
       GET RECEIPTS
    ===================================== */

    const receipts = await Receipt.find(filter)
      .populate({
        path: "studentId",
        select:
          "firstName lastName admissionNumber",
      })
      .sort({
        issuedAt: -1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      data: receipts,
    });
  } catch (err) {
    console.error(
      "LIST RECEIPTS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to load receipts",
    });
  }
}

/* =========================================
   GET RECEIPT BY PAYMENT
========================================= */

export async function getReceiptByPaymentHandler(
  req,
  res
) {
  try {
    const { paymentId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is required",
      });
    }

    const receipt = await Receipt.findOne({
      paymentId,
      schoolId,
      status: {
        $in: ["success", "paid"],
      },
    })
      .populate({
        path: "studentId",
        select:
          "firstName lastName admissionNumber",
      })
      .populate({
        path: "paymentId",
      });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    /* =====================================
       PARENT OWNERSHIP CHECK
    ===================================== */

    if (req.user?.role === "parent") {
      const userId =
        req.user?._id || req.user?.id;

      const parent = await Parent.findOne({
        userId,
        schoolId,
      }).select("_id");

      if (!parent) {
        return res.status(403).json({
          success: false,
          message: "Parent profile not found",
        });
      }

      const student = await Student.findOne({
        _id: receipt.studentId?._id,
        schoolId,
        parentIds: parent._id,
      }).select("_id");

      if (!student) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this receipt",
        });
      }
    }

    const school = await School.findById(
      schoolId
    ).select(
      "name email phone address logo logoUrl themeColor"
    );

    let fee = null;

    if (receipt.paymentId?.studentFeeId) {
      fee = await StudentFee.findOne({
        _id: receipt.paymentId.studentFeeId,
        schoolId,
      });
    }

    return res.json({
      success: true,
      data: {
        receiptId: receipt._id,
        receiptNumber:
          receipt.receiptNumber,

        amount: receipt.amount,
        amountPaid: receipt.amountPaid,
        method: receipt.method,
        status: receipt.status,

        reference: receipt.reference,

        title: receipt.title,
        totalAmount: receipt.totalAmount,
        balance: receipt.balance,

        session: receipt.session,
        term: receipt.term,

        createdAt: receipt.createdAt,
        issuedAt: receipt.issuedAt,

        student: receipt.studentId,

        payment: receipt.paymentId,

        fee,

        school: school
          ? {
              name: school.name || "",
              email: school.email || "",
              phone: school.phone || "",
              address: school.address || "",
              logo:
                school.logo ||
                school.logoUrl ||
                "",
              themeColor:
                school.themeColor ||
                "#06b6d4",
            }
          : null,
      },
    });
  } catch (err) {
    console.error(
      "RECEIPT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to load receipt",
    });
  }
}

/* =========================================
   BUILD RECEIPT HTML
========================================= */

async function buildReceiptHtml(
  receipt,
  school
) {
  const student =
    receipt.studentId || {};

  const schoolName =
    school?.name || "School";

  const schoolLogo =
    school?.logo ||
    school?.logoUrl ||
    "";

  const themeColor =
    school?.themeColor ||
    "#06b6d4";

  const studentName =
    `${student.firstName || ""} ${
      student.lastName || ""
    }`.trim();

  const amountPaid =
    Number(
      receipt.amountPaid ||
        receipt.amount ||
        0
    );

  const paymentMethod =
    String(
      receipt.method || "cash"
    )
      .replace("_", " ")
      .toUpperCase();

  const issuedDate =
    new Date(
      receipt.issuedAt ||
        receipt.createdAt ||
        Date.now()
    ).toLocaleString("en-NG");

  const amountWords =
    numberToWords(amountPaid);

  const logoHtml = schoolLogo
    ? `
      <img
        src="${escapeHtml(schoolLogo)}"
        class="logo"
        alt="School Logo"
      />
    `
    : `
      <div class="logo-placeholder">
        ${escapeHtml(
          schoolName
            .charAt(0)
            .toUpperCase()
        )}
      </div>
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  ${escapeHtml(
    receipt.receiptNumber ||
      "Payment Receipt"
  )}
</title>

<style>

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 30px;
    background: #f1f5f9;
    color: #172033;
    font-family:
      Arial,
      Helvetica,
      sans-serif;
  }

  .receipt {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border: 2px solid ${themeColor};
    border-radius: 8px;
    overflow: hidden;
  }

  .top-line {
    height: 8px;
    background: ${themeColor};
  }

  .header {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    border-radius: 8px;
  }

  .logo-placeholder {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: ${themeColor};
    color: white;
    font-size: 32px;
    font-weight: bold;
  }

  .school-info {
    flex: 1;
  }

  .school-name {
    margin: 0;
    color: ${themeColor};
    font-size: 26px;
    font-weight: 800;
  }

  .school-contact {
    margin-top: 7px;
    color: #64748b;
    font-size: 13px;
    line-height: 1.6;
  }

  .receipt-title {
    margin: 0;
    color: ${themeColor};
    font-size: 20px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .receipt-number {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .content {
    padding: 24px;
  }

  .section-title {
    margin-bottom: 12px;
    color: ${themeColor};
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .detail {
    padding: 13px 15px;
    border-bottom: 1px solid #e2e8f0;
  }

  .detail:nth-child(odd) {
    border-right: 1px solid #e2e8f0;
  }

  .label {
    display: block;
    margin-bottom: 5px;
    color: #64748b;
    font-size: 11px;
    text-transform: uppercase;
  }

  .value {
    color: #172033;
    font-size: 14px;
    font-weight: 700;
  }

  .amount-box {
    margin-top: 22px;
    padding: 18px;
    border: 2px solid ${themeColor};
    border-radius: 7px;
  }

  .amount-label {
    color: #64748b;
    font-size: 12px;
    text-transform: uppercase;
  }

  .amount {
    margin-top: 5px;
    color: ${themeColor};
    font-size: 28px;
    font-weight: 900;
  }

  .amount-words {
    margin-top: 7px;
    color: #475569;
    font-size: 13px;
    font-style: italic;
  }

  .payment-purpose {
    margin-top: 22px;
    padding: 15px;
    background: #f8fafc;
    border-left: 4px solid ${themeColor};
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 30px;
    padding: 25px 24px;
    border-top: 1px solid #e2e8f0;
  }

  .signature {
    min-width: 180px;
  }

  .signature-line {
    margin-top: 38px;
    border-top: 1px solid #334155;
    padding-top: 7px;
    color: #64748b;
    font-size: 12px;
    text-align: center;
  }

  .paid {
    color: #15803d;
    font-size: 15px;
    font-weight: 800;
  }

  .print-button {
    position: fixed;
    right: 20px;
    bottom: 20px;
    padding: 12px 20px;
    border: none;
    border-radius: 7px;
    background: ${themeColor};
    color: white;
    cursor: pointer;
    font-weight: 700;
  }

  @media print {

    body {
      padding: 0;
      background: white;
    }

    .receipt {
      max-width: none;
      border-radius: 0;
    }

    .print-button {
      display: none;
    }

    @page {
      size: A4;
      margin: 12mm;
    }
  }

  @media (max-width: 650px) {

    body {
      padding: 10px;
    }

    .header {
      flex-direction: column;
      text-align: center;
    }

    .details {
      grid-template-columns: 1fr;
    }

    .detail:nth-child(odd) {
      border-right: none;
    }

    .footer {
      flex-direction: column;
    }
  }

</style>
</head>

<body>

<div class="receipt">

  <div class="top-line"></div>

  <div class="header">

    ${logoHtml}

    <div class="school-info">

      <h1 class="school-name">
        ${escapeHtml(schoolName)}
      </h1>

      <div class="school-contact">
        ${
          escapeHtml(
            school?.address || ""
          )
        }

        ${
          school?.phone
            ? `<br>${escapeHtml(
                school.phone
              )}`
            : ""
        }

        ${
          school?.email
            ? `<br>${escapeHtml(
                school.email
              )}`
            : ""
        }
      </div>

    </div>

    <div>

      <h2 class="receipt-title">
        Cash Receipt
      </h2>

      <div class="receipt-number">
        Receipt No:
        <strong>
          ${escapeHtml(
            receipt.receiptNumber ||
              "-"
          )}
        </strong>
      </div>

    </div>

  </div>

  <div class="content">

    <div class="section-title">
      Payment Information
    </div>

    <div class="details">

      <div class="detail">

        <span class="label">
          Received From
        </span>

        <span class="value">
          ${escapeHtml(
            studentName || "-"
          )}
        </span>

      </div>

      <div class="detail">

        <span class="label">
          Admission Number
        </span>

        <span class="value">
          ${escapeHtml(
            student.admissionNumber ||
              "-"
          )}
        </span>

      </div>

      <div class="detail">

        <span class="label">
          Date
        </span>

        <span class="value">
          ${escapeHtml(issuedDate)}
        </span>

      </div>

      <div class="detail">

        <span class="label">
          Payment Method
        </span>

        <span class="value">
          ${escapeHtml(
            paymentMethod
          )}
        </span>

      </div>

      <div class="detail">

        <span class="label">
          Session
        </span>

        <span class="value">
          ${escapeHtml(
            receipt.session || "-"
          )}
        </span>

      </div>

      <div class="detail">

        <span class="label">
          Term
        </span>

        <span class="value">
          ${escapeHtml(
            receipt.term || "-"
          )}
        </span>

      </div>

    </div>

    <div class="amount-box">

      <div class="amount-label">
        Amount Paid
      </div>

      <div class="amount">
        ₦${formatMoney(amountPaid)}
      </div>

      <div class="amount-words">
        ${escapeHtml(
          amountWords
        )}
      </div>

    </div>

    <div class="payment-purpose">

      <strong>
        Being payment for:
      </strong>

      ${escapeHtml(
        receipt.title ||
          "School fees"
      )}

    </div>

    ${
      receipt.reference
        ? `
          <div
            style="
              margin-top:15px;
              font-size:12px;
              color:#64748b;
            "
          >
            Payment Reference:
            <strong>
              ${escapeHtml(
                receipt.reference
              )}
            </strong>
          </div>
        `
        : ""
    }

  </div>

  <div class="footer">

    <div>
      <div class="paid">
        ✓ PAYMENT RECEIVED
      </div>

      <div
        style="
          margin-top:7px;
          color:#64748b;
          font-size:12px;
        "
      >
        Thank you for your payment.
      </div>
    </div>

    <div class="signature">

      <div class="signature-line">
        Authorized Signature
      </div>

    </div>

  </div>

</div>

<button
  class="print-button"
  onclick="window.print()"
>
  Print / Save as PDF
</button>

</body>
</html>
`;
}

/* =========================================
   DOWNLOAD / PRINT RECEIPT
========================================= */

export async function downloadReceiptHandler(
  req,
  res
) {
  try {
    const { paymentId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is required",
      });
    }

    const receipt = await Receipt.findOne({
      paymentId,
      schoolId,
      status: {
        $in: ["success", "paid"],
      },
    }).populate({
      path: "studentId",
      select:
        "firstName lastName admissionNumber",
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    /* =====================================
       PARENT OWNERSHIP CHECK
    ===================================== */

    if (req.user?.role === "parent") {
      const userId =
        req.user?._id || req.user?.id;

      const parent = await Parent.findOne({
        userId,
        schoolId,
      }).select("_id");

      if (!parent) {
        return res.status(403).json({
          success: false,
          message: "Parent profile not found",
        });
      }

      const student = await Student.findOne({
        _id: receipt.studentId?._id,
        schoolId,
        parentIds: parent._id,
      }).select("_id");

      if (!student) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to download this receipt",
        });
      }
    }

    const school = await School.findById(
      schoolId
    ).select(
      "name email phone address logo logoUrl themeColor"
    );

    const html = await buildReceiptHtml(
      receipt,
      school
    );

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="receipt-${receipt.receiptNumber}.html"`
    );

    return res.send(html);
  } catch (err) {
    console.error(
      "DOWNLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to generate receipt",
    });
  }
}
