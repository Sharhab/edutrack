import { VerifyPaystackResponse } from "../../types/paystack";
import { formatDate } from "../../lib/utils";

type PaymentResultCardProps = {
  data: VerifyPaystackResponse;
};

export default function PaymentResultCard({
  data,
}: PaymentResultCardProps) {
  const payment = data.payment;
const subscription = data.subscription;
const school = data.school;
  return (
    <div className="card max-w-3xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          {data.success ? "Payment Verified" : "Payment Not Verified"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {data.message || "Payment verification result."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            School
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {school?.schoolName || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Tenant Status
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-white">
            {school?.status || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Reference
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {payment?.reference || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Payment Status
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-white">
            {payment?.status || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Amount
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {payment?.amount !== undefined
              ? `₦${Number(payment.amount).toLocaleString()}`
              : "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Paid At
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatDate(payment?.paidAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Plan
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-white">
            {subscription?.plan || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Billing Cycle
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-white">
            {subscription?.billingCycle || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Next Renewal
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatDate(subscription?.nextRenewalDate)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Expiry Date
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatDate(subscription?.expiryDate)}
          </p>
        </div>
      </div>
    </div>
  );
}