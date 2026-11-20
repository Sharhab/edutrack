
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CircleHelp,
  ClipboardList,
  AlertCircle,
  User,
} from "lucide-react";

import api from "../../../../../../../lib/axios";

type ReviewOption = {
  index: number;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
};

type ReviewQuestion = {
  questionId: string;
  questionNumber: number;
  questionText: string;
  options: ReviewOption[];
  selectedAnswer: string | null;
  correctAnswer: string;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  marks: number;
  marksAwarded: number;
};

type ReviewData = {
  exam: {
    _id: string;
    title: string;
    class: any;
    subject: any;
  };
  student: {
    _id: string | null;
    name: string;
    admissionNumber: string;
  };
  attempt: {
    _id: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    score: number;
    totalMarks: number;
    percentage: number;
  };
  summary: {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  };
  questions: ReviewQuestion[];
};

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Could not load student answer review."
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function referenceName(value: any) {
  if (!value) return "—";

  if (typeof value === "object") {
    return value.name || value.level || value.code || "—";
  }

  return String(value);
}

export default function CbtAttemptReviewPage() {
  const params = useParams<{
    examId: string;
    attemptId: string;
  }>();

  const router = useRouter();

  const { examId, attemptId } = params;

  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReview = useCallback(async (refresh = false) => {
    if (!examId || !attemptId) return;

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get(
        `/cbt/exams/${examId}/attempts/${attemptId}/review`
      );

      const result = response.data?.data;

      if (
        !result ||
        !result.student ||
        !result.attempt ||
        !Array.isArray(result.questions)
      ) {
        throw new Error("Unexpected answer review response.");
      }

      setData(result);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId, attemptId]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  return (
    <main className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/school-admin/exams/${examId}/results`
              )
            }
            aria-label="Back to exam results"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Student Answer Review
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Review submitted answers and automatic marking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadReview(true)}
          disabled={loading || refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load answer review
              </p>

              <p className="mt-1">{error}</p>

              <button
                type="button"
                onClick={() => void loadReview(true)}
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="rounded-2xl border border-white/10 p-12 text-center text-slate-400">
          Loading student answers...
        </div>
      )}

      {data && (
        <>
          {/* Student information */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                <User size={24} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-bold text-white">
                  {data.student.name || "Unknown student"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Admission Number:{" "}
                  <span className="font-medium text-slate-200">
                    {data.student.admissionNumber || "—"}
                  </span>
                </p>

                <p className="mt-3 break-words text-sm text-cyan-300">
                  {data.exam.title}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                  <span>
                    Class: {referenceName(data.exam.class)}
                  </span>

                  <span>
                    Subject: {referenceName(data.exam.subject)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">
                  Started
                </p>

                <p className="mt-1 text-sm text-white">
                  {formatDate(data.attempt.startedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Submitted
                </p>

                <p className="mt-1 text-sm text-white">
                  {formatDate(data.attempt.submittedAt)}
                </p>
              </div>
            </div>
          </section>

          {/* Score */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <article className="col-span-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5">
              <p className="text-sm text-cyan-200">
                Final score
              </p>

              <p className="mt-2 text-3xl font-bold text-white">
                {data.attempt.score} / {data.attempt.totalMarks}
              </p>

              <p className="mt-1 text-sm text-cyan-200">
                {Number(data.attempt.percentage || 0).toFixed(1)}%
              </p>
            </article>

            <article className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <CheckCircle2 className="text-emerald-300" />

              <p className="mt-3 text-xs text-emerald-200">
                Correct
              </p>

              <p className="text-2xl font-bold text-white">
                {data.summary.correctCount}
              </p>
            </article>

            <article className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <XCircle className="text-red-300" />

              <p className="mt-3 text-xs text-red-200">
                Wrong
              </p>

              <p className="text-2xl font-bold text-white">
                {data.summary.wrongCount}
              </p>
            </article>

            <article className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <CircleHelp className="text-amber-300" />

              <p className="mt-3 text-xs text-amber-200">
                Unanswered
              </p>

              <p className="text-2xl font-bold text-white">
                {data.summary.unansweredCount}
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <ClipboardList className="text-cyan-300" />

              <p className="mt-3 text-xs text-slate-400">
                Total questions
              </p>

              <p className="text-2xl font-bold text-white">
                {data.summary.totalQuestions}
              </p>
            </article>
          </section>

          {/* Legend */}
          <section className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs">
            <span className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 size={15} />
              Correct answer
            </span>

            <span className="flex items-center gap-2 text-red-300">
              <XCircle size={15} />
              Wrong selection
            </span>

            <span className="flex items-center gap-2 text-amber-300">
              <CircleHelp size={15} />
              Unanswered
            </span>
          </section>

          {/* Questions */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Question-by-question review
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                The correct answer and student's selection are shown below.
              </p>
            </div>

            {data.questions.map((question) => (
              <article
                key={question.questionId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                {/* Question heading */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
                      {question.questionNumber}
                    </span>

                    <span className="font-semibold text-white">
                      Question {question.questionNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {question.marksAwarded} / {question.marks} marks
                    </span>

                    {question.selectedAnswer === null ? (
                      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                        Unanswered
                      </span>
                    ) : question.isCorrect ? (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Correct
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                        Wrong
                      </span>
                    )}
                  </div>
                </div>

                {/* Question content */}
                <div className="space-y-4 p-4 sm:p-5">
                  <p className="whitespace-pre-wrap break-words font-medium leading-7 text-white">
                    {question.questionText}
                  </p>

                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isSelected = option.isSelected;
                      const isCorrect = option.isCorrect;

                      let optionStyle =
                        "border-white/10 bg-slate-900/50";

                      if (isCorrect) {
                        optionStyle =
                          "border-emerald-400/40 bg-emerald-500/10";
                      } else if (isSelected) {
                        optionStyle =
                          "border-red-400/40 bg-red-500/10";
                      }

                      return (
                        <div
                          key={option.index}
                          className={`flex items-start gap-3 rounded-xl border p-3 ${optionStyle}`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-slate-300">
                            {String.fromCharCode(65 + option.index)}
                          </span>

                          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 text-sm leading-6 text-slate-200">
                            {option.text}
                          </p>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {isCorrect && (
                              <span className="text-xs font-semibold text-emerald-300">
                                Correct answer
                              </span>
                            )}

                            {isSelected && (
                              <span
                                className={`text-xs font-semibold ${
                                  isCorrect
                                    ? "text-emerald-300"
                                    : "text-red-300"
                                }`}
                              >
                                Student selected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer summary */}
                  <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-900/70 p-3">
                      <p className="text-xs text-slate-400">
                        Student's answer
                      </p>

                      <p className="mt-2 break-words text-sm font-semibold text-white">
                        {question.selectedAnswer ?? "Not answered"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-500/5 p-3">
                      <p className="text-xs text-emerald-300">
                        Correct answer
                      </p>

                      <p className="mt-2 break-words text-sm font-semibold text-white">
                        {question.correctAnswer}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {data.questions.length === 0 && (
              <div className="rounded-xl border border-white/10 p-8 text-center text-slate-400">
                No questions were found for this exam.
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
