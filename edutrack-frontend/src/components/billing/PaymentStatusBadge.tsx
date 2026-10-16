

import type { PaymentStatus } from "../../types/billing";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
};

const statusStyles: Record<PaymentStatus, string> = {
  pending:
    "border-amber-400/20 bg-amber-500/10 text-amber-300",

  processing:
    "border-blue-400/20 bg-blue-500/10 text-blue-300",

  success:
    "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",

  failed:
    "border-red-400/20 bg-red-500/10 text-red-300",

  abandoned:
    "border-slate-400/20 bg-slate-500/10 text-slate-300",

  refunded:
    "border-purple-400/20 bg-purple-500/10 text-purple-300",
};

export default function PaymentStatusBadge({
  status,
}: PaymentStatusBadgeProps) {
  return (
    <span
      role="status"
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        statusStyles[status]
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
