"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import api from "../../../../../lib/axios";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function formatCurrency(v: number) {
  return `₦${Number(v || 0).toLocaleString()}`;
}

export default function NewManualPaymentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);

  const [form, setForm] = useState({
    studentId: "",
    studentFeeId: "",
    amount: "",
    method: "cash",
  });

  /* ================= LOAD STUDENTS ================= */
  const loadStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data?.data || []);
    } catch (err) {
      console.error("Students load error:", err);
    }
  };

  /* ================= LOAD STUDENT FEES ================= */
  const loadStudentFees = async (studentId: string) => {
    try {
      if (!studentId) return;

      const res = await api.get(
        `/finance/fees/student-fees?studentId=${studentId}`
      );

      setStudentFees(res.data?.data || []);
    } catch (err) {
      console.error("Student fees load error:", err);
      setStudentFees([]);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (form.studentId) {
      loadStudentFees(form.studentId);
      setForm((p) => ({ ...p, studentFeeId: "", amount: "" }));
    }
  }, [form.studentId]);

  /* ================= SELECTED FEE ================= */
  const selectedFee = useMemo(() => {
    return studentFees.find(
      (fee: any) => fee._id === form.studentFeeId
    );
  }, [studentFees, form.studentFeeId]);

  const balance = useMemo(() => {
    if (!selectedFee) return 0;
    return Math.max(
      (selectedFee.totalAmount || 0) - (selectedFee.amountPaid || 0),
      0
    );
  }, [selectedFee]);

  /* ================= SUBMIT ================= */
  const submit = async () => {
    try {
      if (!form.studentId) return alert("Select student");
      if (!form.studentFeeId) return alert("Select fee");

      const amountNum = Number(form.amount);

      if (!amountNum || amountNum <= 0) {
        return alert("Enter valid amount");
      }

      if (amountNum > balance) {
        return alert("Amount exceeds remaining balance");
      }

      setLoading(true);

      await api.post("/finance/fees/payments/manual", {
        studentId: form.studentId,
        studentFeeId: form.studentFeeId,
        amount: amountNum,
        method: form.method,
      });

      alert("Payment recorded successfully");
      router.push("/school-admin/payments");

    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Record Manual Payment</h1>
          <p className="text-sm text-slate-400">
            Pay using student fee ledger
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* FORM */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

        <div className="grid gap-4 md:grid-cols-2">

          {/* STUDENT */}
          <select
            value={form.studentId}
            onChange={(e) =>
              setForm({
                studentId: e.target.value,
                studentFeeId: "",
                amount: "",
                method: form.method,
              })
            }
            className="p-3 rounded-xl bg-black/30 border border-white/10"
          >
            <option value="">Select Student</option>
            {students.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>

          {/* FEES */}
          <select
            value={form.studentFeeId}
            onChange={(e) => {
              const fee = studentFees.find(
                (f: any) => f._id === e.target.value
              );

              const bal =
                (fee?.totalAmount || 0) - (fee?.amountPaid || 0);

              setForm({
                ...form,
                studentFeeId: e.target.value,
                amount: String(bal),
              });
            }}
            className="p-3 rounded-xl bg-black/30 border border-white/10"
          >
            <option value="">Select Fee</option>

            {studentFees.map((fee: any) => {
              const bal =
                (fee.totalAmount || 0) - (fee.amountPaid || 0);

              return (
                <option key={fee._id} value={fee._id}>
                  {fee.title} • {formatCurrency(bal)}
                </option>
              );
            })}
          </select>

          {/* AMOUNT */}
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
            className="p-3 rounded-xl bg-black/30 border border-white/10"
            placeholder="Amount"
          />

          {/* METHOD */}
          <select
            value={form.method}
            onChange={(e) =>
              setForm({ ...form, method: e.target.value })
            }
            className="p-3 rounded-xl bg-black/30 border border-white/10"
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="pos">POS</option>
            <option value="paystack">Paystack</option>
          </select>

        </div>

        {/* SUMMARY */}
        {selectedFee && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p>Fee: {selectedFee.title}</p>
            <p>Total: {formatCurrency(selectedFee.totalAmount)}</p>
            <p>Paid: {formatCurrency(selectedFee.amountPaid)}</p>
            <p>Balance: {formatCurrency(balance)}</p>
          </div>
        )}

        {/* SUBMIT */}
        <button
          onClick={submit}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 py-3 rounded-xl flex justify-center"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={18} />
              Record Payment
            </>
          )}
        </button>

      </div>
    </div>
  );
}