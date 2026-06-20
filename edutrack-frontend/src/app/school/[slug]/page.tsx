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

/*
=========================================
SAFE TENANT NORMALIZER
=========================================
*/
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

    subscriptionStatus:
      raw?.subscriptionStatus || "trial",

    billing:
      raw?.billing || {
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

  const [data, setData] =
    useState<PublicTenantPageData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  /*
  =========================================
  RESOLVE PARAMS
  =========================================
  */
  useEffect(() => {
    async function resolveSlug() {
      const result = await params;
      setSlug(result?.slug || "");
    }

    resolveSlug();
  }, [params]);

  /*
  =========================================
  LOAD SCHOOL PAGE
  =========================================
  */
  useEffect(() => {
    async function loadPage() {
      if (!slug) return;

      try {
        setLoading(true);
        setPageError("");

        const result =
          await getPublicTenantPage(slug);

        setData(result);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setPageError(
            err.response?.data?.message ||
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

  /*
  =========================================
  LOADING
  =========================================
  */
  if (loading) {
    return <PageLoader />;
  }

  /*
  =========================================
  ERROR
  =========================================
  */
  if (pageError || !data) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Unable to load school page"
            description={
              pageError || "School not found"
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

  const tenant = normalizeTenant(data.tenant);

  const announcements = Array.isArray(
    data.announcements
  )
    ? data.announcements
    : [];

  const portalDomain =
    tenant.fullDomain ||
    tenant.domain ||
    `${tenant.slug}.edutrack.com.ng`;

  const loginUrl = (
    role:
      | "school_admin"
      | "teacher"
      | "parent"
      | "student"
  ) =>
    `/login?tenant=${tenant.slug}&role=${role}`;

  return (
    <>
      <TenantFaviconAndTitle
        pageTitle={tenant.schoolName}
        tenant={tenant}
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

                {tenant.motto && (
                  <p className="text-xs text-cyan-300">
                    {tenant.motto}
                  </p>
                )}
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

          {/* SCHOOL INFO */}
          <div className="mt-10 grid gap-6 lg:grid-cols-4">

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">
                Principal
              </p>
              <p className="mt-2 font-semibold">
                {tenant.principalName || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">
                Session
              </p>
              <p className="mt-2 font-semibold">
                {tenant.currentSession || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">
                Term
              </p>
              <p className="mt-2 font-semibold">
                {tenant.currentTerm || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">
                Status
              </p>
              <p className="mt-2 font-semibold capitalize">
                {tenant.subscriptionStatus}
              </p>
            </div>

          </div>

          {/* DOMAIN */}
          <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">

            <div className="text-center">

              <p className="text-sm text-cyan-300">
                School Portal URL
              </p>

              <a
                href={`https://${portalDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-2xl font-bold text-cyan-300 hover:underline"
              >
                {portalDomain}
              </a>

            </div>

          </div>

          {/* LOGIN */}
          <section className="mt-12">

            <h2 className="mb-6 text-center text-3xl font-bold">
              Secure Login Portal
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

              <Link
                href={loginUrl("school_admin")}
                className="card transition hover:border-cyan-500"
              >
                <div className="text-4xl">👨‍💼</div>

                <h3 className="mt-4 text-xl font-bold">
                  Admin Portal
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Full control of school management.
                </p>
              </Link>

              <Link
                href={loginUrl("teacher")}
                className="card transition hover:border-cyan-500"
              >
                <div className="text-4xl">👨‍🏫</div>

                <h3 className="mt-4 text-xl font-bold">
                  Teacher Portal
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Results, classes and attendance.
                </p>
              </Link>

              <Link
                href={loginUrl("parent")}
                className="card transition hover:border-cyan-500"
              >
                <div className="text-4xl">👨‍👩‍👧</div>

                <h3 className="mt-4 text-xl font-bold">
                  Parent Portal
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Child performance and updates.
                </p>
              </Link>

              <Link
                href={loginUrl("student")}
                className="card transition hover:border-cyan-500"
              >
                <div className="text-4xl">🎓</div>

                <h3 className="mt-4 text-xl font-bold">
                  Student Portal
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Results, assignments and profile.
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
              items={announcements}
            />
          </div>

          {/* CTA */}
          <section className="mt-16">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">

              <h2 className="text-3xl font-bold">
                Welcome to {tenant.schoolName}
              </h2>

              <p className="mt-4 text-slate-400">
                Access academic records,
                attendance, assignments,
                communication and results.
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  href={loginUrl(
                    "school_admin"
                  )}
                  className="rounded-2xl bg-cyan-500 px-8 py-4 font-semibold text-black transition hover:bg-cyan-400"
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