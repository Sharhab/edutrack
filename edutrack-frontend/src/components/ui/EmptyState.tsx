type EmptyStateProps = {
  title: string;
  description?: string;
};

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
      <h4 className="text-base font-semibold text-white">{title}</h4>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}