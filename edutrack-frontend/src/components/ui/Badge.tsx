import { cn } from "../../lib/utils";

type BadgeProps = {
  label: string;
  variant?: "success" | "neutral" | "warning";
};

export default function Badge({
  label,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        variant === "success" &&
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        variant === "warning" &&
          "border-amber-400/20 bg-amber-500/10 text-amber-300",
        variant === "neutral" &&
          "border-white/10 bg-white/5 text-slate-300"
      )}
    >
      {label}
    </span>
  );
}