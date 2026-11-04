

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
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

  const [attempt, setAttempt] = useState<ExamAttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
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
    setNotice("");

    try {
      const response = await api.post(`/cbt/exams/${examId}/start`);
      const data: ExamAttemptData = response.data?.data;

      if (!data?.attemptId || !data?.exam) {
        throw new Error("The exam information returned by the server is incomplete.");
      }

      if (!Array.isArray(data.exam.questions)) {
        throw new Error("The server did not return the exam questions correctly.");
      }

      setAttempt(data);
      setAnswers(data.answers || {});
      setCurrentQuestion(0);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "We could not load your exam. Please try again."
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
      setRemainingSeconds(
        Math.max(
          0,
          Math.floor(
            (new Date(attempt.deadline).getTime() - Date.now()) / 1000
          )
        )
      );
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

  const questions = attempt?.exam.questions ?? [];
  const question = questions[currentQuestion];

  const answeredCount = questions.filter(
    (item) => answers[item._id] !== undefined
  ).length;

  const saveAnswers = async () => {
    if (!attempt || deadlinePassed || submitted || saving || submitting) {
      return false;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.patch(
        `/cbt/exams/attempts/${attempt.attemptId}/answers`,
        { answers }
      );

      setNotice("Your answers have been saved successfully.");
      return true;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "We could not save your answers. Check your connection and try again."
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitExam = async () => {
    if (!attempt || deadlinePassed || submitted || submitting || saving) {
      return;
    }

    const unanswered = questions.length - answeredCount;

    const confirmation =
      unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Unanswered questions will receive no marks. Do you want to submit your exam?`
        : "Are you sure you want to submit your exam? You cannot change your answers afterward.";

    if (!window.confirm(confirmation)) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      // Save the latest answers before submitting.
      await api.patch(
        `/cbt/exams/attempts/${attempt.attemptId}/answers`,
        { answers }
      );

      const response = await api.post(
        `/cbt/exams/attempts/${attempt.attemptId}/submit`
      );

      const result = response.data?.data;

      setSubmitted(true);

      if (
        typeof result?.score === "number" &&
        typeof result?.totalMarks === "number"
      ) {
        setNotice(
          `Your exam was submitted successfully. Score: ${result.score}/${result.totalMarks}.`
        );
      } else {
        setNotice("Your exam was submitted successfully.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Submission failed. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center gap-3 bg-slate-50 p-6 text-slate-800">
        <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
        <p className="font-medium">Loading your exam questions...</p>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="mx-auto max-w-2xl p-4 sm:p-6">
        <section className="rounded-2xl border border-red-200 bg-white p-5 text-slate-900 shadow-sm">
          <AlertCircle className="mb-3 h-7 w-7 text-red-600" />
          <h1 className="text-xl font-bold">Unable to open your exam</h1>
          <p className="mt-2 break-words text-sm leading-6 text-slate-700">
            {error || "We could not load the exam."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadAttempt()}
              className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => router.push("/student/exams")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Return to my exams
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
        {/* Top navigation and timer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/student/exams")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            My exams
          </button>

          <div
            role="timer"
            aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 font-mono text-base font-bold ${
              remainingSeconds < 300
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <Clock3 className="h-5 w-5" />
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Exam information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-700">
              <BookOpen className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                {attempt.exam.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Read each question carefully and select your answer.
              </p>
            </div>
          </div>

          {attempt.exam.instructions?.trim() && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
              <h2 className="text-sm font-bold text-blue-950">
                Instructions
              </h2>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                {attempt.exam.instructions}
              </p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-600">
                Total questions
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {questions.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-600">
                Questions answered
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {answeredCount} of {questions.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-600">
                Time allowed
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {attempt.exam.durationMinutes} minutes
              </p>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="mt-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label="Questions answered"
                aria-valuemin={0}
                aria-valuemax={questions.length}
                aria-valuenow={answeredCount}
              >
                <div
                  className="h-full rounded-full bg-blue-700 transition-all"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {answeredCount === questions.length
                  ? "You have answered every question."
                  : `${questions.length - answeredCount} question(s) remaining.`}
              </p>
            </div>
          )}
        </section>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <p className="break-words">{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <p className="break-words">{notice}</p>
          </div>
        )}

        {deadlinePassed && !submitted && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Your exam time has ended. The system is not accepting late
            submissions. Please contact your school administrator for help.
          </div>
        )}

        {/* Empty exam guard */}
        {questions.length === 0 && !submitted && (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-950">
              No questions were returned
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This exam does not contain any questions in the data received
              from the server. Please contact your school administrator.
            </p>
          </section>
        )}

        {/* Submitted confirmation */}
        {submitted ? (
          <section className="rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Exam submitted successfully
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your answers have been submitted to your school.
            </p>
            <button
              type="button"
              onClick={() => router.push("/student/exams")}
              className="mt-6 min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Return to my exams
            </button>
          </section>
        ) : question ? (
          <>
            {/* Question and answers */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-700">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                  <h2 className="mt-3 whitespace-pre-wrap break-words text-lg font-bold leading-7 text-slate-950 sm:text-xl">
                    {question.text || "Question text is missing."}
                  </h2>
                </div>

                <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                  {question.marks}{" "}
                  {question.marks === 1 ? "mark" : "marks"}
                </span>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Select one answer:
                </h3>

                {Array.isArray(question.options) &&
                question.options.length > 0 ? (
                  <div className="space-y-3">
                    {question.options.map((option, index) => {
                      const selected = answers[question._id] === index;
                      const letter = String.fromCharCode(65 + index);

                      return (
                        <button
                          key={`${question._id}-${index}`}
                          type="button"
                          disabled={deadlinePassed}
                          aria-pressed={selected}
                          onClick={() => {
                            setAnswers((previous) => ({
                              ...previous,
                              [question._id]: index,
                            }));
                            setNotice("");
                            setError("");
                          }}
                          className={`flex min-h-14 w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                            selected
                              ? "border-blue-700 bg-blue-50 ring-2 ring-blue-600"
                              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                              selected
                                ? "border-blue-700 bg-blue-700 text-white"
                                : "border-slate-300 bg-white text-slate-800"
                            }`}
                          >
                            {letter}
                          </span>

                          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 text-base leading-6 text-slate-950">
                            {option || "(Empty answer option)"}
                          </span>

                          {selected && (
                            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-950">
                      Answer options are missing
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-900">
                      The server returned this question without any answer
                      options. Your school administrator needs to check the
                      question in the exam editor.
                    </p>
                  </div>
                )}
              </div>

              {/* Question navigation */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  disabled={currentQuestion === 0}
                  onClick={() =>
                    setCurrentQuestion((value) => Math.max(0, value - 1))
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next question
                </button>
              </div>
            </section>

            {/* Review and submission */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                Review your answers
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Choose a question number to review it. Unanswered questions
                receive no marks. Submit when you are ready.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {questions.map((item, index) => {
                  const selected = index === currentQuestion;
                  const answered = answers[item._id] !== undefined;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setCurrentQuestion(index)}
                      aria-label={`Open question ${index + 1}${
                        answered ? ", answered" : ", unanswered"
                      }`}
                      aria-current={selected ? "step" : undefined}
                      className={`flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-bold ${
                        selected
                          ? "border-blue-700 bg-blue-700 text-white"
                          : answered
                            ? "border-green-300 bg-green-50 text-green-900"
                            : "border-slate-300 bg-white text-slate-800"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-600">
                Blue: current question. Green: answered. White: unanswered.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void saveAnswers()}
                  disabled={
                    saving ||
                    submitting ||
                    deadlinePassed ||
                    submitted ||
                    questions.length === 0
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {saving ? "Saving answers..." : "Save my answers"}
                </button>

                <button
                  type="button"
                  onClick={() => void submitExam()}
                  disabled={
                    submitting ||
                    saving ||
                    deadlinePassed ||
                    submitted ||
                    questions.length === 0
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {submitting ? "Submitting exam..." : "Submit my exam"}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
