
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Menu,
  MessageCircle,
  School,
  ShieldCheck,
  X,
} from "lucide-react";

import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import PublicTenantHero from "../../../components/public/PublicTenantHero";
import PublicTenantAnnouncements from "../../../components/public/PublicTenantAnnouncements";
import PublicTenantFeatures from "../../../components/public/PublicTenantFeatures";
import TenantFaviconAndTitle from "../../../components/tenant/TenantFaviconAndTitle";

import { getPublicTenantPage } from "../../../lib/public-tenant";
import type { PublicTenantPageData } from "../../../types/public-tenant";
import type { ResolvedTenant } from "../../../types/tenant-resolver";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function normalizeTenant(raw: any): ResolvedTenant {
  return {
    _id: raw?._id || "",
    schoolName: raw?.schoolName || "",
    slug: raw?.slug || "",
    logoUrl: raw?.logoUrl || "",
    faviconUrl: raw?.faviconUrl || "",
    themeColor: raw?.themeColor || "#06b6d4",
    address: raw?.address || "",
    phone: raw?.phone || "",
    email: raw?.email || "",
    principalName: raw?.principalName || "",
    motto: raw?.motto || "",
    domain: raw?.domain || "",
    fullDomain: raw?.fullDomain || "",
    customDomain: raw?.customDomain || "",
    currentSession: raw?.currentSession || "",
    currentTerm: raw?.currentTerm || "",
    status: raw?.status || "active",
    subscriptionStatus: raw?.subscriptionStatus || "trial",
    billing: raw?.billing || {
      status: "unknown",
      isTrial: false,
      daysLeft: null,
    },
    expiryDate: raw?.expiryDate || null,
  };
}

export default function PublicSchoolLandingPage({
  params,
}: PageProps) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<PublicTenantPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveSlug() {
      try {
        const result = await params;
        if (!cancelled) setSlug(result?.slug || "");
      } catch {
        if (!cancelled) {
          setPageError("The school address could not be resolved.");
          setLoading(false);
        }
      }
    }

    void resolveSlug();

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function loadPage() {
      try {
        setLoading(true);
        setPageError("");

        const result = await getPublicTenantPage(slug);

        if (!cancelled) setData(result);
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message ||
            "We could not load this school portal."
          : "We could not load this school portal.";

        if (!cancelled) setPageError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <PageLoader />;

  if (pageError || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <School className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            School portal unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {pageError || "We could not find this school portal."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-800"
          >
            Back to EduTrack
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const tenant = normalizeTenant(data.tenant);
  const announcements = Array.isArray(data.announcements)
    ? data.announcements
    : [];

  const loginUrl = `/login?tenant=${encodeURIComponent(tenant.slug || slug)}`;
  const themeColor = tenant.themeColor || "#06b6d4";

  return (
    <>
      <TenantFaviconAndTitle
        pageTitle={tenant.schoolName}
        tenant={tenant}
      />

      <main
        className="min-h-screen bg-slate-50 text-slate-800"
        style={{ "--school-theme": themeColor } as React.CSSProperties}
      >
        {/* School navigation */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href={`/school/${encodeURIComponent(tenant.slug || slug)}`} className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white"
                style={{ backgroundColor: themeColor }}
              >
                {tenant.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logoUrl}
                    alt={`${tenant.schoolName} logo`}
                    className="h-full w-full object-contain bg-white p-1"
                  />
                ) : (
                  <School className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0">
                <span className="block truncate font-bold text-slate-950">
                  {tenant.schoolName}
                </span>
                <span className="block text-xs text-slate-500">
                  Official School Portal
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                About
              </a>
              <a href="#school-information" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                School information
              </a>
              <a href="#announcements" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                Announcements
              </a>
            </nav>

            <div className="hidden sm:block">
              <Link
                href={loginUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                Login to your school
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 sm:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {menuOpen && (
            <nav className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden">
              <div className="flex flex-col gap-1">
                <a onClick={() => setMenuOpen(false)} href="#about" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">
                  About
                </a>
                <a onClick={() => setMenuOpen(false)} href="#school-information" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">
                  School information
                </a>
                <a onClick={() => setMenuOpen(false)} href="#announcements" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">
                  Announcements
                </a>
                <Link
                  href={loginUrl}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  Login to your school
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          )}
        </header>

        {/* School-branded welcome */}
        <div id="about">
          <PublicTenantHero data={data} />
        </div>

        {/* Quick introduction */}
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: themeColor }}
              >
                <GraduationCap className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-950">
                Welcome to {tenant.schoolName}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                This is the official online space for school information,
                announcements, and secure access to school services.
                Students and school staff can use the login button to
                choose the appropriate sign-in option.
              </p>

              <Link
                href={loginUrl}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold text-white transition hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: themeColor }}
              >
                Continue to login
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Staff and students select their account type on the next page.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-950">
                Quick access
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Find the right place to start.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href={loginUrl}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <ShieldCheck className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">Secure login</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Staff, administrators, and students
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <a
                  href="#announcements"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <MessageCircle className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">School updates</p>
                    <p className="mt-1 text-xs text-slate-500">
                      View published announcements
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* School information */}
        <section id="school-information" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: themeColor }}>
              School information
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              Useful details at a glance
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={<School className="h-5 w-5" />}
              label="School leader"
              value={tenant.principalName || "Contact the school for details"}
              themeColor={themeColor}
            />

            <InfoCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Academic session"
              value={tenant.currentSession || "Not published"}
              themeColor={themeColor}
            />

            <InfoCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Current term"
              value={tenant.currentTerm || "Not published"}
              themeColor={themeColor}
            />

            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              label="School address"
              value={tenant.address || "Contact the school for details"}
              themeColor={themeColor}
            />
          </div>
        </section>

        {/* Existing school feature component */}
        <section className="border-y border-slate-200 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PublicTenantFeatures />
          </div>
        </section>

        {/* Announcements */}
        <section id="announcements" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: themeColor }}>
              Stay informed
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              School announcements
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Important notices and updates published by the school.
            </p>
          </div>

          <PublicTenantAnnouncements items={announcements} />
        </section>

        {/* One clear final action */}
        <section className="px-4 pb-14 sm:px-6 lg:px-8">
          <div
            className="mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10 sm:py-14"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, #164e63)`,
            }}
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <GraduationCap className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-3xl font-black sm:text-4xl">
                Welcome to {tenant.schoolName}
              </h2>

              <p className="mt-4 leading-7 text-white/85">
                Continue to the secure portal to access the services available
                to your school account.
              </p>

              <Link
                href={loginUrl}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Login to your school
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt=""
                  className="h-9 w-9 rounded-lg object-contain"
                />
              ) : (
                <School className="h-6 w-6" style={{ color: themeColor }} />
              )}
              <span className="font-semibold text-slate-700">
                {tenant.schoolName}
              </span>
            </div>

            <p>
              School portal powered by{" "}
              <Link href="/" className="font-semibold text-cyan-800 hover:underline">
                EduTrack
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

function InfoCard({
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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${themeColor}18`, color: themeColor }}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold leading-6 text-slate-900">
        {value}
      </p>
    </article>
  );
}
