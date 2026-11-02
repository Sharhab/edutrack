
"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../../../../lib/axios";
import ExamCreateForm from "./ExamCreateForm";
type ExamStatus = "draft" | "published" | "closed";

type Exam = {
  _id: string;
  title: string;
  status: ExamStatus;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  questions?: { _id: string }[];
  classId?: { _id: string; name: string; level?: string } | string;
  subjectId?: { _id: string; name: string; code?: string } | string;
};

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function statusStyle(status: ExamStatus) {
  switch (status) {
    case "published":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    case "closed":
      return "border-red-400/30 bg-red-500/10 text-red-300";
    default:
      return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  }
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
 const [showCreateForm, setShowCreateForm] = useState(false);
  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/exams", {
        params:
          statusFilter === "all"
            ? {}
            : { status: statusFilter },
      });

      const data = response.data?.data;
      setExams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        getErrorMessage(err, "Could not load exams.")
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  async function runExamAction(
    exam: Exam,
    action: "publish" | "close"
  ) {
    const message =
      action === "publish"
        ? `Publish "${exam.title}" for students?`
        : `Close "${exam.title}"? Students will not be able to continue saving answers.`;

    if (!window.confirm(message)) return;

    setActionId(exam._id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/exams/${exam._id}/${action}`
      );

      setNotice(
        response.data?.message ||
          `Exam ${action === "publish" ? "published" : "closed"} successfully.`
      );

      await loadExams();
    } catch (err: any) {
      setError(
        getErrorMessage(err, `Could not ${action} the exam.`)
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Computer-Based Tests
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create, schedule, publish, and manage school exams.
          </p>
        </div>
<button
  type="button"
  onClick={() => setShowCreateForm(true)}
  className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
>
  + Create exam
</button>
      
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(
          [
            ["All exams", exams.length],
            [
              "Drafts",
              exams.filter((exam) => exam.status === "draft").length,
            ],
            [
              "Published",
              exams.filter((exam) => exam.status === "published").length,
            ],
          ] as [string, number][]
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {count}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
        >
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
          <h2 className="font-semibold text-white">
            Exam management
          </h2>

          <div className="flex gap-2">
            <select
              aria-label="Filter exams by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>

            <button
              type="button"
              onClick={() => void loadExams()}
              disabled={loading}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-400">
            Loading exams…
          </p>
        ) : exams.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold text-white">
              No exams found
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Create your first exam to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {exams.map((exam) => (
              <article
                key={exam._id}
                className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {exam.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(exam.status)}`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400">
                    Class:{" "}
                    {typeof exam.classId === "object"
                      ? exam.classId?.name || "—"
                      : "—"}
                    {" · "}
                    Subject:{" "}
                    {typeof exam.subjectId === "object"
                      ? exam.subjectId?.name || "—"
                      : "—"}
                  </p>

                  <p className="text-xs text-slate-500">
                    {exam.questions?.length ?? 0} questions
                    {" · "}
                    {exam.durationMinutes} minutes
                    {" · "}
                    {new Date(exam.startsAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {exam.status === "draft" && (
                    <button
                      type="button"
                      disabled={actionId === exam._id}
                      onClick={() =>
                        void runExamAction(exam, "publish")
                      }
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {actionId === exam._id
                        ? "Working…"
                        : "Publish"}
                    </button>
                  )}

                  {exam.status === "published" && (
                    <button
                      type="button"
                      disabled={actionId === exam._id}
                      onClick={() =>
                        void runExamAction(exam, "close")
                      }
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {actionId === exam._id
                        ? "Working…"
                        : "Close exam"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
