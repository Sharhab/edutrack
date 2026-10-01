"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../../lib/axios";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Payment reference was not provided.");
      return;
    }

    const verifyPayment = async () => {
      try {
        await api.get(
          `/finance/paystack/verify/${encodeURIComponent(reference)}`
        );

        setStatus("success");
        setMessage("Payment verified successfully.");
      } catch (error: any) {
        console.error("PAYMENT VERIFICATION ERROR:", error);

        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "We could not verify this payment."
        );
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-cyan-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Verifying Payment
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Payment Successful
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your payment has been verified successfully.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              !
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Payment Verification Failed
            </h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </>
        )}

        {reference && (
          <p className="mt-6 break-all text-xs text-gray-400">
            Reference: {reference}
          </p>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
          <p className="text-gray-600">Loading payment details...</p>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
