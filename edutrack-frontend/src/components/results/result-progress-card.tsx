"use client";

type Props = {
  className: string;

  draft: number;
  generated: number;
  locked: number;
  published: number;

  totalResults: number;
  progress: number;

  // 👇 NEW ACTION HOOKS (optional but future-ready)
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

  loading,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      {/* HEADER */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {className}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {totalResults} total results
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
          {progress}%
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-6 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Draft
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{draft}</p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-cyan-200">
            Generated
          </p>
          <p className="mt-2 text-2xl font-bold text-cyan-300">
            {generated}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-yellow-200">
            Locked
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-300">
            {locked}
          </p>
        </div>

        <div className="rounded-2xl border border-green-400/20 bg-green-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-green-200">
            Published
          </p>
          <p className="mt-2 text-2xl font-bold text-green-300">
            {published}
          </p>
        </div>
      </div>

      {/* =========================================
          ACTIONS (NEW FEATURE)
      ========================================= */}
      <div className="mt-6 flex flex-wrap gap-2">
        {/* GENERATE */}
        <button
          disabled={!draft || loading}
          onClick={onGenerate}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition
            ${
              draft
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
        >
          Generate
        </button>

        {/* PUBLISH */}
        <button
          disabled={!generated || loading}
          onClick={onPublish}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition
            ${
              generated
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
        >
          Publish
        </button>

        {/* LOCK */}
        <button
          disabled={!published || loading}
          onClick={onLock}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition
            ${
              published
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
        >
          Lock
        </button>

        {/* UNLOCK */}
        <button
          disabled={!locked || loading}
          onClick={onUnlock}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition
            ${
              locked
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}