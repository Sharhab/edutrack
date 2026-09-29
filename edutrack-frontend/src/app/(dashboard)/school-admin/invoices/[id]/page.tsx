"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../../../lib/axios";

function formatCurrency(v: number) {
  return `₦${Number(v || 0).toLocaleString()}`;
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadInvoice = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/finance/fees/invoices/${id}`
      );

      console.log("INVOICE DATA:", res.data);

      setInvoice(res.data?.data || null);
    } catch (err) {
      console.error(
        "INVOICE DETAIL ERROR:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-red-400">
        Invoice not found
      </div>
    );
  }

  const student = invoice.studentId;

  return (
    <div className="p-6 text-white space-y-6">

      {/* HEADER */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-bold">
          {invoice.title}
        </h1>

        <p className="text-gray-400 mt-2">
          Invoice ID: {invoice._id}
        </p>
      </div>

      {/* STUDENT */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-2">
        <h2 className="text-xl font-semibold">
          Student Information
        </h2>

        <p>
          Name:{" "}
          <span className="font-medium">
            {student?.firstName}{" "}
            {student?.lastName}
          </span>
        </p>

        <p>
          Admission No:{" "}
          {student?.admissionNumber || "-"}
        </p>

        <p>
          Class:{" "}
          {student?.classId?.name || "-"}
        </p>

        <p>
          Level:{" "}
          {student?.classId?.level || "-"}
        </p>
      </div>

      {/* PAYMENT SUMMARY */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-3">
        <h2 className="text-xl font-semibold">
          Payment Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-black/20 p-4 rounded-xl">
            <p className="text-sm text-gray-400">
              Total Amount
            </p>

            <p className="text-2xl font-bold">
              {formatCurrency(
                invoice.totalAmount
              )}
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl">
            <p className="text-sm text-gray-400">
              Amount Paid
            </p>

            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(
                invoice.amountPaid
              )}
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl">
            <p className="text-sm text-gray-400">
              Balance
            </p>

            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(invoice.balance)}
            </p>
          </div>

        </div>
      </div>

      {/* STATUS */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-2">
        <h2 className="text-xl font-semibold">
          Invoice Details
        </h2>

        <p>
          Status:{" "}
          <span className="uppercase font-medium">
            {invoice.status}
          </span>
        </p>

        <p>
          Type: {invoice.type}
        </p>

        <p>
          Session:{" "}
          {invoice.session || "Not assigned"}
        </p>

        <p>
          Term:{" "}
          {invoice.term || "Not assigned"}
        </p>

        <p>
          Created:
          {" "}
          {new Date(
            invoice.createdAt
          ).toLocaleString()}
        </p>
      </div>

      {/* PAYMENTS */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-4">
          Payment History
        </h2>

        {invoice.payments?.length ? (
          <div className="space-y-3">
            {invoice.payments.map(
              (p: any) => (
                <div
                  key={p._id}
                  className="bg-black/20 rounded-xl p-4"
                >
                  <p>
                    Amount:{" "}
                    {formatCurrency(
                      p.amount
                    )}
                  </p>

                  <p>
                    Method: {p.method}
                  </p>

                  <p>
                    Status: {p.status}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-gray-400">
            No payment records yet
          </p>
        )}
      </div>

    </div>
  );
}