
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import api from "../../../../../../lib/axios";

type ExamQuestion = {
  _id: string;
  text: string;
  options: string[];
  marks: number;
};

type ExamData = {
  _id: string;
  title: string;
  instructions?: string;
  durationMinutes: number;
  questions: ExamQuestion[];
};

type ExamAttemptData = {
  attemptId: string;
  deadline: string;
  exam: ExamData;
  answers: Record<string, number>;
};

export default function StudentTakeExamPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();
  const examId = params.examId;

  const [attempt, setAttempt] =
    useState<ExamAttemptData | null>(null);
  const [answers, setAnswers] =
    useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const loadAttempt = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // The backend returns the existing attempt when the
      // student resumes an exam.
      const response = await api.post(
        `/cbt/exams/${examId}/start`
      );

      const data: ExamAttemptData = response.data.data;

      if (!data?.attemptId || !data?.exam?.questions) {
        throw new Error("The server returned incomplete exam data.");
      }

      setAttempt(data);
      setAnswers(data.answers || {});
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load this exam."
      );
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (examId) void loadAttempt();
  }, [examId, loadAttempt]);

  useEffect(() => {
    if (!attempt || submitted) return;

    const updateTime = () => {
      const seconds = Math.max(
        0,
        Math.floor(
          (new Date(attempt.deadline).getTime() - Date.now()) /
            1000
        )
      );

      setRemainingSeconds(seconds);
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(timer);
  }, [attempt, submitted]);

  const deadlinePassed = remainingSeconds <= 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ].join(":");
  };

  const saveAnswers = async () => {
    if (!attempt || deadlinePassed || submitted) return false;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.patch(
        `/cbt/exams/attempts/${attempt.attemptId}/answers`,
        { answers }
      );

      setNotice("Your answers have been saved.");
      return true;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to save your answers. Please try again."
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitExam = async () => {
    if (!attempt || deadlinePassed || submitted || submitting) {
      return;
    }

    const confirmed = window.confirm(
      "Submit your exam now? You will not be able to change your answers afterward."
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      // Save the latest selections before submitting.
      await api.patch(
        `/cbt/exams/attempts/${attempt.attemptId}/answers`,
        { answers }
      );

      const response = await api.post(
        `/cbt/exams/attempts/${attempt.attemptId}/submit`
      );

      const result = response.data.data;

      setSubmitted(true);

      const score =
        typeof result?.score === "number" ? result.score : null;
      const totalMarks =
        typeof result?.totalMarks === "number"
          ? result.totalMarks
          : null;

      setNotice(
        score !== null && totalMarks !== null
          ? `Exam submitted successfully. Score: ${score}/${totalMarks}.`
          : "Exam submitted successfully."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Submission failed. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Loading your exam...
      </main>
    );
  }

  if (error && !attempt) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          <AlertCircle className="mb-2 h-6 w-6" />
          <p className="font-semibold">Unable to open exam</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={() => void loadAttempt()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-white"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/student/exams")}
            className="ml-2 rounded-lg border px-4 py-2"
          >
            Back to exams
          </button>
        </div>
      </main>
    );
  }

  if (!attempt) return null;

  const questions = attempt.exam.questions;
  const question = questions[currentQuestion];
  const answeredCount = questions.filter(
    (item) => answers[item._id] !== undefined
  ).length;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push("/student/exams")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to exams
        </button>

        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono font-semibold ${
            remainingSeconds < 300
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-gray-200 bg-white text-gray-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatTime(remainingSeconds)}
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-2xl font-bold text-gray-900">
          {attempt.exam.title}
        </h1>

        {attempt.exam.instructions && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
            {attempt.exam.instructions}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>
            Questions: <strong>{questions.length}</strong>
          </span>
          <span>
            Answered:{" "}
            <strong>
              {answeredCount}/{questions.length}
            </strong>
          </span>
          <span>
            Duration:{" "}
            <strong>{attempt.exam.durationMinutes} minutes</strong>
          </span>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          {notice}
        </div>
      )}

      {deadlinePassed && !submitted && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Your exam deadline has passed. The backend currently rejects
          late submissions, so contact your school administrator if
          your attempt has not been submitted.
        </div>
      )}

      {submitted ? (
        <section className="rounded-2xl border bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-xl font-bold">Exam submitted</h2>
          <p className="mt-2 text-gray-600">
            Your submission has been recorded.
          </p>
          <button
            onClick={() => router.push("/student/exams")}
            className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-medium text-white"
          >
            Return to exams
          </button>
        </section>
      ) : (
        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                {question?.text}
              </h2>
            </div>
            <span className="whitespace-nowrap rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {question?.marks} marks
            </span>
          </div>

          <div className="space-y-3">
            {question?.options.map((option, index) => {
              const selected = answers[question._id] === index;

              return (
                <button
                  key={`${question._id}-${index}`}
                  type="button"
                  disabled={deadlinePassed}
                  onClick={() => {
                    setAnswers((previous) => ({
                      ...previous,
                      [question._id]: index,
                    }));
                    setNotice("");
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "border-gray-200 hover:border-gray-400"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="pt-1">{option}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion((value) => Math.max(0, value - 1))
              }
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentQuestion >= questions.length - 1}
              onClick={() =>
                setCurrentQuestion((value) =>
                  Math.min(questions.length - 1, value + 1)
                )
              }
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Next question
            </button>
          </div>

          <div className="mt-7 border-t pt-5">
            <p className="mb-3 text-sm text-gray-600">
              Review your answers before submitting. Unanswered questions
              will receive no marks.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {questions.map((item, index) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-9 min-w-9 rounded-lg border px-2 text-sm ${
                    index === currentQuestion
                      ? "border-blue-700 bg-blue-700 text-white"
                      : answers[item._id] !== undefined
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-gray-200"
                  }`}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveAnswers()}
                disabled={saving || submitting || deadlinePassed}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save answers"}
              </button>

              <button
                type="button"
                onClick={() => void submitExam()}
                disabled={submitting || saving || deadlinePassed}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Submitting..." : "Submit exam"}
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
