"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../../lib/axios";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const reference =
    searchParams.get("reference") || searchParams.get("trxref");

  const schoolId = searchParams.get("schoolId");

  const [status, setStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");

  const [message, setMessage] = useState(
    "Verifying your payment..."
  );

  useEffect(() => {
    if (!reference || !schoolId) {
      setStatus("error");
      setMessage(
        !reference
          ? "Payment reference was not provided."
          : "School information was not provided. Please contact your school administrator."
      );
      return;
    }

    let cancelled = false;

    const verifyPayment = async () => {
      try {
        const response = await api.get(
          `/finance/paystack/verify/${encodeURIComponent(reference)}`,
          {
            params: { schoolId },
          }
        );

        if (cancelled) return;

        if (response.data?.success) {
          setStatus("success");
          setMessage(
            response.data?.data?.message ||
              "Payment verified successfully."
          );
        } else {
          setStatus("error");
          setMessage(
            response.data?.message ||
              "Payment verification failed."
          );
        }
      } catch (error: any) {
        if (cancelled) return;

        console.error(
          "PAYMENT VERIFICATION ERROR:",
          error?.response?.data || error?.message || error
        );

        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "We could not verify this payment. Please contact your school administrator."
        );
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference, schoolId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-cyan-600" />

            <h1 className="text-xl font-semibold text-gray-900">
              Verifying Payment
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Please wait while we confirm your transaction.
            </p>
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
              {message}
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

            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </>
        )}

        {reference && (
          <div className="mt-6 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">
              Payment Reference
            </p>

            <p className="mt-1 break-all text-xs text-gray-700">
              {reference}
            </p>
          </div>
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
          <p className="text-gray-600">
            Loading payment details...
          </p>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
