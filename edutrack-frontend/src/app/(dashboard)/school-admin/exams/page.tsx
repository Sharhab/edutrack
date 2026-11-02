

"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../../../../lib/axios";
import ExamCreateForm from "./ExamCreateForm";

type ExamStatus = "draft" | "published" | "closed";

type ExamReference =
  | {
      _id: string;
      name: string;
      level?: string;
      code?: string;
    }
  | string
  | null
  | undefined;

type Exam = {
  _id: string;
  title: string;
  status: ExamStatus;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  questions?: { _id: string }[];
  classId?: ExamReference;
  subjectId?: ExamReference;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  const apiError = error as ApiError;

  return (
    apiError?.response?.data?.message ||
    apiError?.message ||
    fallback
  );
}

function statusStyle(status: ExamStatus): string {
  switch (status) {
    case "published":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";

    case "closed":
      return "border-red-400/30 bg-red-500/10 text-red-300";

    default:
      return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  }
}

function getReferenceName(
  reference: ExamReference
): string {
  if (
    typeof reference === "object" &&
    reference !== null &&
    "name" in reference
  ) {
    return reference.name || "—";
  }

  return "—";
}

function formatDate(value: string): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ExamStatus
  >("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/exams");

      const data = response.data?.data;
      setExams(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Could not load exams.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const filteredExams =
    statusFilter === "all"
      ? exams
      : exams.filter(
          (exam) => exam.status === statusFilter
        );

  const draftCount = exams.filter(
    (exam) => exam.status === "draft"
  ).length;

  const publishedCount = exams.filter(
    (exam) => exam.status === "published"
  ).length;

  async function runExamAction(
    exam: Exam,
    action: "publish" | "close"
  ) {
    const confirmation =
      action === "publish"
        ? `Publish "${exam.title}" for students?`
        : `Close "${exam.title}"? Students will no longer be able to save additional answers.`;

    if (!window.confirm(confirmation)) {
      return;
    }

    setActionId(exam._id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/exams/${exam._id}/${action}`
      );

      setNotice(
        response.data?.message ||
          (action === "publish"
            ? "Exam published successfully."
            : "Exam closed successfully.")
      );

      await loadExams();
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          action === "publish"
            ? "Could not publish the exam."
            : "Could not close the exam."
        )
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Computer-Based Tests
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Create, schedule, publish, and manage your
            school examinations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setNotice("");
            setShowCreateForm((current) => !current);
          }}
          className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {showCreateForm ? "Cancel creation" : "+ Create exam"}
        </button>
      </div>

      {/* Exam creation form */}
      {showCreateForm && (
        <ExamCreateForm
          onCancel={() => setShowCreateForm(false)}
          onCreated={async () => {
            setShowCreateForm(false);
            setStatusFilter("all");
            setNotice("Exam saved as draft successfully.");
            setError("");
            await loadExams();
          }}
        />
      )}

      {/* Global statistics: unaffected by the selected filter */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "All exams",
            count: exams.length,
            style: "border-cyan-400/20",
          },
          {
            label: "Drafts",
            count: draftCount,
            style: "border-amber-400/20",
          },
          {
            label: "Published",
            count: publishedCount,
            style: "border-emerald-400/20",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border ${item.style} bg-white/[0.03] p-5`}
          >
            <p className="text-sm text-slate-400">
              {item.label}
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {item.count}
            </p>
          </div>
        ))}
      </div>

      {/* Feedback messages */}
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

      {/* Exam management */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Exam management
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredExams.length}{" "}
              {filteredExams.length === 1 ? "exam" : "exams"}
              {" "}shown
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter exams by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | ExamStatus
                )
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
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">
              Loading exams…
            </p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold text-white">
              {exams.length === 0
                ? "No exams created yet"
                : "No exams match this filter"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {exams.length === 0
                ? "Create your first exam to get started."
                : "Choose another status to view more exams."}
            </p>

            {exams.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Create your first exam
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredExams.map((exam) => (
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
                    Class: {getReferenceName(exam.classId)}
                    {" · "}
                    Subject: {getReferenceName(exam.subjectId)}
                  </p>

                  <p className="text-xs text-slate-500">
                    {exam.questions?.length ?? 0} questions
                    {" · "}
                    {exam.durationMinutes} minutes
                  </p>

                  <p className="text-xs text-slate-500">
                    Starts: {formatDate(exam.startsAt)}
                  </p>

                  <p className="text-xs text-slate-500">
                    Ends: {formatDate(exam.endsAt)}
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
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
