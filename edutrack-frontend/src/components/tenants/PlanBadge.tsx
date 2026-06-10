import { TenantPlan } from "../../types/tenant";

type PlanBadgeProps = {
  plan: TenantPlan;
};

export default function PlanBadge({ plan }: PlanBadgeProps) {
  const styles: Record<TenantPlan, string> = {
    starter: "border-white/10 bg-white/5 text-slate-300",
    standard: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
    premium: "border-violet-400/20 bg-violet-500/10 text-violet-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles[plan]}`}
    >
      {plan}
    </span>
  );
}