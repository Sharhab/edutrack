"use client";

type Props = {
  title: string;
  price: string;
  description: string;
  features: string[];
  active: boolean;
  onClick: () => void;
};

export default function PlanSelectCard({
  title,
  price,
  description,
  features,
  active,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-2xl border p-5 transition hover:scale-[1.01] active:scale-[0.99] ${
        active
          ? "border-cyan-400 bg-white/5 shadow-md shadow-cyan-500/10"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* TITLE */}
      <h3 className="text-lg font-bold text-white">{title}</h3>

      {/* DESCRIPTION */}
      <p className="text-sm text-slate-400">{description}</p>

      {/* PRICE */}
      <p className="mt-2 font-semibold text-white">{price}</p>

      {/* FEATURES */}
      <ul className="mt-3 space-y-1 text-sm text-slate-300">
        {features?.map((f, i) => (
          <li key={i}>• {f}</li>
        ))}
      </ul>
    </div>
  );
}