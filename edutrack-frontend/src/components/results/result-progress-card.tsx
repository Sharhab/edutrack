
"use client";

type Props = {
  className: string;
  draft: number;
  generated: number;
  locked: number;
  published: number;
  totalResults: number;
  progress: number;
  onGenerate?: () => void;
  onPublish?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  loading?: boolean;
};

export default function ResultProgressCard({
  className,
  draft,
  generated,
  locked,
  published,
  totalResults,
  progress,
  onGenerate,
  onPublish,
  onLock,
  onUnlock,
  loading = false,
}: Props) {
  const hasDraft = draft > 0;
  const hasGenerated = generated > 0;
  const hasPublished = published > 0;
  const hasLocked = locked > 0;

  const status = hasLocked
    ? "Locked"
    : hasPublished
      ? "Published"
      : hasGenerated
        ? "Ready for publication"
        : hasDraft
          ? "Draft"
          : "No results";

  const statusStyle = hasLocked
    ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
    : hasPublished
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : hasGenerated
        ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
        : "border-slate-400/20 bg-slate-500/10 text-slate-300";

  const confirmAction = (
    message: string,
    action?: () => void
  ) => {
    if (!action || loading) return;

    if (window.confirm(message)) {
      action();
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">
            {className}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {totalResults} result records
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
        >
          {status}
        </span>
      </div>

      {/* PROGRESS */}
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-slate-400">
            Processing progress
          </span>
          <span className="font-semibold text-white">
            {progress}%
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>
      </div>

      {/* STATUS COUNTS */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-500/20 bg-slate-500/10 p-3">
          <p className="text-xs text-slate-400">Draft</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {draft}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
          <p className="text-xs text-cyan-200">Generated</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">
            {generated}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-200">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            {published}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-200">Locked</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">
            {locked}
          </p>
        </div>
      </div>

      {/* WORKFLOW GUIDE */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Next action
        </p>

        <p className="mt-1 text-sm text-white">
          {hasLocked
            ? "Results are locked. Reopen them only when corrections are required."
            : hasPublished
              ? "Results are visible. Lock them when the school has completed its review."
              : hasGenerated
                ? "Results are calculated. Review them before publishing."
                : hasDraft
                  ? "Generate results to calculate totals, grades and positions."
                  : "No result records are available for this class yet."}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-5 grid grid-cols-1 gap-2">
        {hasDraft && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              confirmAction(
                `Generate results for ${className}? This will calculate result totals, grades and positions.`,
                onGenerate
              )
            }
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate results
          </button>
        )}

        {hasGenerated && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              confirmAction(
                `Publish results for ${className}? Students and parents may now be able to view them.`,
                onPublish
              )
            }
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Publish results
          </button>
        )}

        {hasPublished && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              confirmAction(
                `Lock results for ${className}? Teachers will not be able to edit these results.`,
                onLock
              )
            }
            className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Lock results
          </button>
        )}

        {hasLocked && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              confirmAction(
                `Reopen results for ${className}? Locked results will return to generated status so teachers can make corrections.`,
                onUnlock
              )
            }
            className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reopen for corrections
          </button>
        )}

        {loading && (
          <p className="text-center text-xs text-cyan-300">
            Processing result action…
          </p>
        )}
      </div>
    </section>
  );
}
