"use client";

import { useEffect, useState } from "react";
import api from "../../../../../../lib/axios";

export default function ReceiptPage({ params }: any) {
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    api.get(`/payments/${params.id}`).then((res) => {
      setPayment(res.data.data);
    });
  }, []);

  if (!payment) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl">
      <h1 className="text-xl font-bold">Receipt</h1>

      <p>Reference: {payment.reference}</p>
      <p>Amount: ₦{payment.amount}</p>
      <p>Status: {payment.status}</p>

      <p className="mt-6 text-sm text-gray-500">
        Thank you for your payment
      </p>

      <button
        onClick={() => window.print()}
        className="mt-4 bg-black text-white px-4 py-2 rounded"
      >
        Print Receipt
      </button>
    </div>
  );
}