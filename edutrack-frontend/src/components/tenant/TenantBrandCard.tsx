import { ResolvedTenant } from "@/types/tenant-resolver";

type TenantBrandCardProps = {
  tenant: ResolvedTenant | null;
};

export default function TenantBrandCard({ tenant }: TenantBrandCardProps) {
  if (!tenant) {
    return (
      <div className="card p-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 font-bold text-white">
          ET
        </div>
        <h3 className="text-xl font-bold text-white">EduTrack</h3>
        <p className="mt-2 text-sm text-slate-400">
          Multi-tenant school management SaaS
        </p>
      </div>
    );
  }

  const bgStyle = tenant.themeColor
    ? { background: tenant.themeColor }
    : undefined;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 font-bold text-white"
          style={bgStyle}
        >
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.schoolName}
              className="h-full w-full object-cover"
            />
          ) : (
            tenant.schoolName.slice(0, 2).toUpperCase()
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-white">{tenant.schoolName}</h3>
          <p className="text-sm text-slate-400">{tenant.slug}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Tenant Status
        </p>
        <p className="mt-2 text-sm font-semibold capitalize text-white">
          {tenant.status || "active"}
        </p>
      </div>
    </div>
  );
}