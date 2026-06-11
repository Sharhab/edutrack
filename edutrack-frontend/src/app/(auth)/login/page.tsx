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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { tenant, setTenant } = useTenant();
  const { hydrated, setSession } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * LOAD TENANT
   */
  useEffect(() => {
    async function loadTenant() {
      try {
        setTenantLoading(true);

        const slug = getTenantSlugFromUrl(searchParams);

        if (slug) {
          const resolved = await resolveTenantBySlug(slug);
          setTenant(resolved);
          return;
        }

        const host = getHostFromWindow();
        const subdomain = getSubdomain(host);

        if (subdomain) {
          const resolved = await resolveTenantByDomain(host);
          setTenant(resolved);
          return;
        }

        setTenant(null);
      } catch (err) {
        console.error(err);
        setTenant(null);
      } finally {
        setTenantLoading(false);
      }
    }

    loadTenant();
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
};

      /**
       * ✅ SET SESSION (COOKIE + STATE)
       */
      setSession(token, user);

      // IMPORTANT: sync middleware cookie
      document.cookie = `token=${token}; path=/; max-age=86400`;
      document.cookie = `role=${user.role}; path=/; max-age=86400`;

      /**
       * ✅ SAFE REDIRECT (NO BLINK / NO LOOP)
       */
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
   * LOADING STATE
   */
  if (!hydrated || tenantLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden px-4 py-10">
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
      <div className="relative min-h-screen overflow-hidden px-4 py-10">
        <TenantFaviconAndTitle pageTitle="Blocked" tenant={tenant} />
        <TenantBlockedState
          title="School Workspace Unavailable"
          description={getTenantBlockReason(tenant)}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      <TenantFaviconAndTitle pageTitle="Login" tenant={tenant} />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_25%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <TenantBrandCard tenant={tenant} />

        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">
            {tenant?.schoolName
              ? `Login to ${tenant.schoolName}`
              : "Login to EduTrack"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

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
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

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
