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

import { ResolvedTenant } from "../../../types/tenant-resolver";
import { TenantSubscriptionStatus } from "../../../types/tenant";

import { getPublicTenantPage } from "../../../lib/public-tenant";
import { PublicTenantPageData } from "../../../types/public-tenant";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function normalizeTenant(raw: any): ResolvedTenant {
  return {
    ...raw,

    // force safe enum casting
    subscriptionStatus: raw.subscriptionStatus as TenantSubscriptionStatus,

    status: raw.status,
  };
}

export default function PublicSchoolLandingPage({
  params,
}: PageProps) {
  const [slug, setSlug] =
    useState("");

  const [data, setData] =
    useState<PublicTenantPageData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  useEffect(() => {
    async function run() {
      const resolvedParams =
        await params;

        console.log(
      "PUBLIC SCHOOL PAGE:",
      resolvedParams.slug
    );
      setSlug(
        resolvedParams.slug
      );
    }

    run();
  }, [params]);

  

  useEffect(() => {
    async function loadPage() {
      if (!slug) return;

      try {
        setLoading(true);
        setPageError("");

        const result =
          await getPublicTenantPage(
            slug
          );

        setData(result);
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err)
        ) {
          setPageError(
            err.response?.data
              ?.message ||
              "Failed to load school page."
          );
        } else {
          setPageError(
            "Failed to load school page."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [slug]);

  if (loading) {
    return <PageLoader />;
  }

  if (pageError || !data) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Unable to load school page"
            description={
              pageError ||
              "School page not found."
            }
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

  return (
    <>
      <TenantFaviconAndTitle
  pageTitle={data.tenant.schoolName}
  tenant={normalizeTenant(data.tenant)}
/>

      <div className="min-h-screen bg-slate-950 text-white">

        {/* BACKGROUND */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8">

          {/* HEADER */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              {data.tenant.logoUrl ? (
                <img
                  src={
                    data.tenant.logoUrl
                  }
                  alt={
                    data.tenant.schoolName
                  }
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl">
                  🏫
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold">
                  {
                    data.tenant
                      .schoolName
                  }
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
          <PublicTenantHero
            data={data}
          />

          {/* SCHOOL DOMAIN */}
          <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">

            <div className="text-center">

              <p className="text-sm text-cyan-300">
                School Portal URL
              </p>

            <a
  href={`https://${data.tenant.domain}`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-2 block text-2xl font-bold text-cyan-300 hover:underline"
>
  {data.tenant.domain ||
    `${data.tenant.slug}.edutrack.com.ng`}
</a>

            </div>
          </div>

          {/* LOGIN OPTIONS */}
          <section className="mt-12">

            <h2 className="mb-6 text-center text-3xl font-bold">
              Login Portal
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

              <Link
                href={`/login?tenant=${data.tenant.slug}&role=school_admin`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500"
              >
                <div className="text-4xl">
                  👨‍💼
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  Admin Login
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  School administrators
                </p>
              </Link>

              <Link
                href={`/login?tenant=${data.tenant.slug}&role=teacher`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500"
              >
                <div className="text-4xl">
                  👨‍🏫
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  Teacher Login
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Teachers & staff
                </p>
              </Link>

              <Link
                href={`/login?tenant=${data.tenant.slug}&role=parent`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500"
              >
                <div className="text-4xl">
                  👨‍👩‍👧
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  Parent Login
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Parents portal
                </p>
              </Link>

              <Link
                href={`/login?tenant=${data.tenant.slug}&role=student`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500"
              >
                <div className="text-4xl">
                  🎓
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  Student Login
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Student portal
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
            <PublicTenantAnnouncements
              items={
                data.announcements
              }
            />
          </div>

          {/* CTA */}
          <section className="mt-16">

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">

              <h2 className="text-3xl font-bold">
                Welcome to{" "}
                {
                  data.tenant
                    .schoolName
                }
              </h2>

              <p className="mt-4 text-slate-400">
                Access your academic
                records, attendance,
                assignments, results and
                communication tools
                through EduTrack.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">

                <Link
                  href={`/login?tenant=${data.tenant.slug}`}
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