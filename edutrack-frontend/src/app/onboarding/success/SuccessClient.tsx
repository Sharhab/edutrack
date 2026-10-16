
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type PaymentState = "loading" | "success" | "failed";

export default function OnboardingSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref");

  const [state, setState] = useState<PaymentState>("loading");
  const [message, setMessage] = useState("Verifying your payment securely...");
  const [paymentInfo, setPaymentInfo] = useState<{
    reference?: string;
    amount?: number;
    customer?: { email?: string };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verifyPayment() {
      if (!reference) {
        setState("failed");
        setMessage(
          "No payment reference was returned. Your registration may already exist. You can return to continue with payment or choose the free trial."
        );
        return;
      }

      try {
        setState("loading");
        setMessage("Verifying your payment securely...");

        const baseURL =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://edutrack-dpui.onrender.com/api";

        const response = await fetch(
          `${baseURL}/onboarding/paystack/verify/${encodeURIComponent(reference)}`,
          { credentials: "include", cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Payment has not been confirmed."
          );
        }

        const data = result.data;
        const successful =
          data?.status === "success" ||
          data?.status === true;

        if (!successful) {
          throw new Error(
            "Payment has not been confirmed as successful."
          );
        }

        if (cancelled) return;

        setPaymentInfo({
          reference: data.reference || reference,
          amount: Number(data.amount) / 100,
          customer: data.customer,
        });

        setState("success");
        setMessage(
          "Your payment has been verified and your school subscription has been activated."
        );
      } catch (error: unknown) {
        if (cancelled) return;

        const err = error as { message?: string };

        setState("failed");
        setMessage(
          err.message ||
            "We could not confirm the payment yet. You can return to registration to retry or choose the free trial."
        );
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-xl sm:p-10">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <h1 className="text-2xl font-bold">Verifying Payment</h1>
            <p className="mt-4 text-slate-300">{message}</p>
            <p className="mt-3 text-sm text-slate-500">
              Please keep this page open while we verify the transaction.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
              ✓
            </div>

            <h1 className="text-3xl font-bold text-emerald-400">
              Payment Successful
            </h1>

            <p className="mt-4 text-slate-300">{message}</p>

            {paymentInfo && (
              <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-black/20 p-4 text-left text-sm">
                <p>
                  <span className="text-slate-400">Reference: </span>
                  {paymentInfo.reference}
                </p>

                {paymentInfo.amount !== undefined &&
                  Number.isFinite(paymentInfo.amount) && (
                    <p>
                      <span className="text-slate-400">Amount: </span>
                      ₦{paymentInfo.amount.toLocaleString("en-NG")}
                    </p>
                  )}

                {paymentInfo.customer?.email && (
                  <p>
                    <span className="text-slate-400">Email: </span>
                    {paymentInfo.customer.email}
                  </p>
                )}
              </div>
            )}

            <Link
              href="/login"
              className="mt-7 inline-flex w-full justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Continue to Login
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-3xl">
              !
            </div>

            <h1 className="text-2xl font-bold">
              Payment Not Completed
            </h1>

            <p className="mt-4 text-slate-300">{message}</p>

            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Return to Registration
              </button>

              <Link
                href="/login"
                className="inline-flex w-full justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5"
              >
                Go to Login
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              If your payment may have succeeded, check its status before
              making another payment. Use your existing administrator
              credentials when returning to registration.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
