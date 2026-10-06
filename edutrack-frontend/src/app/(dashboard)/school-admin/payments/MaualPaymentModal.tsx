"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../lib/axios";

type ClassItem = {
  _id: string;
  name: string;
};

type StudentItem = {
  _id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  admissionNumber?: string;
  classId?: string;
};

type StudentFeeItem = {
  _id: string;
  studentId?: string | { _id?: string };
  feeStructureId?: string | { _id?: string };
  title?: string;
  name?: string;
  amount?: number;
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
  status?: string;
};

export default function ManualPaymentModal({
  onClose,
  onSuccess,
}: any) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFeeItem[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    classId: "",
    studentId: "",
    studentFeeId: "",
    amount: "",
    method: "cash",
    note: "",
  });

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
      setLoadingStudents(true);

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

  /* ================= LOAD FEES BY STUDENT ================= */

  const loadStudentFees = async (studentId: string) => {
    try {
      setLoadingFees(true);

      const res = await api.get(
        "/finance/fees/student-fees",
        {
          params: {
            studentId,
          },
        }
      );

      const fees = res.data?.data || [];

      setStudentFees(
        fees.filter(
          (fee: StudentFeeItem) =>
            fee.status !== "paid" &&
            Number(fee.balance || 0) > 0
        )
      );
    } catch (err) {
      console.error("STUDENT FEES LOAD ERROR:", err);
      setStudentFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    loadClasses();
  }, []);

  /* ================= CLASS CHANGED ================= */

  useEffect(() => {
    if (!form.classId) {
      setStudents([]);
      setStudentFees([]);

      setForm((prev) => ({
        ...prev,
        studentId: "",
        studentFeeId: "",
        amount: "",
      }));

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
      (fee) => fee._id === form.studentFeeId
    );
  }, [studentFees, form.studentFeeId]);

  /* ================= FEE BALANCE ================= */

  const feeBalance = Number(
    selectedFee?.balance || 0
  );

  /* ================= SUBMIT ================= */

  async function submit() {
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
        return alert("Enter a valid amount");
      }

      if (
        selectedFee &&
        amountNum > feeBalance
      ) {
        return alert(
          `Amount exceeds the remaining balance of ₦${feeBalance.toLocaleString()}`
        );
      }

      setLoading(true);

      await api.post(
        "/finance/fees/payments/manual",
        {
          studentId: form.studentId,
          studentFeeId: form.studentFeeId,
          amount: amountNum,
          method: form.method,
          note: form.note.trim(),
        }
      );

      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      console.error(
        "MANUAL PAYMENT ERROR:",
        err
      );

      alert(
        err?.response?.data?.message ||
          "Failed to record payment"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] rounded-2xl bg-[#0f172a] p-5 space-y-4 shadow-2xl">
        {/* HEADER */}

        <div>
          <h2 className="text-white text-lg font-semibold">
            Record Manual Payment
          </h2>

          <p className="text-slate-400 text-sm mt-1">
            Select the class first to avoid choosing
            the wrong student.
          </p>
        </div>

        {/* CLASS */}

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Class
          </label>

          <select
            value={form.classId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                classId: e.target.value,
              }))
            }
            disabled={loadingClasses || loading}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          >
            <option
              value=""
              className="bg-[#0f172a]"
            >
              {loadingClasses
                ? "Loading classes..."
                : "Select Class"}
            </option>

            {classes.map((classItem) => (
              <option
                key={classItem._id}
                value={classItem._id}
                className="bg-[#0f172a]"
              >
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        {/* STUDENT */}

        <div>
          <label className="block text-sm text-slate-300 mb-1">
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
              loadingStudents ||
              loading
            }
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          >
            <option
              value=""
              className="bg-[#0f172a]"
            >
              {!form.classId
                ? "Select class first"
                : loadingStudents
                ? "Loading students..."
                : students.length === 0
                ? "No students in this class"
                : "Select Student"}
            </option>

            {students.map((student) => {
              const fullName = [
                student.firstName,
                student.middleName,
                student.lastName,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <option
                  key={student._id}
                  value={student._id}
                  className="bg-[#0f172a]"
                >
                  {fullName ||
                    "Unnamed Student"}
                  {student.admissionNumber
                    ? ` — ${student.admissionNumber}`
                    : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* FEE */}

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Fee
          </label>

          <select
            value={form.studentFeeId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                studentFeeId: e.target.value,
              }))
            }
            disabled={
              !form.studentId ||
              loadingFees ||
              loading
            }
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          >
            <option
              value=""
              className="bg-[#0f172a]"
            >
              {!form.studentId
                ? "Select student first"
                : loadingFees
                ? "Loading fees..."
                : studentFees.length === 0
                ? "No outstanding fees"
                : "Select Fee"}
            </option>

            {studentFees.map((fee) => {
              const feeName =
                fee.title ||
                fee.name ||
                "School Fee";

              const balance = Number(
                fee.balance || 0
              );

              return (
                <option
                  key={fee._id}
                  value={fee._id}
                  className="bg-[#0f172a]"
                >
                  {feeName} — Balance ₦
                  {balance.toLocaleString()}
                </option>
              );
            })}
          </select>
        </div>

        {/* BALANCE */}

        {selectedFee && (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                Outstanding Balance
              </span>

              <span className="text-cyan-400 font-semibold">
                ₦{feeBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* AMOUNT */}

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Amount
          </label>

          <input
            placeholder="Enter amount"
            type="number"
            min="1"
            max={selectedFee ? feeBalance : undefined}
            value={form.amount}
            disabled={
              !form.studentFeeId || loading
            }
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                amount: e.target.value,
              }))
            }
          />
        </div>

        {/* METHOD */}

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Payment Method
          </label>

          <select
            value={form.method}
            disabled={loading}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                method: e.target.value,
              }))
            }
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none"
          >
            <option
              value="cash"
              className="bg-[#0f172a]"
            >
              Cash
            </option>

            <option
              value="bank_transfer"
              className="bg-[#0f172a]"
            >
              Bank Transfer
            </option>

            <option
              value="pos"
              className="bg-[#0f172a]"
            >
              POS
            </option>
          </select>
        </div>

        {/* NOTE */}

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Note
          </label>

          <textarea
            placeholder="Optional note"
            value={form.note}
            disabled={loading}
            rows={3}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none resize-none"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
          />
        </div>

        {/* BUTTONS */}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={
              loading ||
              !form.classId ||
              !form.studentId ||
              !form.studentFeeId
            }
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white font-medium"
          >
            {loading
              ? "Saving..."
              : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
