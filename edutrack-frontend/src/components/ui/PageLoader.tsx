export default function PageLoader() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
        <p className="text-sm text-slate-400">Loading dashboard...</p>
      </div>
    </div>
  );
}