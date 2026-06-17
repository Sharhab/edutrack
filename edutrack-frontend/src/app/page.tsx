"use client";

import Link from "next/link";
import { GraduationCap, ShieldCheck, Users, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 font-bold">
            ET
          </div>
          <span className="text-lg font-bold tracking-wide">EduTrack</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="btn-secondary">
            Login
          </Link>

          <Link href="/onboarding" className="btn-primary">
            Start Free Trial
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
          Modern School Management{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            SaaS Platform
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Manage students, teachers, results, attendance, and payments in one
          powerful platform. Built for modern schools in Nigeria and beyond.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/onboarding" className="btn-primary px-8 py-4 text-lg">
            Start Free Trial
          </Link>

          <Link href="/login" className="btn-secondary px-8 py-4 text-lg">
            Book Demo
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<Users />}
            title="Student Management"
            desc="Manage students, parents, and records with ease."
          />
          <FeatureCard
            icon={<GraduationCap />}
            title="Results & Exams"
            desc="Track performance and generate results instantly."
          />
          <FeatureCard
            icon={<BarChart3 />}
            title="Analytics"
            desc="Understand school performance with real insights."
          />
          <FeatureCard
            icon={<ShieldCheck />}
            title="Secure SaaS"
            desc="Multi-tenant architecture with full data isolation."
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <h2 className="mb-12 text-center text-3xl font-bold">Simple Pricing</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <PricingCard
            name="Starter"
            price="₦10,000"
            features={["Basic features", "Up to 200 students", "Email support"]}
          />

          <PricingCard
            name="Standard"
            price="₦25,000"
            highlighted
            features={[
              "All core features",
              "Up to 1000 students",
              "Priority support",
            ]}
          />

          <PricingCard
            name="Premium"
            price="₦50,000"
            features={[
              "Unlimited students",
              "Advanced analytics",
              "Dedicated support",
            ]}
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
          <h2 className="text-3xl font-bold">Ready to digitize your school?</h2>

          <p className="mt-4 text-slate-400">
            Join schools already using EduTrack to manage their operations.
          </p>

          <Link
            href="/onboarding"
            className="btn-primary mt-6 inline-block px-8 py-4 text-lg"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`card p-6 ${
        highlighted
          ? "ring-2 ring-cyan-400/40 bg-gradient-to-b from-cyan-500/10 to-transparent"
          : ""
      }`}
    >
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-4 text-3xl font-black">{price}</p>

      <ul className="mt-6 space-y-2 text-sm text-slate-400">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <Link href="/onboarding" className="btn-primary mt-6 block text-center">
        Choose Plan
      </Link>
    </div>
  );
}