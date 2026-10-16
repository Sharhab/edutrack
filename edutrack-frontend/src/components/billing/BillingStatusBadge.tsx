
import type { BillingStatus } from "../../types/billing";

type BillingStatusBadgeProps = {
  status: BillingStatus;
};

const styles: Record<BillingStatus, string> = {
  active: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  trial: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
  pending: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  past_due: "border-orange-400/20 bg-orange-500/10 text-orange-300",
  expired: "border-red-400/20 bg-red-500/10 text-red-300",
  cancelled: "border-white/10 bg-white/5 text-slate-300",
  suspended: "border-slate-400/20 bg-slate-500/10 text-slate-300",
};

export default function BillingStatusBadge({
  status,
}: BillingStatusBadgeProps) {
  return (
    <span
      role="status"
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        styles[status]
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
