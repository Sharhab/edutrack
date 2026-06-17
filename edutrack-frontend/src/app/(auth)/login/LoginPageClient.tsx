"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

import api from "../../../lib/axios";
import { useAuth } from "../../../components/providers/AuthProvider";
import { useTenant } from "../../../components/providers/TenantProvider";

import TenantBrandCard from "../../../components/tenant/TenantBrandCard";
import TenantResolverLoader from "../../../components/tenant/TenantResolverLoader";
import TenantFaviconAndTitle from "../../../components/tenant/TenantFaviconAndTitle";
import TenantBlockedState from "../../../components/tenant/TenantBlockedState";

import { getDashboardRoute } from "../../../lib/auth";

import {
  resolveTenantByDomain,
  resolveTenantBySlug,
} from "../../../lib/tenant-resolver";

import {
  getHostFromWindow,
  getSubdomain,
  getTenantSlugFromUrl,
} from "../../../lib/tenant-domain";

import {
  getTenantBlockReason,
  isTenantBlocked,
} from "../../../lib/tenant-guard";

import { Lock, Mail } from "lucide-react";
import { AuthUser } from "../../../types/auth";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { tenant, setTenant } = useTenant();
  const { hydrated, setSession } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * 🔥 SAFE ROLE SYNC (FIX)
   */
  useEffect(() => {
    setRole(searchParams.get("role"));
  }, [searchParams]);

  /**
   * 🔥 SINGLE TENANT RESOLUTION FLOW (FIXED)
   */
  useEffect(() => {
    async function initTenant() {
      try {
        setTenantLoading(true);

        const slugFromUrl = getTenantSlugFromUrl(searchParams);
        const host = getHostFromWindow();
        const subdomain = getSubdomain(host);

        const slug = slugFromUrl || subdomain;

        if (!slug) {
          setTenant(null);
          return;
        }

        const resolved = slugFromUrl
          ? await resolveTenantBySlug(slug)
          : await resolveTenantByDomain(host);

        setTenant(resolved);
      } catch (err) {
        console.error(err);
        setTenant(null);
      } finally {
        setTenantLoading(false);
      }
    }

    initTenant();
  }, [searchParams, setTenant]);

  /**
   * LOGIN
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    try {
      setError("");
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
        tenantSlug: tenant?.slug || null,
        role, // 🔥 IMPORTANT
      });

      const token = res.data?.data?.token;
      const rawUser = res.data?.data?.user;

      if (!token) throw new Error("Token missing");
      if (!rawUser) throw new Error("User missing");

      const user: AuthUser = {
        id: rawUser.id || rawUser._id,
        _id: rawUser._id,
        schoolId: rawUser.schoolId || null,
        role: rawUser.role,
        name: rawUser.name,
        email: rawUser.email,

        tenant: tenant
          ? {
              _id: tenant._id,
              slug: tenant.slug,
              schoolName: tenant.schoolName,
              domain: tenant.domain,
              status: tenant.status,
              subscriptionStatus: tenant.subscriptionStatus,
            }
          : null,
      };

      setSession(token, user);

      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `role=${user.role}; path=/; max-age=86400; SameSite=Lax`;

      router.replace(getDashboardRoute(user.role));
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * 🔥 LOADING (FIX: NEVER BLOCK LOGIN FORM INDEFINITELY)
   */
  if (!hydrated || tenantLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <TenantFaviconAndTitle pageTitle="Login" tenant={tenant} />
        <TenantResolverLoader />
      </div>
    );
  }

  /**
   * BLOCKED TENANT
   */
  if (tenant && isTenantBlocked(tenant)) {
    return (
      <div className="relative min-h-screen px-4 py-10">
        <TenantFaviconAndTitle pageTitle="Blocked" tenant={tenant} />
        <TenantBlockedState
          title="School Workspace Unavailable"
          description={getTenantBlockReason(tenant)}
        />
      </div>
    );
  }

  /**
   * MAIN UI (ALWAYS RENDERS LOGIN FORM)
   */
  return (
    <div className="relative min-h-screen px-4 py-10">
      <TenantFaviconAndTitle pageTitle="Login" tenant={tenant} />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <TenantBrandCard tenant={tenant} />

        {/* LOGIN FORM */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">
            Login {tenant?.schoolName ? `to ${tenant.schoolName}` : "Portal"}
          </h2>

          {tenant?.slug && (
            <p className="mt-1 text-sm text-cyan-300">
              {tenant.slug}.edutrack.cloud
            </p>
          )}

          {role && (
            <p className="mt-2 text-xs text-slate-400">
              Role: <span className="text-cyan-300">{role}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* EMAIL */}
            <div>
              <label className="text-sm">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  className="input pl-10"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  className="input pl-10"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}