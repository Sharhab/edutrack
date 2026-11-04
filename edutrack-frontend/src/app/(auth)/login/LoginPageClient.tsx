
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Lock, Mail, GraduationCap, UserRound } from "lucide-react";

import api from "../../../lib/axios";
import { useAuth } from "../../../components/providers/AuthProvider";
import { useTenant } from "../../../components/tenant/TenantProvider";

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

import type { AuthUser } from "../../../types/auth";

type LoginMode = "staff" | "student";

export default function LoginPageClient() {
  const searchParams = useSearchParams();

  const { tenant, setTenant } = useTenant();
  const { hydrated, setSession } = useAuth();

  const [mode, setMode] = useState<LoginMode>("staff");

  const [form, setForm] = useState({
    email: "",
    admissionNumber: "",
    password: "",
  });

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [error, setError] = useState("");

  // Read an optional role from the login URL.
  useEffect(() => {
    const requestedRole = searchParams.get("role");

    setRole(requestedRole);

    if (requestedRole === "student") {
      setMode("student");
    }
  }, [searchParams]);

  // Resolve the school using the existing tenant system.
  useEffect(() => {
    let cancelled = false;

    async function initTenant() {
      try {
        setTenantLoading(true);

        const slugFromUrl = getTenantSlugFromUrl(searchParams);
        const host = getHostFromWindow();
        const subdomain = getSubdomain(host);
        const slug = slugFromUrl || subdomain;

        if (!slug) {
          if (!cancelled) setTenant(null);
          return;
        }

        const resolved = slugFromUrl
          ? await resolveTenantBySlug(slug)
          : await resolveTenantByDomain(host);

        if (!cancelled) {
          setTenant(resolved);
        }
      } catch (err) {
        console.error("Tenant resolution failed:", err);

        if (!cancelled) {
          setTenant(null);
        }
      } finally {
        if (!cancelled) {
          setTenantLoading(false);
        }
      }
    }

    void initTenant();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setTenant]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      let response;

      if (mode === "student") {
        if (!tenant?.slug) {
          throw new Error(
            "Open your school's login page before signing in."
          );
        }

        response = await api.post("/auth/student-login", {
          tenantSlug: tenant.slug,
          admissionNumber: form.admissionNumber.trim(),
          password: form.password,
        });
      } else {
        response = await api.post("/auth/login", {
          email: form.email.trim(),
          password: form.password,
          tenantSlug: tenant?.slug || null,
          role: role === "student" ? null : role,
        });
      }

      const data = response.data?.data;
      const token = data?.token;
      const rawUser = data?.user;

      if (!token || !rawUser?._id || !rawUser?.role) {
        throw new Error("The server returned an incomplete login response.");
      }

      // Do not allow a student login form to create a staff session.
      if (mode === "student" && rawUser.role !== "student") {
        throw new Error("Unexpected account type returned by the server.");
      }

      const fullName = [
        rawUser.firstName,
        rawUser.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const user: AuthUser = {
  _id: String(rawUser._id),
  schoolId: rawUser.schoolId
    ? String(rawUser.schoolId)
    : null,
  studentId: rawUser.studentId
    ? String(rawUser.studentId)
    : null,
  role: rawUser.role,
  firstName: rawUser.firstName,
  lastName: rawUser.lastName,
  name: rawUser.name || fullName || undefined,
  email: rawUser.email,
  isActive: rawUser.isActive,
};

      setSession(token, user);

      // Redirect according to the authenticated role.
      window.location.href = getDashboardRoute(user.role);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Login failed. Check your details and try again."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <TenantResolverLoader />
      </div>
    );
  }

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

  return (
    <div className="relative min-h-screen px-4 py-10">
      <TenantFaviconAndTitle pageTitle="Login" tenant={tenant} />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_25%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <TenantBrandCard tenant={tenant} />

        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">
            {tenant?.schoolName
              ? `Login to ${tenant.schoolName}`
              : "EduTrack Login Portal"}
          </h2>

          {tenant?.slug && (
            <p className="mt-1 text-sm text-cyan-300">
              {tenant.slug}.edutrack.cloud
            </p>
          )}

          {/* Choose the account type. */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-800/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("staff");
                setError("");
              }}
              aria-pressed={mode === "staff"}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition ${
                mode === "staff"
                  ? "bg-cyan-500 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <UserRound size={18} />
              Staff / Admin
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("student");
                setError("");
              }}
              aria-pressed={mode === "student"}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition ${
                mode === "student"
                  ? "bg-cyan-500 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <GraduationCap size={18} />
              Student
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            {mode === "student"
              ? "Sign in using the admission number and password provided by your school."
              : "Sign in using your registered email address and password."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "student" ? (
              <div>
                <label
                  htmlFor="admissionNumber"
                  className="mb-1 block text-sm font-medium"
                >
                  Admission Number
                </label>

                <div className="relative">
                  <GraduationCap
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />

                  <input
                    id="admissionNumber"
                    name="admissionNumber"
                    type="text"
                    autoComplete="username"
                    required
                    maxLength={64}
                    className="input pl-10"
                    placeholder="Enter your admission number"
                    value={form.admissionNumber}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        admissionNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    className="input pl-10"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  className="input pl-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      password: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : mode === "student"
                  ? "Student Login"
                  : "Login"}
            </button>
          </form>

          {mode === "student" && (
            <p className="mt-5 text-center text-xs text-slate-400">
              Forgot your password? Contact your school administrator
              for help resetting it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
