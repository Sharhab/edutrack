"use client";

import { Bell, BookOpen, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import SectionCard from "../ui/SectionCard";

export default function ParentDashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
          Parent Portal
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">
          Parent Dashboard
        </h1>
        <p className="mt-2 text-slate-400">
          View your children, results, attendance summary, and school announcements.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button onClick={() => router.push("/parent/children")} className="card p-5 text-left">
          <GraduationCap className="text-cyan-300" />
          <p className="mt-4 text-lg font-bold text-white">My Children</p>
          <p className="text-sm text-slate-400">View linked children</p>
        </button>

        <button onClick={() => router.push("/parent/results")} className="card p-5 text-left">
          <BookOpen className="text-cyan-300" />
          <p className="mt-4 text-lg font-bold text-white">Results</p>
          <p className="text-sm text-slate-400">Check academic performance</p>
        </button>

        <button onClick={() => router.push("/parent/announcements")} className="card p-5 text-left">
          <Bell className="text-cyan-300" />
          <p className="mt-4 text-lg font-bold text-white">Announcements</p>
          <p className="text-sm text-slate-400">Read school notices</p>
        </button>
      </div>

      <SectionCard title="Parent Actions" subtitle="Quick access">
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => router.push("/parent/children")}>
            View Children
          </button>
          <button className="btn-secondary" onClick={() => router.push("/parent/results")}>
            View Results
          </button>
        </div>
      </SectionCard>
    </div>
  );
}