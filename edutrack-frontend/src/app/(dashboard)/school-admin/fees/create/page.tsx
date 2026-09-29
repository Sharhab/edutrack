"use client";

import { useState } from "react";
import SectionCard from "../../../../../components/ui/SectionCard";
import api from "../../../../../lib/axios";

export default function CreateFeePage() {
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/fees/invoices/manual", {
        studentId: form.studentId,
        amount: Number(form.amount),
        description: form.description,
      });

      setMessage("Invoice created successfully");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Create Fee Invoice"
      subtitle="Manually generate student fee invoice"
    >
      <div className="space-y-4">

        <input
          placeholder="Student ID"
          className="w-full rounded-xl bg-white/5 p-3 text-white"
          value={form.studentId}
          onChange={(e) =>
            setForm({ ...form, studentId: e.target.value })
          }
        />

        <input
          placeholder="Amount"
          type="number"
          className="w-full rounded-xl bg-white/5 p-3 text-white"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        <input
          placeholder="Description"
          className="w-full rounded-xl bg-white/5 p-3 text-white"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button
          onClick={submit}
          disabled={loading}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-white"
        >
          {loading ? "Creating..." : "Create Invoice"}
        </button>

        {message && (
          <p className="text-sm text-slate-300">{message}</p>
        )}
      </div>
    </SectionCard>
  );
}