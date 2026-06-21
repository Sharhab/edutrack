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
   * 🔥 SYNC ROLE FROM URL (SAFE)
   */
  useEffect(() => {
    const r = searchParams.get("role");
    setRole(r);
  }, [searchParams]);

  /**
   * 🔥 TENANT RESOLUTION (FIXED - NO RACE, NO BLANK UI)
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
        console.error("Tenant load error:", err);
        setTenant(null);
      } finally {
        setTenantLoading(false);
      }
    }

    initTenant();
  }, []);

  /**
   * 🔥 LOGIN HANDLER (SAAS SAFE)
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
        role: role || null,
      });

      const token = res.data?.data?.token;
      const rawUser = res.data?.data?.user;

      if (!token) throw new Error("Token missing");
      if (!rawUser) throw new Error("User missing");

      const user: AuthUser = {
        _id: rawUser._id,
        schoolId: rawUser.schoolId || null,
        role: rawUser.role,
        name: rawUser.name,
        email: rawUser.email,
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
   * 🔥 ONLY LOADER (DO NOT BLOCK UI TREE)
   */
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TenantResolverLoader />
      </div>
    );
  }

  /**
   * 🔥 TENANT BLOCK STATE
   */
  if (tenant && isTenantBlocked(tenant)) {
    return (
      <div className="min-h-screen px-4 py-10">
        <TenantFaviconAndTitle pageTitle="Blocked" tenant={tenant} />

        <TenantBlockedState
          title="School Workspace Unavailable"
          description={getTenantBlockReason(tenant)}
        />
      </div>
    );
  }

  /**
   * 🔥 MAIN LOGIN UI (ALWAYS RENDERS — FIX FOR YOUR ISSUE)
   */
  return (
    <div className="relative min-h-screen px-4 py-10">
      <TenantFaviconAndTitle pageTitle="Login" tenant={tenant} />

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_25%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">

        {/* BRAND CARD */}
        <TenantBrandCard tenant={tenant} />

        {/* LOGIN FORM (ALWAYS VISIBLE) */}
        <div className="card p-6 sm:p-8">

          <h2 className="text-2xl font-bold">
            {tenant?.schoolName
              ? `Login to ${tenant.schoolName}`
              : "Login Portal"}
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