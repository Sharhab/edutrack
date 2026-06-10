import { BillingStatus } from "../../types/billing";

type BillingStatusBadgeProps = {
  status: BillingStatus;
};

export default function BillingStatusBadge({
  status,
}: BillingStatusBadgeProps) {
  const styles: Record<BillingStatus, string> = {
    active: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    expired: "border-red-400/20 bg-red-500/10 text-red-300",
    pending: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    cancelled: "border-white/10 bg-white/5 text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}