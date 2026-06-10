import { Receipt } from "../models/receipt.model.js";
import Payment from "../models/payment.model.js";
import { StudentFee } from "./studentFee.model.js";

/* =========================================
   GET RECEIPT
========================================= */
export async function getReceiptByPaymentHandler(
  req,
  res
) {
  try {
    const { paymentId } = req.params;

    const receipt = await Receipt.findOne({
      paymentId,
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

    let fee = null;

    if (receipt.paymentId?.studentFeeId) {
      fee = await StudentFee.findById(
        receipt.paymentId.studentFeeId
      );
    }

    res.json({
      success: true,
      data: {
        receiptId: receipt._id,
        receiptNumber: receipt.receiptNumber,

        amount: receipt.amount,
        method: receipt.method,

        createdAt: receipt.createdAt,

        student: receipt.studentId,

        payment: receipt.paymentId,

        fee,
      },
    });
  } catch (err) {
    console.error("RECEIPT ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================
   DOWNLOAD RECEIPT
========================================= */
export async function downloadReceiptHandler(
  req,
  res
) {
  try {
    const { paymentId } = req.params;

    const receipt = await Receipt.findOne({
      paymentId,
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

    const html = `
      <html>
        <head>
          <title>Receipt</title>

          <style>
            body{
              font-family: Arial;
              padding:40px;
            }

            .box{
              border:1px solid #ccc;
              padding:30px;
              border-radius:10px;
            }

            h1{
              margin-bottom:20px;
            }

            p{
              margin:8px 0;
            }
          </style>
        </head>

        <body>
          <div class="box">

            <h1>Payment Receipt</h1>

            <p>
              <strong>Receipt No:</strong>
              ${receipt.receiptNumber}
            </p>

            <p>
              <strong>Student:</strong>
              ${receipt.studentId?.firstName || ""}
              ${receipt.studentId?.lastName || ""}
            </p>

            <p>
              <strong>Admission No:</strong>
              ${receipt.studentId?.admissionNumber || "-"}
            </p>

            <p>
              <strong>Amount:</strong>
              ₦${Number(receipt.amount).toLocaleString()}
            </p>

            <p>
              <strong>Method:</strong>
              ${receipt.method}
            </p>

            <p>
              <strong>Date:</strong>
              ${new Date(
                receipt.createdAt
              ).toLocaleString()}
            </p>

          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    res.setHeader(
      "Content-Type",
      "text/html"
    );

    res.send(html);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}