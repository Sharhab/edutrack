


"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Search,
  RefreshCw,
  BarChart3,
  Eye,
  X,
} from "lucide-react";

import api from "../../../../lib/axios";
import ExamCreateForm from "./ExamCreateForm";

type ExamStatus = "draft" | "published" | "closed";

type ExamReference =
  | {
      _id: string;
      name?: string;
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

function getErrorMessage(error: unknown, fallback: string): string {
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

function getReferenceName(reference: ExamReference): string {
  if (typeof reference === "object" && reference !== null) {
    return reference.name || reference.level || reference.code || "—";
  }

  return "—";
}

function formatDate(value?: string): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
}

export default function ExamsPage() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "all" | ExamStatus
  >("all");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/cbt/exams");
      const data = response.data?.data;

      setExams(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not load exams."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesStatus =
        statusFilter === "all" || exam.status === statusFilter;

      const className = getReferenceName(exam.classId);
      const subjectName = getReferenceName(exam.subjectId);

      const matchesSearch =
        !query ||
        exam.title.toLowerCase().includes(query) ||
        className.toLowerCase().includes(query) ||
        subjectName.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [exams, search, statusFilter]);

  const draftCount = exams.filter(
    (exam) => exam.status === "draft"
  ).length;

  const publishedCount = exams.filter(
    (exam) => exam.status === "published"
  ).length;

  const closedCount = exams.filter(
    (exam) => exam.status === "closed"
  ).length;

  async function runExamAction(
    exam: Exam,
    action: "publish" | "close"
  ) {
    const confirmation =
      action === "publish"
        ? `Publish "${exam.title}" for students?`
        : `Close "${exam.title}"? Students may no longer be able to continue the exam.`;

    if (!window.confirm(confirmation)) return;

    setActionId(exam._id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/cbt/exams/${exam._id}/${action}`
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

  function openResults(exam: Exam) {
    router.push(
      `/school-admin/exams/${exam._id}/results`
    );
  }

  return (
    <main className="space-y-6 text-slate-100">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
            <BookOpen className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Computer-Based Tests
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create examinations, schedule assessments, publish
              them for students, and review submitted results.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setNotice("");
            setShowCreateForm((current) => !current);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {showCreateForm ? (
            <X className="h-4 w-4" />
          ) : (
            <FilePlus2 className="h-4 w-4" />
          )}
          {showCreateForm ? "Cancel" : "Create exam"}
        </button>
      </header>

      {/* Create exam */}
      {showCreateForm && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">
              Create a new examination
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              aria-label="Close exam form"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ExamCreateForm
            onCancel={() => setShowCreateForm(false)}
            onCreated={async () => {
              setShowCreateForm(false);
              setStatusFilter("all");
              setSearch("");
              setNotice("Exam created successfully as a draft.");
              setError("");
              await loadExams();
            }}
          />
        </section>
      )}

      {/* Dashboard summary */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "All exams",
            count: exams.length,
            icon: BookOpen,
            style: "border-cyan-400/20 bg-cyan-500/[0.06]",
            iconStyle: "text-cyan-300",
          },
          {
            label: "Drafts",
            count: draftCount,
            icon: Clock3,
            style: "border-amber-400/20 bg-amber-500/[0.06]",
            iconStyle: "text-amber-300",
          },
          {
            label: "Published",
            count: publishedCount,
            icon: CheckCircle2,
            style: "border-emerald-400/20 bg-emerald-500/[0.06]",
            iconStyle: "text-emerald-300",
          },
          {
            label: "Closed",
            count: closedCount,
            icon: BarChart3,
            style: "border-violet-400/20 bg-violet-500/[0.06]",
            iconStyle: "text-violet-300",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className={`rounded-2xl border p-4 sm:p-5 ${item.style}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-400">
                  {item.label}
                </p>
                <Icon className={`h-5 w-5 ${item.iconStyle}`} />
              </div>

              <p className="mt-3 text-3xl font-bold text-white">
                {item.count}
              </p>
            </article>
          );
        })}
      </section>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="break-words">{error}</p>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="break-words">{notice}</p>
        </div>
      )}

      {/* Exam list */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="space-y-4 border-b border-white/10 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Exam management
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage exams and open their student results.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadExams()}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by exam, class, or subject"
                aria-label="Search exams"
                className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <select
              aria-label="Filter exams by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | ExamStatus
                )
              }
              className="min-h-11 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Showing {filteredExams.length} of {exams.length} exams
          </p>
        </div>

        {loading && exams.length === 0 ? (
          <div className="p-10 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-400" />
            <p className="mt-3 text-sm text-slate-400">
              Loading examinations...
            </p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <BookOpen className="mx-auto h-10 w-10 text-slate-500" />
            <h3 className="mt-4 font-semibold text-white">
              {exams.length === 0
                ? "No examinations yet"
                : "No matching examinations"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {exams.length === 0
                ? "Create your first examination to begin setting up online assessments for your students."
                : "Try another search term or choose a different status filter."}
            </p>

            {exams.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <FilePlus2 className="h-4 w-4" />
                Create your first exam
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredExams.map((exam) => (
              <article
                key={exam._id}
                className="space-y-4 p-4 transition hover:bg-white/[0.02] sm:p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-base font-semibold text-white sm:text-lg">
                        {exam.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(exam.status)}`}
                      >
                        {exam.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                      <span>
                        Class:{" "}
                        <strong className="font-medium text-slate-200">
                          {getReferenceName(exam.classId)}
                        </strong>
                      </span>
                      <span>
                        Subject:{" "}
                        <strong className="font-medium text-slate-200">
                          {getReferenceName(exam.subjectId)}
                        </strong>
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-3">
                      <p>
                        Questions: {exam.questions?.length ?? 0}
                      </p>
                      <p>
                        Time allowed: {exam.durationMinutes} minutes
                      </p>
                      <p>Starts: {formatDate(exam.startsAt)}</p>
                      <p>Ends: {formatDate(exam.endsAt)}</p>
                    </div>
                  </div>

                  {/* Exam actions */}
                  <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openResults(exam)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cyan-400/30 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
                    >
                      <Eye className="h-4 w-4" />
                      View results
                    </button>

                    {exam.status === "draft" && (
                      <button
                        type="button"
                        disabled={actionId === exam._id}
                        onClick={() =>
                          void runExamAction(exam, "publish")
                        }
                        className="min-h-10 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionId === exam._id
                          ? "Please wait..."
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
                        className="min-h-10 rounded-lg border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionId === exam._id
                          ? "Please wait..."
                          : "Close exam"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
