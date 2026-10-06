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

  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  const [form, setForm] = useState({
    classId: "",
    studentId: "",
    studentFeeId: "",
    amount: "",
    method: "cash",
  });

  /* ================= LOAD CLASSES ================= */

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);

      const res = await api.get("/classes");

      setClasses(res.data?.data || []);
    } catch (err) {
      console.error("Classes load error:", err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  /* ================= LOAD STUDENTS BY CLASS ================= */

  const loadStudents = async (classId: string) => {
    try {
      if (!classId) {
        setStudents([]);
        return;
      }

      setLoadingStudents(true);

      const res = await api.get("/students", {
        params: {
          classId,
        },
      });

      setStudents(res.data?.data || []);
    } catch (err) {
      console.error("Students load error:", err);
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

      setStudentFees(res.data?.data || []);
    } catch (err) {
      console.error("Student fees load error:", err);
      setStudentFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    loadClasses();
  }, []);

  /* ================= CLASS CHANGE ================= */

  useEffect(() => {
    if (!form.classId) {
      setStudents([]);
      setStudentFees([]);

      return;
    }

    setStudents([]);
    setStudentFees([]);

    setForm((prev) => ({
      ...prev,
      studentId: "",
      studentFeeId: "",
      amount: "",
    }));

    loadStudents(form.classId);
  }, [form.classId]);

  /* ================= STUDENT CHANGE ================= */

  useEffect(() => {
    if (!form.studentId) {
      setStudentFees([]);

      return;
    }

    setStudentFees([]);

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

  /* ================= BALANCE ================= */

  const balance = useMemo(() => {
    if (!selectedFee) return 0;

    return Math.max(
      Number(selectedFee.totalAmount || 0) -
        Number(selectedFee.amountPaid || 0),
      0
    );
  }, [selectedFee]);

  /* ================= SUBMIT ================= */

  const submit = async () => {
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

      if (amountNum > balance) {
        return alert("Amount exceeds remaining balance");
      }

      setLoading(true);

      await api.post(
        "/finance/fees/payments/manual",
        {
          studentId: form.studentId,
          studentFeeId: form.studentFeeId,
          amount: amountNum,
          method: form.method,
        }
      );

      alert("Payment recorded successfully");

      router.push(
        "/school-admin/payments"
      );
    } catch (err: any) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Failed to record payment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Record Manual Payment
          </h1>

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

          {/* ================= CLASS ================= */}

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Class
            </label>

            <select
              value={form.classId}
              disabled={loadingClasses}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  classId: e.target.value,
                  studentId: "",
                  studentFeeId: "",
                  amount: "",
                }));

                setStudents([]);
                setStudentFees([]);
              }}
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10"
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes..."
                  : "Select Class"}
              </option>

              {classes.map((cls: any) => (
                <option
                  key={cls._id}
                  value={cls._id}
                >
                  {cls.name}
                  {cls.level
                    ? ` • ${cls.level}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* ================= STUDENT ================= */}

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Student
            </label>

            <select
              value={form.studentId}
              disabled={
                !form.classId ||
                loadingStudents
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  studentId:
                    e.target.value,
                  studentFeeId: "",
                  amount: "",
                }))
              }
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10 disabled:opacity-50"
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

              {students.map(
                (student: any) => (
                  <option
                    key={student._id}
                    value={student._id}
                  >
                    {student.firstName}{" "}
                    {student.middleName
                      ? `${student.middleName} `
                      : ""}
                    {student.lastName}
                    {student.admissionNumber
                      ? ` • ${student.admissionNumber}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ================= FEES ================= */}

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Student Fee
            </label>

            <select
              value={form.studentFeeId}
              disabled={
                !form.studentId ||
                loadingFees
              }
              onChange={(e) => {
                const fee =
                  studentFees.find(
                    (f: any) =>
                      f._id ===
                      e.target.value
                  );

                const bal = Math.max(
                  Number(
                    fee?.totalAmount || 0
                  ) -
                    Number(
                      fee?.amountPaid || 0
                    ),
                  0
                );

                setForm((prev) => ({
                  ...prev,
                  studentFeeId:
                    e.target.value,
                  amount:
                    bal > 0
                      ? String(bal)
                      : "",
                }));
              }}
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10 disabled:opacity-50"
            >
              <option value="">
                {!form.studentId
                  ? "Select student first"
                  : loadingFees
                  ? "Loading fees..."
                  : studentFees.length ===
                    0
                  ? "No fees found"
                  : "Select Fee"}
              </option>

              {studentFees.map(
                (fee: any) => {
                  const bal = Math.max(
                    Number(
                      fee.totalAmount || 0
                    ) -
                      Number(
                        fee.amountPaid || 0
                      ),
                    0
                  );

                  return (
                    <option
                      key={fee._id}
                      value={fee._id}
                    >
                      {fee.title} • Balance{" "}
                      {formatCurrency(
                        bal
                      )}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {/* ================= AMOUNT ================= */}

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Amount
            </label>

            <input
              type="number"
              min="0"
              max={balance || undefined}
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  amount:
                    e.target.value,
                }))
              }
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10"
              placeholder="Amount"
              disabled={!form.studentFeeId}
            />
          </div>

          {/* ================= METHOD ================= */}

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Payment Method
            </label>

            <select
              value={form.method}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  method: e.target.value,
                }))
              }
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10"
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

        {/* ================= SELECTION INFORMATION ================= */}

        {form.classId && (
          <div className="mt-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-slate-300">
            <span className="font-medium text-blue-300">
              {students.length}
            </span>{" "}
            student
            {students.length === 1
              ? ""
              : "s"}{" "}
            available in the selected class.
          </div>
        )}

        {/* ================= SUMMARY ================= */}

        {selectedFee && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">

            <p>
              Fee:{" "}
              {selectedFee.title}
            </p>

            <p>
              Total:{" "}
              {formatCurrency(
                selectedFee.totalAmount
              )}
            </p>

            <p>
              Paid:{" "}
              {formatCurrency(
                selectedFee.amountPaid
              )}
            </p>

            <p>
              Balance:{" "}
              {formatCurrency(balance)}
            </p>

          </div>
        )}

        {/* ================= SUBMIT ================= */}

        <button
          onClick={submit}
          disabled={
            loading ||
            !form.classId ||
            !form.studentId ||
            !form.studentFeeId
          }
          className="mt-6 w-full bg-blue-600 py-3 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
