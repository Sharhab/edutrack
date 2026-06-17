"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";

import PublicTenantHero from "../../../components/public/PublicTenantHero";
import PublicTenantAnnouncements from "../../../components/public/PublicTenantAnnouncements";
import PublicTenantFeatures from "../../../components/public/PublicTenantFeatures";

import TenantFaviconAndTitle from "../../../components/tenant/TenantFaviconAndTitle";

import { getPublicTenantPage } from "../../../lib/public-tenant";
import { PublicTenantPageData } from "../../../types/public-tenant";
import { ResolvedTenant } from "../../../types/tenant-resolver";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * SAFE NORMALIZER (fixes TS + runtime issues)
 */
function normalizeTenant(raw: any): ResolvedTenant {
  if (!raw) {
    return {
      _id: "",
      schoolName: "Unknown School",
      slug: "",
    } as ResolvedTenant;
  }

  return {
    ...raw,

    subscriptionStatus: raw.subscriptionStatus ?? "pending",
    status: raw.status ?? "inactive",

    billing: raw.billing ?? {
      status: "unknown",
      isTrial: false,
      daysLeft: null,
    },
  };
}

export default function PublicSchoolLandingPage({
  params,
}: PageProps) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<PublicTenantPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  /**
   * Resolve slug safely
   */
  useEffect(() => {
    async function run() {
      const resolved = await params;

      console.log("PUBLIC SCHOOL PAGE:", resolved.slug);

      setSlug(resolved.slug || "");
    }

    run();
  }, [params]);

  /**
   * Load tenant page
   */
  useEffect(() => {
    async function loadPage() {
      if (!slug) return;

      try {
        setLoading(true);
        setPageError("");

        const result = await getPublicTenantPage(slug);

        setData(result);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setPageError(
            err.response?.data?.message || "Failed to load school page."
          );
        } else {
          setPageError("Failed to load school page.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [slug]);

  /**
   * LOADING
   */
  if (loading) return <PageLoader />;

  /**
   * ERROR STATE
   */
  if (pageError || !data) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Unable to load school page"
            description={pageError || "School page not found"}
          />

          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="rounded-xl border border-white/10 px-6 py-3"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tenant = normalizeTenant(data.tenant);

  /**
   * LOGIN ROUTE BUILDER (UNIQUE & CLEAN)
   */
  const loginUrl = (role: string) =>
    `/login?tenant=${tenant.slug}&role=${role}`;

  return (
    <>
      <TenantFaviconAndTitle pageTitle={tenant.schoolName} tenant={tenant} />

      <div className="min-h-screen bg-slate-950 text-white">

        {/* BACKGROUND */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8">

          {/* HEADER */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.schoolName}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl">
                  🏫
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold">
                  {tenant.schoolName}
                </h1>
                <p className="text-sm text-slate-400">
                  Official School Portal
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-white/10 px-5 py-3"
            >
              Powered by EduTrack
            </Link>
          </div>

          {/* HERO */}
          <PublicTenantHero data={data} />

          {/* SCHOOL DOMAIN */}
          <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
            <div className="text-center">

              <p className="text-sm text-cyan-300">
                School Portal URL
              </p>

              <a
                href={`https://${tenant.domain || `${tenant.slug}.edutrack.cloud`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-2xl font-bold text-cyan-300 hover:underline"
              >
                {tenant.domain || `${tenant.slug}.edutrack.cloud`}
              </a>

            </div>
          </div>

          {/* LOGIN OPTIONS (IMPROVED UNIQUENESS + UX) */}
          <section className="mt-12">

            <h2 className="mb-6 text-center text-3xl font-bold">
              Secure Login Portal
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* ADMIN */}
              <Link href={loginUrl("school_admin")} className="card hover:border-cyan-500">
                <div className="text-4xl">👨‍💼</div>
                <h3 className="mt-4 text-xl font-bold">School Admin</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Manage school, staff, students & settings
                </p>
              </Link>

              {/* TEACHER */}
              <Link href={loginUrl("teacher")} className="card hover:border-cyan-500">
                <div className="text-4xl">👨‍🏫</div>
                <h3 className="mt-4 text-xl font-bold">Teacher Portal</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Classes, attendance, results & grading
                </p>
              </Link>

              {/* PARENT */}
              <Link href={loginUrl("parent")} className="card hover:border-cyan-500">
                <div className="text-4xl">👨‍👩‍👧</div>
                <h3 className="mt-4 text-xl font-bold">Parent Portal</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Monitor child performance & updates
                </p>
              </Link>

              {/* STUDENT */}
              <Link href={loginUrl("student")} className="card hover:border-cyan-500">
                <div className="text-4xl">🎓</div>
                <h3 className="mt-4 text-xl font-bold">Student Portal</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Access results, assignments & profile
                </p>
              </Link>

            </div>
          </section>

          {/* FEATURES */}
          <div className="mt-16">
            <PublicTenantFeatures />
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="mt-16">
            <PublicTenantAnnouncements items={data.announcements || []} />
          </div>

          {/* CTA */}
          <section className="mt-16">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">

              <h2 className="text-3xl font-bold">
                Welcome to {tenant.schoolName}
              </h2>

              <p className="mt-4 text-slate-400">
                Access your academic records, attendance, assignments, results and communication tools.
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  href={loginUrl("school_admin")}
                  className="rounded-2xl bg-cyan-500 px-8 py-4 font-semibold text-black"
                >
                  Access Portal
                </Link>
              </div>

            </div>
          </section>

        </div>
      </div>
    </>
  );
}