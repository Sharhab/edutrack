"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/axios";

export default function ManualPaymentModal({
  onClose,
  onSuccess,
}: any) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  const [loadingClasses, setLoadingClasses] =
    useState(false);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [loadingFees, setLoadingFees] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    classId: "",
    studentId: "",
    studentFeeId: "",
    amount: "",
    method: "cash",
    note: "",
  });

  /* =========================
     LOAD CLASSES
  ========================= */

  async function loadClasses() {
    try {
      setLoadingClasses(true);

      const res = await api.get("/classes");

      setClasses(res.data?.data || []);
    } catch (err) {
      console.error(
        "LOAD CLASSES ERROR:",
        err
      );

      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }

  /* =========================
     LOAD STUDENTS BY CLASS
  ========================= */

  async function loadStudents(classId: string) {
    try {
      if (!classId) {
        setStudents([]);
        return;
      }

      setLoadingStudents(true);

      const res = await api.get("/students", {
        params: {
          classIds: classId,
        },
      });

      setStudents(
        res.data?.data || []
      );
    } catch (err) {
      console.error(
        "LOAD STUDENTS ERROR:",
        err
      );

      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  /* =========================
     LOAD STUDENT FEES
  ========================= */

  async function loadStudentFees(
    studentId: string
  ) {
    try {
      if (!studentId) {
        setFees([]);
        return;
      }

      setLoadingFees(true);

      const res = await api.get(
        `/finance/fees/student-fees?studentId=${studentId}`
      );

      const data =
        res.data?.data || [];

      // Only show unpaid / outstanding fees
      setFees(
        data.filter(
          (fee: any) =>
            fee.status !== "paid" &&
            Number(fee.balance || 0) > 0
        )
      );
    } catch (err) {
      console.error(
        "LOAD STUDENT FEES ERROR:",
        err
      );

      setFees([]);
    } finally {
      setLoadingFees(false);
    }
  }

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadClasses();
  }, []);

  /* =========================
     CLASS CHANGE
  ========================= */

  async function handleClassChange(
    classId: string
  ) {
    setForm((prev) => ({
      ...prev,
      classId,
      studentId: "",
      studentFeeId: "",
      amount: "",
    }));

    setFees([]);

    await loadStudents(classId);
  }

  /* =========================
     STUDENT CHANGE
  ========================= */

  async function handleStudentChange(
    studentId: string
  ) {
    setForm((prev) => ({
      ...prev,
      studentId,
      studentFeeId: "",
      amount: "",
    }));

    await loadStudentFees(studentId);
  }

  /* =========================
     FEE CHANGE
  ========================= */

  function handleFeeChange(
    studentFeeId: string
  ) {
    const selectedFee = fees.find(
      (fee: any) =>
        fee._id === studentFeeId
    );

    setForm((prev) => ({
      ...prev,
      studentFeeId,
      amount: selectedFee
        ? String(
            selectedFee.balance || 0
          )
        : "",
    }));
  }

  /* =========================
     SUBMIT
  ========================= */

  async function submit() {
    try {
      if (!form.classId) {
        return alert(
          "Please select a class"
        );
      }

      if (!form.studentId) {
        return alert(
          "Please select a student"
        );
      }

      if (!form.studentFeeId) {
        return alert(
          "Please select a fee"
        );
      }

      const amount = Number(
        form.amount
      );

      if (!amount || amount <= 0) {
        return alert(
          "Please enter a valid amount"
        );
      }

      const selectedFee = fees.find(
        (fee: any) =>
          fee._id ===
          form.studentFeeId
      );

      if (
        selectedFee &&
        amount >
          Number(
            selectedFee.balance || 0
          )
      ) {
        return alert(
          "Amount exceeds the remaining balance"
        );
      }

      setLoading(true);

      await api.post(
        "/finance/fees/payments/manual",
        {
          studentId:
            form.studentId,

          studentFeeId:
            form.studentFeeId,

          amount,

          method:
            form.method,

          note:
            form.note.trim(),
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
          <h2 className="text-white font-semibold text-lg">
            Record Manual Payment
          </h2>

          <p className="text-slate-400 text-sm mt-1">
            Select the class first, then the
            student and their outstanding fee.
          </p>
        </div>

        {/* CLASS */}

        <div className="space-y-1">

          <label className="text-sm text-slate-300">
            Class
          </label>

          <select
            value={form.classId}
            disabled={loadingClasses}
            onChange={(e) =>
              handleClassChange(
                e.target.value
              )
            }
            className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10 outline-none disabled:opacity-50"
          >

            <option
              value=""
              className="bg-[#0f172a]"
            >
              {loadingClasses
                ? "Loading classes..."
                : "Select Class"}
            </option>

            {classes.map(
              (classItem: any) => (
                <option
                  key={classItem._id}
                  value={classItem._id}
                  className="bg-[#0f172a]"
                >
                  {classItem.name}
                </option>
              )
            )}

          </select>

        </div>

        {/* STUDENT */}

        <div className="space-y-1">

          <label className="text-sm text-slate-300">
            Student
          </label>

          <select
            value={form.studentId}
            disabled={
              !form.classId ||
              loadingStudents
            }
            onChange={(e) =>
              handleStudentChange(
                e.target.value
              )
            }
            className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10 outline-none disabled:opacity-50"
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

            {students.map(
              (student: any) => (
                <option
                  key={student._id}
                  value={student._id}
                  className="bg-[#0f172a]"
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

        {/* FEE */}

        <div className="space-y-1">

          <label className="text-sm text-slate-300">
            Fee
          </label>

          <select
            value={form.studentFeeId}
            disabled={
              !form.studentId ||
              loadingFees
            }
            onChange={(e) =>
              handleFeeChange(
                e.target.value
              )
            }
            className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10 outline-none disabled:opacity-50"
          >

            <option
              value=""
              className="bg-[#0f172a]"
            >
              {!form.studentId
                ? "Select student first"
                : loadingFees
                ? "Loading fees..."
                : fees.length === 0
                ? "No outstanding fees"
                : "Select Fee"}
            </option>

            {fees.map(
              (fee: any) => (
                <option
                  key={fee._id}
                  value={fee._id}
                  className="bg-[#0f172a]"
                >
                  {fee.title} • Balance ₦
                  {Number(
                    fee.balance || 0
                  ).toLocaleString()}
                </option>
              )
            )}

          </select>

        </div>

        {/* SELECTED FEE INFO */}

        {form.studentFeeId &&
          (() => {
            const fee = fees.find(
              (item: any) =>
                item._id ===
                form.studentFeeId
            );

            if (!fee) return null;

            return (
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3">

                <p className="text-white font-medium">
                  {fee.title}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">

                  <div>
                    <p className="text-slate-400">
                      Total
                    </p>

                    <p className="text-white">
                      ₦
                      {Number(
                        fee.totalAmount ||
                          0
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Paid
                    </p>

                    <p className="text-white">
                      ₦
                      {Number(
                        fee.amountPaid ||
                          0
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Balance
                    </p>

                    <p className="text-yellow-400 font-semibold">
                      ₦
                      {Number(
                        fee.balance || 0
                      ).toLocaleString()}
                    </p>
                  </div>

                </div>

              </div>
            );
          })()}

        {/* AMOUNT */}

        <div className="space-y-1">

          <label className="text-sm text-slate-300">
            Amount
          </label>

          <input
            type="number"
            min="1"
            value={form.amount}
            disabled={
              !form.studentFeeId
            }
            placeholder="Amount"
            className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10 outline-none disabled:opacity-50"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                amount:
                  e.target.value,
              }))
            }
          />

        </div>

        {/* PAYMENT METHOD */}

        <div className="space-y-1">

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
            className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10 outline-none"
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

            <option
              value="paystack"
              className="bg-[#0f172a]"
            >
              Paystack
            </option>

          </select>

        </div>

        {/* NOTE */}

        <textarea
          placeholder="Note (optional)"
          value={form.note}
          className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10 outline-none resize-none"
          rows={3}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              note: e.target.value,
            }))
          }
        />

        {/* BUTTONS */}

        <div className="flex justify-end gap-2 pt-2">

          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 px-4 py-2 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={
              loading ||
              !form.classId ||
              !form.studentId ||
              !form.studentFeeId
            }
            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
          >
            {loading
              ? "Saving..."
              : "Save Payment"}
          </button>

        </div>

      </div>
    </div>
  );
}
