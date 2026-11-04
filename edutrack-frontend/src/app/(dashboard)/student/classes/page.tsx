
"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/axios";
import { AlertCircle, BookOpen, Loader2 } from "lucide-react";

type StudentProfile = {
  fullName: string;
  admissionNumber: string;
  class: {
    id: string;
    name: string;
    level?: string;
    code?: string;
  } | null;
};

export default function StudentClassesPage() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClass() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/student-portal/me");
        const profile = response.data?.data;

        if (!profile) {
          throw new Error("Student profile was not returned.");
        }

        if (!cancelled) {
          setStudent(profile);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Unable to load your class. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadClass();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-8 text-slate-400">
        <Loader2 className="animate-spin" />
        Loading your class...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 shrink-0" />
          <div>
            <h1 className="font-semibold">Unable to load My Classes</h1>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">My Classes</h1>
        <p className="mt-1 text-sm text-slate-400">
          View your student information and assigned class.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-3">
            <BookOpen className="text-cyan-400" size={26} />
          </div>
          <div>
            <h2 className="font-semibold text-white">
              {student?.class?.name || "No class assigned"}
            </h2>
            <p className="text-sm text-slate-400">
              {student?.class?.level || "Class level not specified"}
              {student?.class?.code
                ? ` · ${student.class.code}`
                : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-sm text-slate-400">Student name</p>
            <p className="mt-1 font-medium text-white">
              {student?.fullName || "—"}
            </p>
          </div>

          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-sm text-slate-400">Admission number</p>
            <p className="mt-1 font-medium text-white">
              {student?.admissionNumber || "—"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
