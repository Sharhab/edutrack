"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Verifying payment...");
  const [schoolData, setSchoolData] = useState<any>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      setSuccess(false);
      setMessage("Payment reference missing");
      return;
    }

    verifyPayment();
  }, [reference]);

  async function verifyPayment() {
    try {
      console.log("🔍 VERIFYING:", reference);

      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await axios.get(
        `${baseURL}/api/onboarding/paystack/verify/${reference}`
      );

      console.log("🔍 VERIFY RESPONSE:", response.data);

      const data = response.data?.data; // ✅ FIXED

      const isSuccess =
        data?.status === "success" || data?.status === true;

      if (isSuccess) {
        setSuccess(true);

        setMessage(
          "Payment successful. Your school has been activated successfully."
        );

        setSchoolData(data);

        setTimeout(() => {
          router.push("/login");
        }, 5000);
      } else {
        setSuccess(false);

        setMessage(
          data?.gateway_response ||
            data?.message ||
            "Payment verification failed"
        );
      }
    } catch (error: any) {
      console.error("❌ VERIFY ERROR:", error);

      setSuccess(false);

      setMessage(
        error?.response?.data?.message ||
          "Unable to verify payment"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-lg">
        <div className="text-center">

          {loading ? (
            <>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-800">
                Verifying Payment
              </h1>
              <p className="text-gray-500 mt-3">Please wait...</p>
            </>
          ) : success ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>

              <h1 className="text-3xl font-bold text-green-600">
                Payment Successful
              </h1>

              <p className="text-gray-600 mt-4">{message}</p>

              {schoolData && (
                <div className="mt-6 bg-gray-50 rounded-xl p-5 text-left">
                  <div className="mb-3">
                    <span className="font-semibold">Reference:</span>
                    <div className="text-sm text-gray-600 break-all">
                      {schoolData.reference}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="font-semibold">Amount:</span>
                    <div>₦{Number(schoolData.amount) / 100}</div>
                  </div>

                  <div className="mb-3">
                    <span className="font-semibold">Email:</span>
                    <div>{schoolData.customer?.email}</div>
                  </div>

                  <div>
                    <span className="font-semibold">Status:</span>
                    <div className="text-green-600 font-semibold">
                      {schoolData.status}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  Continue to Login
                </Link>
              </div>

              <p className="text-sm text-gray-400 mt-4">
                Redirecting to login automatically...
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❌</span>
              </div>

              <h1 className="text-3xl font-bold text-red-600">
                Payment Failed
              </h1>

              <p className="text-gray-600 mt-4">{message}</p>

              <div className="mt-8 flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/onboarding")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  Try Again
                </button>

                <Link
                  href="/"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition"
                >
                  Home
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}