


"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  RefreshCw,
  RotateCw,
} from "lucide-react";

import api from "../../../../lib/axios";

type ExamAvailability =
  | "upcoming"
  | "available"
  | "in_progress"
  | "submitted";

type StudentExam = {
  _id: string;
  title: string;
  instructions?: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  availability: ExamAvailability;
  attemptId: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  totalMarks: number | null;
};

type ApiResponse = {
  success: boolean;
  data: StudentExam[];
  message?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: ExamAvailability) {
  switch (status) {
    case "available":
      return "Available now";
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Submitted";
    default:
      return "Upcoming";
  }
}

function statusClasses(status: ExamAvailability) {
  switch (status) {
    case "available":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
    case "in_progress":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "submitted":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function StudentExamsPage() {
  const router = useRouter();

  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadExams = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get<ApiResponse>(
        "/cbt/exams/student"
      );

      const examData = response.data?.data;

      if (!Array.isArray(examData)) {
        throw new Error("Invalid exam response from the server.");
      }

      setExams(examData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your exams. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  function openExam(exam: StudentExam) {
    if (
      openingId ||
      exam.availability === "upcoming" ||
      exam.availability === "submitted"
    ) {
      return;
    }

    setError("");
    setOpeningId(exam._id);

    // The take page creates or resumes the attempt.
    // Avoid calling the start endpoint twice.
    router.push(`/student/exams/${exam._id}/take`);
  }

  const submittedCount = exams.filter(
    (exam) => exam.availability === "submitted"
  ).length;

  const inProgressCount = exams.filter(
    (exam) => exam.availability === "in_progress"
  ).length;

  const availableCount = exams.filter(
    (exam) => exam.availability === "available"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 text-white sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
              <BookOpen size={27} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                My CBT Exams
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                View your exams, start available exams, and continue unfinished attempts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadExams(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh exams
          </button>
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadExams(true)}
              className="mt-2 inline-flex items-center gap-2 font-semibold underline underline-offset-4"
            >
              <RotateCw size={14} />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && exams.length > 0 && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="text-sm text-slate-400">Available</p>
            <p className="mt-1 text-2xl font-bold text-cyan-300">
              {availableCount}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm text-slate-400">In progress</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">
              {inProgressCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <p className="text-sm text-slate-400">Submitted</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {submittedCount}
            </p>
          </div>
        </section>
      )}

      {/* Exam count */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Your examinations</h2>
          <p className="mt-1 text-xs text-slate-500">
            {loading
              ? "Loading your exams..."
              : `${exams.length} exam(s) found`}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] text-slate-300">
          <Loader2 size={21} className="animate-spin" />
          Loading your exams...
        </div>
      ) : exams.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <BookOpen
            size={36}
            className="mx-auto mb-3 text-slate-500"
          />
          <h2 className="font-semibold text-white">
            No exams available
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
            Published examinations assigned to your class will appear here.
            Please check again later.
          </p>

          <button
            type="button"
            onClick={() => void loadExams(true)}
            disabled={refreshing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Check again
          </button>
        </div>
      ) : (
        /* Exam cards */
        <div className="grid gap-4 lg:grid-cols-2">
          {exams.map((exam) => {
            const submitted = exam.availability === "submitted";
            const upcoming = exam.availability === "upcoming";
            const inProgress = exam.availability === "in_progress";
            const busy = openingId === exam._id;

            return (
              <article
                key={exam._id}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold text-white">
                      {exam.title || "Untitled examination"}
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-400">
                      {exam.instructions ||
                        "Follow the examination instructions displayed before you begin."}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                      exam.availability
                    )}`}
                  >
                    {statusLabel(exam.availability)}
                  </span>
                </div>

                <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock
                      size={16}
                      className="shrink-0 text-cyan-300"
                    />
                    <span>
                      Duration: {exam.durationMinutes} minutes
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <CalendarClock
                      size={16}
                      className="mt-0.5 shrink-0 text-cyan-300"
                    />

                    <div className="min-w-0">
                      <p>
                        <span className="text-slate-500">Starts:</span>{" "}
                        {formatDate(exam.startsAt)}
                      </p>

                      <p className="mt-1">
                        <span className="text-slate-500">Ends:</span>{" "}
                        {formatDate(exam.endsAt)}
                      </p>
                    </div>
                  </div>

                  {inProgress && exam.startedAt && (
                    <p className="text-xs text-amber-300">
                      Started: {formatDate(exam.startedAt)}
                    </p>
                  )}

                  {submitted && exam.submittedAt && (
                    <p className="text-xs text-slate-400">
                      Submitted: {formatDate(exam.submittedAt)}
                    </p>
                  )}

                  {submitted && exam.score !== null && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 p-3 text-emerald-200">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span className="font-semibold">
                        Score: {exam.score}
                        {exam.totalMarks !== null
                          ? ` / ${exam.totalMarks}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-5">
                  {submitted ? (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-center text-sm font-medium text-emerald-200">
                      <CheckCircle2
                        size={17}
                        className="mr-2 inline-block"
                      />
                      Examination submitted
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={upcoming || openingId !== null}
                      onClick={() => openExam(exam)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <PlayCircle size={18} />
                      )}

                      {busy
                        ? "Opening examination..."
                        : inProgress
                          ? "Continue examination"
                          : upcoming
                            ? "Not open yet"
                            : "Start examination"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
