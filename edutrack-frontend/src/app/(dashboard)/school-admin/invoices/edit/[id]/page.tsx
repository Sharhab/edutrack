"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../../../lib/axios";

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState("");

  const updateInvoice = async () => {
    try {
      await api.patch(`/finance/invoices/${id}`, {
        status,
      });

      alert("Updated");
      router.push(`/school-admin/invoices/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  return (
    <div className="text-white space-y-4">

      <h1 className="text-xl font-bold">Update Invoice</h1>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="p-2 bg-black/30 rounded"
      >
        <option value="">Select status</option>
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </select>

      <button
        onClick={updateInvoice}
        className="bg-cyan-500 text-black px-4 py-2 rounded"
      >
        Update
      </button>
    </div>
  );
}