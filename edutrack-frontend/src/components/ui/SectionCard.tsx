type SectionCardProps = {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
};

export default function SectionCard({
  title,
  subtitle,
  rightAction,
  children,
}: SectionCardProps) {
  return (
    <div className="card rounded-3xl p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>

        {rightAction ? <div>{rightAction}</div> : null}
      </div>

      {children}
    </div>
  );
}