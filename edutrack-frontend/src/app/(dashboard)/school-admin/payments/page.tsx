"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../lib/axios";

import {
  RefreshCcw,
  Receipt,
  AlertCircle,
  Wallet,
  Download,
  XCircle,
  Users,
  GraduationCap,
  Loader2,
} from "lucide-react";

function formatCurrency(v: number) {
  return `₦${Number(v || 0).toLocaleString()}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "paid":
    case "successful":
    case "success":
      return "text-green-400";

    case "partial":
      return "text-yellow-400";

    case "cancelled":
    case "failed":
      return "text-red-400";

    default:
      return "text-slate-400";
  }
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [form, setForm] = useState({
    classId: "",
    studentId: "",
    studentFeeId: "",
    amount: "",
    method: "cash",
  });

  /* ================= LOAD PAYMENTS ================= */

  const loadPayments = async () => {
    try {
      setLoading(true);

      const res = await api.get("/finance/fees/payments");

      setPayments(res.data?.data || []);
    } catch (err) {
      console.error("PAYMENTS LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD CLASSES ================= */

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);

      const res = await api.get("/classes");

      setClasses(res.data?.data || []);
    } catch (err) {
      console.error("CLASSES LOAD ERROR:", err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  /* ================= LOAD STUDENTS BY CLASS ================= */

  const loadStudentsByClass = async (classId: string) => {
    try {
      if (!classId) {
        setStudents([]);
        return;
      }

      setLoadingStudents(true);

      /*
       * Your students API supports classIds filtering.
       * We send one selected class as a single classIds value.
       */
      const res = await api.get("/students", {
        params: {
          classIds: classId,
        },
      });

      setStudents(res.data?.data || []);
    } catch (err) {
      console.error("STUDENTS LOAD ERROR:", err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  /* ================= LOAD STUDENT FEES ================= */

  const loadStudentFees = async (studentId: string) => {
    try {
      if (!studentId) {
        setStudentFees([]);
        return;
      }

      setLoadingFees(true);

      const res = await api.get(
        `/finance/fees/student-fees?studentId=${studentId}`
      );

      const fees = res.data?.data || [];

      setStudentFees(
        fees.filter((fee: any) => fee.status !== "paid")
      );
    } catch (err) {
      console.error("STUDENT FEES LOAD ERROR:", err);
      setStudentFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  /* ================= INIT ================= */

  useEffect(() => {
    loadPayments();
    loadClasses();
  }, []);

  /* ================= CLASS CHANGED ================= */

  useEffect(() => {
    if (!form.classId) {
      setStudents([]);

      setForm((prev) => ({
        ...prev,
        studentId: "",
        studentFeeId: "",
        amount: "",
      }));

      setStudentFees([]);

      return;
    }

    setForm((prev) => ({
      ...prev,
      studentId: "",
      studentFeeId: "",
      amount: "",
    }));

    setStudentFees([]);

    loadStudentsByClass(form.classId);
  }, [form.classId]);

  /* ================= STUDENT CHANGED ================= */

  useEffect(() => {
    if (!form.studentId) {
      setStudentFees([]);

      setForm((prev) => ({
        ...prev,
        studentFeeId: "",
        amount: "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      studentFeeId: "",
      amount: "",
    }));

    loadStudentFees(form.studentId);
  }, [form.studentId]);

  /* ================= SELECTED FEE ================= */

  const selectedFee = useMemo(() => {
    return studentFees.find(
      (fee: any) => fee._id === form.studentFeeId
    );
  }, [studentFees, form.studentFeeId]);

  /* ================= SUBMIT PAYMENT ================= */

  const submitPayment = async () => {
    try {
      if (!form.classId) {
        return alert("Select class");
      }

      if (!form.studentId) {
        return alert("Select student");
      }

      if (!form.studentFeeId) {
        return alert("Select fee");
      }

      const amountNum = Number(form.amount);

      if (!amountNum || amountNum <= 0) {
        return alert("Enter valid amount");
      }

      if (
        selectedFee &&
        amountNum > Number(selectedFee.balance || 0)
      ) {
        return alert("Amount exceeds balance");
      }

      setSaving(true);

      await api.post(
        "/finance/fees/payments/manual",
        {
          studentId: form.studentId,
          studentFeeId: form.studentFeeId,
          amount: amountNum,
          method: form.method,
        }
      );

      setForm({
        classId: "",
        studentId: "",
        studentFeeId: "",
        amount: "",
        method: "cash",
      });

      setStudents([]);
      setStudentFees([]);

      await Promise.all([
        loadPayments(),
      ]);

      alert("Payment recorded successfully");
    } catch (err: any) {
      console.error("PAYMENT ERROR:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to record payment"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================= CANCEL PAYMENT ================= */

  const cancelPayment = async (id: string) => {
    try {
      await api.patch(
        `/finance/fees/payments/${id}/cancel`
      );

      await loadPayments();

      alert("Payment cancelled");
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Cancel failed"
      );
    }
  };

  /* ================= VIEW RECEIPT ================= */

  const viewReceipt = async (paymentId: string) => {
    try {
      setReceiptLoading(true);

      const res = await api.get(
        `/receipts/payment/${paymentId}`
      );

      setReceiptData(
        res.data?.data || null
      );
    } catch (err) {
      console.error(err);

      alert("Failed to load receipt");
    } finally {
      setReceiptLoading(false);
    }
  };

  /* ================= DOWNLOAD RECEIPT ================= */

  const downloadReceipt = async (
    paymentId: string
  ) => {
    try {
      const res = await api.get(
        `/receipts/download/${paymentId}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `receipt-${paymentId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      alert("Download failed");
    }
  };

  /* ================= PRINT RECEIPT ================= */

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-6 text-white">

      {/* HEADER */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Payments
          </h1>

          <p className="text-slate-400 text-sm">
            Manage school fee payments
          </p>
        </div>

        <button
          onClick={() => {
            loadPayments();
            loadClasses();

            if (form.classId) {
              loadStudentsByClass(form.classId);
            }

            if (form.studentId) {
              loadStudentFees(form.studentId);
            }
          }}
          className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20"
        >
          <RefreshCcw size={16} />

          Refresh
        </button>
      </div>

      {/* STATS */}

      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-white/5 p-5 rounded-xl">
          <Wallet className="text-green-400 mb-2" />

          <p className="text-slate-400">
            Total Payments
          </p>

          <h2 className="text-2xl font-bold">
            {payments.length}
          </h2>
        </div>

        <div className="bg-white/5 p-5 rounded-xl">
          <Receipt className="text-blue-400 mb-2" />

          <p className="text-slate-400">
            Open Fees
          </p>

          <h2 className="text-2xl font-bold">
            {studentFees.length}
          </h2>
        </div>

        <div className="bg-white/5 p-5 rounded-xl">
          <Users className="text-yellow-400 mb-2" />

          <p className="text-slate-400">
            Students in Selected Class
          </p>

          <h2 className="text-2xl font-bold">
            {students.length}
          </h2>
        </div>

      </div>

      {/* PAYMENT FORM */}

      <div className="bg-white/5 p-5 rounded-xl space-y-4">

        <div>
          <h2 className="text-xl font-semibold">
            Record Payment
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Select the class first, then choose the student
            and their fee to avoid recording payment against
            the wrong student.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          {/* CLASS */}

          <div className="space-y-2">

            <label className="text-sm text-slate-300">
              Class
            </label>

            <div className="relative">

              <GraduationCap
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={form.classId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    classId: e.target.value,
                  }))
                }
                disabled={loadingClasses}
                className="w-full p-3 pl-10 bg-black/30 rounded-xl border border-white/10"
              >

                <option value="">
                  {loadingClasses
                    ? "Loading classes..."
                    : "Select Class"}
                </option>

                {classes.map((c: any) => (
                  <option
                    key={c._id}
                    value={c._id}
                  >
                    {c.name}
                  </option>
                ))}

              </select>

            </div>

          </div>

          {/* STUDENT */}

          <div className="space-y-2">

            <label className="text-sm text-slate-300">
              Student
            </label>

            <select
              value={form.studentId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  studentId: e.target.value,
                }))
              }
              disabled={
                !form.classId ||
                loadingStudents
              }
              className="w-full p-3 bg-black/30 rounded-xl border border-white/10 disabled:opacity-50"
            >

              <option value="">
                {!form.classId
                  ? "Select class first"
                  : loadingStudents
                  ? "Loading students..."
                  : students.length === 0
                  ? "No students in this class"
                  : "Select Student"}
              </option>

              {students.map((s: any) => (
                <option
                  key={s._id}
                  value={s._id}
                >
                  {s.firstName}{" "}
                  {s.middleName
                    ? `${s.middleName} `
                    : ""}
                  {s.lastName}
                  {s.admissionNumber
                    ? ` • ${s.admissionNumber}`
                    : ""}
                </option>
              ))}

            </select>

          </div>

          {/* FEE */}

          <div className="space-y-2">

            <label className="text-sm text-slate-300">
              Fee
            </label>

            <select
              value={form.studentFeeId}
              onChange={(e) => {
                const id = e.target.value;

                const fee =
                  studentFees.find(
                    (f: any) =>
                      f._id === id
                  );

                setForm((prev) => ({
                  ...prev,
                  studentFeeId: id,
                  amount: fee
                    ? String(
                        fee.balance || 0
                      )
                    : "",
                }));
              }}
              disabled={
                !form.studentId ||
                loadingFees
              }
              className="w-full p-3 bg-black/30 rounded-xl border border-white/10 disabled:opacity-50"
            >

              <option value="">
                {!form.studentId
                  ? "Select student first"
                  : loadingFees
                  ? "Loading fees..."
                  : studentFees.length === 0
                  ? "No outstanding fees"
                  : "Select Fee"}
              </option>

              {studentFees.map(
                (f: any) => (
                  <option
                    key={f._id}
                    value={f._id}
                  >
                    {f.title} •{" "}
                    {formatCurrency(
                      f.balance
                    )}{" "}
                    • {f.status}
                  </option>
                )
              )}

            </select>

          </div>

          {/* AMOUNT */}

          <div className="space-y-2">

            <label className="text-sm text-slate-300">
              Amount
            </label>

            <input
              type="number"
              min="0"
              max={
                selectedFee
                  ? Number(
                      selectedFee.balance || 0
                    )
                  : undefined
              }
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  amount:
                    e.target.value,
                }))
              }
              disabled={!form.studentFeeId}
              className="w-full p-3 bg-black/30 rounded-xl border border-white/10 disabled:opacity-50"
              placeholder="Amount"
            />

          </div>

          {/* METHOD */}

          <div className="space-y-2 md:col-span-2">

            <label className="text-sm text-slate-300">
              Payment Method
            </label>

            <select
              value={form.method}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  method:
                    e.target.value,
                }))
              }
              className="w-full p-3 bg-black/30 rounded-xl border border-white/10"
            >

              <option value="cash">
                Cash
              </option>

              <option value="bank_transfer">
                Bank Transfer
              </option>

              <option value="pos">
                POS
              </option>

              <option value="paystack">
                Paystack
              </option>

            </select>

          </div>

        </div>

        {/* SELECTED FEE */}

        {selectedFee && (
          <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">

            <p className="font-semibold">
              {selectedFee.title}
            </p>

            <div className="grid md:grid-cols-3 gap-3 mt-3">

              <div>
                <p className="text-slate-400 text-sm">
                  Total
                </p>

                <p>
                  {formatCurrency(
                    selectedFee.totalAmount
                  )}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Paid
                </p>

                <p>
                  {formatCurrency(
                    selectedFee.amountPaid
                  )}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Balance
                </p>

                <p className="text-yellow-400">
                  {formatCurrency(
                    selectedFee.balance
                  )}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* RECORD PAYMENT */}

        <button
          onClick={submitPayment}
          disabled={
            saving ||
            !form.classId ||
            !form.studentId ||
            !form.studentFeeId
          }
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >

          {saving ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Processing...
            </>
          ) : (
            "Record Payment"
          )}

        </button>

      </div>

      {/* PAYMENT HISTORY */}

      <div className="bg-white/5 rounded-xl overflow-hidden">

        <div className="p-4 border-b border-white/10">

          <h2 className="text-xl font-semibold">
            Payment History
          </h2>

        </div>

        {loading ? (
          <p className="p-4">
            Loading...
          </p>
        ) : payments.length === 0 ? (
          <p className="p-4 text-slate-400">
            No payments found
          </p>
        ) : (
          payments.map((p) => (
            <div
              key={p._id}
              className="p-4 border-b border-white/10 space-y-2"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div className="space-y-1">

                  <p className="font-bold text-lg">
                    {formatCurrency(
                      p.amount
                    )}
                  </p>

                  <p
                    className={getStatusColor(
                      p.status
                    )}
                  >
                    {p.status}
                  </p>

                  <p className="text-sm text-slate-400">
                    Method:{" "}
                    {p.method ||
                      p.paymentMethod}
                  </p>

                  <p className="text-sm text-slate-400">
                    Ref: {p.reference}
                  </p>

                  <p className="text-sm">
                    Student:{" "}
                    {p.studentName ||
                      "Unknown Student"}
                  </p>

                  <p className="text-sm">
                    Balance:{" "}
                    {formatCurrency(
                      p.feeBalance || 0
                    )}
                  </p>

                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={() =>
                      viewReceipt(p._id)
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  >
                    <Receipt size={16} />
                    View
                  </button>

                  <button
                    onClick={() =>
                      downloadReceipt(
                        p._id
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700"
                  >
                    <Download size={16} />
                    Download
                  </button>

                  {p.status !==
                    "cancelled" && (
                    <button
                      onClick={() =>
                        cancelPayment(
                          p._id
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                  )}

                </div>

              </div>

            </div>
          ))
        )}

      </div>

      {/* RECEIPT MODAL */}

      {receiptData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 no-print">

          <div className="bg-white text-black w-full max-w-md rounded-xl shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="text-center border-b p-4">

              <h1 className="text-lg font-bold uppercase tracking-wide">
                School Payment Receipt
              </h1>

              <p className="text-xs text-gray-500">
                Official Transaction Record
              </p>

            </div>

            {/* RECEIPT BODY */}

            {receiptLoading ? (
              <p className="p-6 text-center">
                Loading receipt...
              </p>
            ) : (
              <div
                id="print-receipt"
                className="p-6 text-sm space-y-3"
                style={{
                  fontFamily:
                    "monospace",
                }}
              >

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Receipt No
                  </span>

                  <span className="font-semibold">
                    {
                      receiptData.receiptNumber
                    }
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Student
                  </span>

                  <span>
                    {
                      receiptData.student
                        ?.firstName
                    }{" "}
                    {
                      receiptData.student
                        ?.lastName
                    }
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Admission No
                  </span>

                  <span>
                    {
                      receiptData.student
                        ?.admissionNumber
                    }
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Fee
                  </span>

                  <span>
                    {
                      receiptData.fee
                        ?.title
                    }
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Amount Paid
                  </span>

                  <span className="font-bold text-green-700">
                    {formatCurrency(
                      receiptData.amount
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Payment Method
                  </span>

                  <span>
                    {
                      receiptData.method
                    }
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>
                    Status
                  </span>

                  <span>
                    {
                      receiptData.payment
                        ?.status
                    }
                  </span>
                </div>

                <div className="flex justify-between pb-2">
                  <span>
                    Date
                  </span>

                  <span>
                    {new Date(
                      receiptData.createdAt
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="text-center pt-4 mt-4 border-t text-xs text-gray-500">
                  Thank you for your payment
                  <br />
                  Powered by School ERP System
                </div>

              </div>
            )}

            {/* ACTIONS */}

            <div className="flex gap-3 p-4 border-t no-print">

              <button
                onClick={() =>
                  downloadReceipt(
                    receiptData.payment?._id
                  )
                }
                className="bg-green-600 text-white px-3 py-2 rounded w-full text-sm"
              >
                Download PDF
              </button>

              <button
                onClick={printReceipt}
                className="bg-blue-600 text-white px-3 py-2 rounded w-full text-sm"
              >
                Print
              </button>

              <button
                onClick={() =>
                  setReceiptData(null)
                }
                className="bg-slate-600 text-white px-3 py-2 rounded"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
