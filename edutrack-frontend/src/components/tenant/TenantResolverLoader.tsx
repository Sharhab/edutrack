export default function TenantResolverLoader() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/10" />
        <div className="flex-1">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="mt-6 h-20 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}