import { PaymentStatus } from "../../types/billing";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
};

export default function PaymentStatusBadge({
  status,
}: PaymentStatusBadgeProps) {
  const styles: Record<PaymentStatus, string> = {
    paid: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    pending: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    failed: "border-red-400/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}