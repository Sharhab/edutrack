
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Mail, School } from "lucide-react";

import type { PublicTenantPageData } from "../../types/public-tenant";

type PublicTenantHeroProps = {
  data: PublicTenantPageData;
};

export default function PublicTenantHero({ data }: PublicTenantHeroProps) {
  const tenant = data.tenant;
  const themeColor = tenant.themeColor || "#06b6d4";
  const loginUrl = `/login?tenant=${encodeURIComponent(tenant.slug || "")}`;

  return (
    <section
      className="relative overflow-hidden border-b border-slate-200"
      style={{
        background: `linear-gradient(135deg, ${themeColor}12, #ffffff 55%, ${themeColor}0c)`,
      }}
    >
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `${themeColor}20` }} />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: themeColor }} />
            Official school portal
          </div>

          <div className="mt-7 flex items-center gap-4">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white bg-white shadow-lg sm:h-24 sm:w-24"
            >
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt={`${tenant.schoolName} logo`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <School className="h-10 w-10" style={{ color: themeColor }} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: themeColor }}>
                Welcome to
              </p>
              <h1 className="mt-1 break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                {tenant.schoolName}
              </h1>
            </div>
          </div>


          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Find school information, stay informed about announcements, and
            access the services available to your school account through one
            secure portal.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold text-white shadow-lg transition hover:opacity-90"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 12px 28px ${themeColor}25`,
              }}
            >
              Login to your school
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="#school-information"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Explore school information
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Staff and students can choose their login type on the next page.
          </p>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: themeColor }}>
            School at a glance
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Stay connected
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep useful school details close at hand.
          </p>

          <div className="mt-6 space-y-3">
            <ContactRow
              icon={<MapPin className="h-5 w-5" />}
              label="Address"
              value={tenant.address || "Contact the school for details"}
              themeColor={themeColor}
            />

            <ContactRow
              icon={<Phone className="h-5 w-5" />}
              label="Phone"
              value={tenant.phone || "Not provided"}
              themeColor={themeColor}
            />

            <ContactRow
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              value={tenant.email || "Not provided"}
              themeColor={themeColor}
            />
          </div>

          <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: `${themeColor}10` }}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white" style={{ color: themeColor }}>
                <School className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  A dedicated school space
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  School information and secure account access in one place.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  value,
  themeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  themeColor: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50" style={{ color: themeColor }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}
