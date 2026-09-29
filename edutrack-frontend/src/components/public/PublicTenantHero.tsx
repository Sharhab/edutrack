import Link from "next/link";
import { PublicTenantPageData } from "../../types/public-tenant";

type PublicTenantHeroProps = {
  data: PublicTenantPageData;
};

export default function PublicTenantHero({ data }: PublicTenantHeroProps) {
  const tenant = data.tenant;

  const logoStyle = tenant.themeColor
    ? { background: tenant.themeColor }
    : undefined;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-12">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 font-bold text-white"
              style={logoStyle}
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
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                EduTrack School Space
              </p>
              <h1 className="text-3xl font-black text-white md:text-5xl">
                {tenant.schoolName}
              </h1>
            </div>
          </div>

          <p className="max-w-xl text-base leading-8 text-slate-300 md:text-lg">
            Welcome to the official digital school workspace for{" "}
            <span className="font-semibold text-white">{tenant.schoolName}</span>.
            Access school updates, announcements, and your secure login portal.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
  <Link
    href={`/login?tenant=${tenant.slug}`}
    className="rounded-2xl px-8 py-4 text-base font-semibold text-white"
    style={{
      background: `linear-gradient(135deg, ${tenant.themeColor || "#06b6d4"}, #3b82f6, #8b5cf6)`,
      boxShadow: `0 10px 25px ${tenant.themeColor || "#06b6d4"}44`,
    }}
  >
    School Login
  </Link>

  <Link
    href="/onboarding"
    className="btn-secondary px-8 py-4 text-base"
  >
    Start Your Own School
  </Link>
</div>
        </div>

        <div className="card min-w-[280px] p-6 lg:max-w-sm">
          <h3 className="text-lg font-semibold text-white">School Info</h3>

          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Slug
              </p>
              <p className="mt-2 font-semibold text-white">{tenant.slug}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Contact
              </p>
              <p className="mt-2 text-white">{tenant.phone || "-"}</p>
              <p className="mt-1 text-slate-400">{tenant.email || "-"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Address
              </p>
              <p className="mt-2 text-white">{tenant.address || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}