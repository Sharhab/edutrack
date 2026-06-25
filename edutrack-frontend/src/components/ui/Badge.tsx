import { cn } from "../../lib/utils";

type BadgeProps = {
  label: string;
  variant?: "success" | "neutral" | "warning" | "danger";
};

export default function Badge({
  label,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",

        // ================= SUCCESS =================
        variant === "success" &&
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",

        // ================= WARNING =================
        variant === "warning" &&
          "border-amber-400/20 bg-amber-500/10 text-amber-300",

        // ================= DANGER (NEW) =================
        variant === "danger" &&
          "border-red-400/20 bg-red-500/10 text-red-300",

        // ================= NEUTRAL =================
        variant === "neutral" &&
          "border-white/10 bg-white/5 text-slate-300"
      )}
    >
      {label}
    </span>
  );
}