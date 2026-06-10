"use client";

import { useState } from "react";
import api from "../../lib/axios";

export default function ManualPaymentModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    studentId: "",
    invoiceId: "",
    amount: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);

      await api.post("/payments/manual", {
        ...form,
        amount: Number(form.amount),
      });

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="w-[420px] rounded-2xl bg-[#0f172a] p-5 space-y-3">

        <h2 className="text-white font-semibold">
          Record Manual Payment
        </h2>

        <input
          placeholder="Student ID"
          className="w-full p-2 rounded bg-white/5 text-white"
          onChange={(e) =>
            setForm({ ...form, studentId: e.target.value })
          }
        />

        <input
          placeholder="Invoice ID"
          className="w-full p-2 rounded bg-white/5 text-white"
          onChange={(e) =>
            setForm({ ...form, invoiceId: e.target.value })
          }
        />

        <input
          placeholder="Amount"
          type="number"
          className="w-full p-2 rounded bg-white/5 text-white"
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        <textarea
          placeholder="Note"
          className="w-full p-2 rounded bg-white/5 text-white"
          onChange={(e) =>
            setForm({ ...form, note: e.target.value })
          }
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-slate-400">
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="bg-cyan-500 px-4 py-2 rounded text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}