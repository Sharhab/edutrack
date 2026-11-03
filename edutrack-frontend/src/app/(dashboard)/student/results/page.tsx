
"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/axios";
import { AlertCircle, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "../../../../../components/providers/AuthProvider";

type StudentUser = {
  studentId?: string;
};

type ResultRecord = {
  _id: string;
  subjectName?: string;
  subjectCode?: string;
  className?: string;
  sessionName?: string;
  termName?: string;
  ca1?: number | null;
  ca2?: number | null;
  assignment?: number | null;
  exam?: number | null;
  total?: number;
  grade?: string;
  remark?: string;
  status?: string;
  published?: boolean;
};

export default function StudentResultsPage() {
  const { user } = useAuth();

  const [results, setResults] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError("");

      try {
        const studentId = (user as (typeof user & StudentUser))
          ?.studentId;

        if (!studentId) {
          throw new Error(
            "Your student account is not linked to a student record. Please contact your school administrator."
          );
        }

        const response = await api.get(
          `/results/student/${encodeURIComponent(studentId)}`
        );

        const data = response.data?.data;

        if (!Array.isArray(data)) {
          throw new Error("The results response was invalid.");
        }

        if (!cancelled) {
          setResults(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load your results."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (user) {
      loadResults();
    } else {
      setLoading(false);
      setError("Please sign in to view your results.");
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const publishedResults = results.filter(
    (result) =>
      result.published === true ||
      result.status === "published"
  );

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-8 text-slate-300">
        <Loader2 className="animate-spin" />
        Loading your results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 shrink-0" />
          <div>
            <h1 className="font-semibold">Unable to load results</h1>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">
          My Results
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          View your published academic results.
        </p>
      </header>

      {publishedResults.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <BookOpen className="mx-auto mb-3 text-cyan-400" size={32} />
          <h2 className="font-semibold text-white">
            No published results yet
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Your results will appear here when your school publishes them.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {publishedResults.map((result) => (
            <article
              key={result._id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">
                    {result.subjectName || "Subject"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {[result.className, result.sessionName, result.termName]
                      .filter(Boolean)
                      .join(" · ") || "Academic result"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-300">
                    {result.total ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400">Total score</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["CA 1", result.ca1],
                  ["CA 2", result.ca2],
                  ["Assignment", result.assignment],
                  ["Exam", result.exam],
                ].map(([label, score]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl bg-black/20 p-3"
                  >
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 font-semibold text-white">
                      {score ?? "—"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
                <p className="text-slate-300">
                  Grade: <strong className="text-white">{result.grade || "—"}</strong>
                </p>
                <p className="text-slate-300">
                  Remark: <strong className="text-white">{result.remark || "—"}</strong>
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
