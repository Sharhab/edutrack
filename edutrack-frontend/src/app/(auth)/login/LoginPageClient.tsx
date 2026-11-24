
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import {
  Lock,
  GraduationCap,
  UserRound,
  Eye,
  EyeOff,
  School,
} from "lucide-react";

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

interface LoginFormState {
  identifier: string;
  admissionNumber: string;
  password: string;
}

export default function LoginPageClient() {
  const searchParams = useSearchParams();

  const { tenant, setTenant } = useTenant();
  const { hydrated, setSession } = useAuth();

  const [mode, setMode] = useState<LoginMode>("staff");

  const [form, setForm] = useState<LoginFormState>({
    identifier: "",
    admissionNumber: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // INITIAL LOGIN MODE
  // --------------------------------------------------

  useEffect(() => {
    const requestedRole = searchParams.get("role");

    setMode(requestedRole === "student" ? "student" : "staff");
  }, [searchParams]);

  // --------------------------------------------------
  // RESOLVE SCHOOL TENANT
  // --------------------------------------------------

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
          if (!cancelled) {
            setTenant(null);
          }

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

  // --------------------------------------------------
  // FORM HELPERS
  // --------------------------------------------------

  function updateForm(
    field: keyof LoginFormState,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setError("");

    setForm((previous) => ({
      ...previous,
      identifier: "",
      admissionNumber: "",
      password: "",
    }));

    setShowPassword(false);
  }

  // --------------------------------------------------
  // LOGIN SUBMISSION
  // --------------------------------------------------

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      let response;

      // ================================================
      // STUDENT LOGIN
      // ================================================

      if (mode === "student") {
        if (!tenant?.slug) {
          throw new Error(
            "Open your school's login portal before signing in."
          );
        }

        const admissionNumber =
          form.admissionNumber.trim();

        if (!admissionNumber) {
          throw new Error("Enter your admission number.");
        }

        // Student authentication must remain separate.
        response = await api.post("/auth/student-login", {
          tenantSlug: tenant.slug,
          admissionNumber,
          password: form.password,
        });
      }

      // ================================================
      // STAFF / ADMIN LOGIN
      // ================================================

      else {
        const identifier = form.identifier.trim();

        if (!identifier) {
          throw new Error(
            "Enter your email address or Employee ID."
          );
        }

        // Employee ID login requires school context.
        // Email login remains available from the main portal.
        if (
          !identifier.includes("@") &&
          !tenant?.slug
        ) {
          throw new Error(
            "Employee ID login requires your school's portal address. Open your school portal and try again."
          );
        }

        // Never send null for tenantSlug.
        // Omit it completely when there is no school tenant.
        response = await api.post("/auth/login", {
          identifier,
          password: form.password,
          ...(tenant?.slug
            ? { tenantSlug: tenant.slug }
            : {}),
        });
      }

      // ================================================
      // VERIFY SERVER RESPONSE
      // ================================================

      const data = response.data?.data;
      const token = data?.token;
      const rawUser = data?.user;

      if (!token || !rawUser?._id || !rawUser?.role) {
        throw new Error(
          "The server returned an incomplete login response."
        );
      }

      // Student login must never create a staff session.
      if (
        mode === "student" &&
        rawUser.role !== "student"
      ) {
        throw new Error(
          "Unexpected account type returned by the server."
        );
      }

      // Staff login must never create a student session.
      if (
        mode === "staff" &&
        rawUser.role === "student"
      ) {
        throw new Error(
          "Please use the Student Login option."
        );
      }

      // ================================================
      // BUILD AUTHENTICATED USER
      // ================================================

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

      // ================================================
      // SAVE SESSION AND REDIRECT
      // ================================================

      setSession(token, user);

      window.location.href = getDashboardRoute(user.role);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMessage =
          err.response?.data?.message;

        const errorCode =
          err.response?.data?.code;

        if (errorCode === "PASSWORD_CHANGE_REQUIRED") {
          setError(
            "You must change your temporary password before accessing your account. Please contact your school administrator if you cannot proceed."
          );
        } else {
          setError(
            serverMessage ||
              "Login failed. Check your details and try again."
          );
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (!hydrated || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <TenantResolverLoader />
      </div>
    );
  }

  // --------------------------------------------------
  // BLOCKED SCHOOL STATE
  // --------------------------------------------------

  if (tenant && isTenantBlocked(tenant)) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10">
        <TenantFaviconAndTitle
          pageTitle="Blocked"
          tenant={tenant}
        />

        <TenantBlockedState
          title="School Workspace Unavailable"
          description={getTenantBlockReason(tenant)}
        />
      </div>
    );
  }

  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:py-12">
      <TenantFaviconAndTitle
        pageTitle="Login"
        tenant={tenant}
      />

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-2">

        {/* SCHOOL BRANDING */}
        <div className="hidden lg:block">
          <TenantBrandCard tenant={tenant} />
        </div>

        {/* LOGIN CARD */}
        <div className="mx-auto w-full max-w-lg">
          <div className="card overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/90 p-5 shadow-2xl shadow-black/20 sm:p-8">

            {/* MOBILE SCHOOL BRANDING */}
            <div className="mb-6 lg:hidden">
              <div className="mb-3 flex items-center gap-3">
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.schoolName || "School logo"}
                    className="h-12 w-12 rounded-xl bg-white object-contain p-1"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                    <School size={25} />
                  </div>
                )}

                <div>
                  <p className="font-bold text-white">
                    {tenant?.schoolName || "EduTrack"}
                  </p>

                  <p className="text-xs text-slate-400">
                    School Management Portal
                  </p>
                </div>
              </div>
            </div>

            {/* HEADING */}
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <Lock size={23} />
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {tenant?.schoolName
                  ? `Login to ${tenant.schoolName}`
                  : "Welcome to EduTrack"}
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Access your school workspace securely.
              </p>

              {tenant?.slug && (
                <p className="mt-2 inline-flex rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                  {tenant.slug}.edutrack.cloud
                </p>
              )}
            </div>

            {/* ACCOUNT TYPE SELECTOR */}
            <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-slate-800/80 p-1">
              <button
                type="button"
                onClick={() => switchMode("staff")}
                aria-pressed={mode === "staff"}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  mode === "staff"
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <UserRound size={18} />
                Staff / Admin
              </button>

              <button
                type="button"
                onClick={() => switchMode("student")}
                aria-pressed={mode === "student"}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  mode === "student"
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <GraduationCap size={18} />
                Student
              </button>
            </div>

            {/* LOGIN DESCRIPTION */}
            <p className="mt-5 text-sm leading-6 text-slate-400">
              {mode === "student"
                ? "Sign in using the admission number and password provided by your school."
                : "Sign in using your registered email address or school-issued Employee ID."}
            </p>

            {/* LOGIN FORM */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >

              {/* STUDENT / STAFF IDENTIFIER */}
              {mode === "student" ? (
                <div>
                  <label
                    htmlFor="admissionNumber"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Admission Number
                  </label>

                  <div className="relative">
                    <GraduationCap
                      className="absolute left-3 top-3 text-slate-400"
                      size={20}
                    />

                    <input
                      id="admissionNumber"
                      name="admissionNumber"
                      type="text"
                      autoComplete="username"
                      required
                      maxLength={64}
                      className="input min-h-12 w-full pl-11"
                      placeholder="Enter your admission number"
                      value={form.admissionNumber}
                      onChange={(e) =>
                        updateForm(
                          "admissionNumber",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="identifier"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Email or Employee ID
                  </label>

                  <div className="relative">
                    <UserRound
                      className="absolute left-3 top-3 text-slate-400"
                      size={20}
                    />

                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      maxLength={254}
                      className="input min-h-12 w-full pl-11"
                      placeholder="Enter email or Employee ID"
                      value={form.identifier}
                      onChange={(e) =>
                        updateForm(
                          "identifier",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {!tenant?.slug && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Employee ID login requires your
                      school's portal address. Email login
                      is available from the main EduTrack
                      portal.
                    </p>
                  )}
                </div>
              )}

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-slate-400"
                    size={20}
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    className="input min-h-12 w-full pl-11 pr-12"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      updateForm(
                        "password",
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-3 text-slate-400 transition hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : mode === "student" ? (
                  <>
                    <GraduationCap size={19} />
                    Student Login
                  </>
                ) : (
                  <>
                    <UserRound size={19} />
                    Staff Login
                  </>
                )}
              </button>
            </form>

            {/* HELP TEXT */}
            <div className="mt-6 border-t border-slate-700 pt-5">
              {mode === "student" ? (
                <p className="text-center text-xs leading-5 text-slate-400">
                  Forgot your password? Contact your school
                  administrator for help resetting it.
                </p>
              ) : (
                <p className="text-center text-xs leading-5 text-slate-400">
                  Having trouble signing in? Contact your
                  school administrator for assistance.
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Powered by EduTrack
          </p>
        </div>
      </div>
    </div>
  );
}
