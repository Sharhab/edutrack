
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Wifi,
  WifiOff,
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

type SaveStatus = "saved" | "saving" | "unsaved" | "offline" | "failed";

const AUTOSAVE_DELAY = 800;
const BACKUP_INTERVAL = 10000;

function sameAnswers(
  first: Record<string, number>,
  second: Record<string, number>
) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function validAnswerMap(
  value: unknown,
  questions: ExamQuestion[]
): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const questionMap = new Map(
    questions.map((question) => [question._id, question])
  );

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([questionId, index]) => {
        const question = questionMap.get(questionId);

        return (
          !!question &&
          Number.isInteger(index) &&
          Number(index) >= 0 &&
          Number(index) < question.options.length
        );
      }
    )
  ) as Record<string, number>;
}

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [online, setOnline] = useState(true);

  const answersRef = useRef<Record<string, number>>({});
  const savedAnswersRef = useRef<Record<string, number>>({});
  const pendingAnswersRef = useRef<Record<string, number> | null>(null);

  // Only one save worker is allowed to run at a time.
  const saveWorkerRef = useRef(false);
  const saveWorkerPromiseRef = useRef<Promise<boolean> | null>(null);

  const submitInFlightRef = useRef(false);
  const submittedRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);
  const attemptRef = useRef<ExamAttemptData | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSubmitInFlightRef = useRef(false);

  const storeLocally = useCallback(
    (attemptId: string, value: Record<string, number>) => {
      try {
        localStorage.setItem(
          `edutrack-cbt-${attemptId}`,
          JSON.stringify({
            answers: value,
            updatedAt: Date.now(),
          })
        );
      } catch {
        // Local recovery is optional. The server remains authoritative.
      }
    },
    []
  );

  const removeLocalBackup = useCallback((attemptId: string) => {
    try {
      localStorage.removeItem(`edutrack-cbt-${attemptId}`);
    } catch {
      // Ignore unavailable local storage.
    }
  }, []);

  const loadLocalBackup = useCallback((attemptId: string) => {
    try {
      const raw = localStorage.getItem(`edutrack-cbt-${attemptId}`);
      if (!raw) return {};

      const parsed = JSON.parse(raw);
      const value = parsed?.answers;

      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(value).filter(
          ([, index]) => Number.isInteger(index) && Number(index) >= 0
        )
      ) as Record<string, number>;
    } catch {
      return {};
    }
  }, []);

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

      const serverAnswers = validAnswerMap(
        data.answers || {},
        data.exam.questions
      );

      const localAnswers = validAnswerMap(
        loadLocalBackup(data.attemptId),
        data.exam.questions
      );

      // Server answers take precedence over the device backup.
      const recoveredAnswers = {
        ...localAnswers,
        ...serverAnswers,
      };

      const normalizedDeadline = new Date(data.deadline).getTime();

      if (!Number.isFinite(normalizedDeadline)) {
        throw new Error("The server returned an invalid exam deadline.");
      }

      setAttempt(data);
      attemptRef.current = data;

      answersRef.current = recoveredAnswers;
      savedAnswersRef.current = serverAnswers;
      pendingAnswersRef.current = sameAnswers(
        recoveredAnswers,
        serverAnswers
      )
        ? null
        : recoveredAnswers;

      setAnswers(recoveredAnswers);
      setCurrentQuestion(0);
      deadlineRef.current = normalizedDeadline;

      storeLocally(data.attemptId, recoveredAnswers);

      setSaveStatus(
        sameAnswers(recoveredAnswers, serverAnswers) ? "saved" : "unsaved"
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "We could not load your exam. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [examId, loadLocalBackup, storeLocally]);

  useEffect(() => {
    if (examId) void loadAttempt();
  }, [examId, loadAttempt]);

  useEffect(() => {
    const updateOnline = () => setOnline(true);
    const updateOffline = () => setOnline(false);

    setOnline(navigator.onLine);

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOffline);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOffline);
    };
  }, []);

  const questions = attempt?.exam.questions ?? [];

  /**
   * Runs one serialized save queue.
   *
   * If the student changes an answer while a request is running,
   * the worker sends the newest snapshot after the current request.
   * This prevents older requests from completing after newer ones.
   */
  const drainSaveQueue = useCallback(
    async (force = false): Promise<boolean> => {
      const currentAttempt = attemptRef.current;

      if (!currentAttempt || submittedRef.current) return false;
      if (submitInFlightRef.current) return false;

      if (saveWorkerPromiseRef.current) {
        return saveWorkerPromiseRef.current;
      }

      const worker = (async () => {
        saveWorkerRef.current = true;
        setSaving(true);

        let success = true;

        try {
          while (pendingAnswersRef.current) {
            if (!navigator.onLine) {
              setSaveStatus("offline");
              success = false;
              break;
            }

            if (
              !force &&
              deadlineRef.current !== null &&
              Date.now() >= deadlineRef.current
            ) {
              success = false;
              break;
            }

            const snapshot = {
              ...pendingAnswersRef.current,
            };

            if (sameAnswers(snapshot, savedAnswersRef.current)) {
              pendingAnswersRef.current = null;
              setSaveStatus("saved");
              break;
            }

            setSaveStatus("saving");

            try {
              await api.patch(
                `/cbt/exams/attempts/${currentAttempt.attemptId}/answers`,
                { answers: snapshot }
              );

              savedAnswersRef.current = snapshot;

              // Clear the queue only if no newer answer arrived meanwhile.
              if (
                pendingAnswersRef.current &&
                sameAnswers(pendingAnswersRef.current, snapshot)
              ) {
                pendingAnswersRef.current = null;
              }

              storeLocally(currentAttempt.attemptId, answersRef.current);
              setError("");
            } catch (err: any) {
              success = false;

              const status = err?.response?.status;

              if (!navigator.onLine) {
                setSaveStatus("offline");
              } else {
                setSaveStatus("failed");
              }

              if (status === 409) {
                setError(
                  err?.response?.data?.message ||
                    "The exam deadline has passed. The server will use the answers it already received."
                );
              } else {
                setError(
                  err?.response?.data?.message ||
                    "Your answers could not be saved. They remain backed up on this device."
                );
              }

              break;
            }
          }

          if (
            success &&
            !pendingAnswersRef.current &&
            sameAnswers(answersRef.current, savedAnswersRef.current)
          ) {
            setSaveStatus("saved");
          } else if (!navigator.onLine) {
            setSaveStatus("offline");
          } else if (pendingAnswersRef.current) {
            setSaveStatus("unsaved");
          }

          return (
            success &&
            !pendingAnswersRef.current &&
            sameAnswers(answersRef.current, savedAnswersRef.current)
          );
        } finally {
          saveWorkerRef.current = false;
          setSaving(false);
        }
      })();

      saveWorkerPromiseRef.current = worker;

      try {
        return await worker;
      } finally {
        saveWorkerPromiseRef.current = null;
      }
    },
    [storeLocally]
  );

  const persistAnswers = useCallback(
    async (
      snapshot: Record<string, number>,
      force = false
    ): Promise<boolean> => {
      const currentAttempt = attemptRef.current;

      if (
        !currentAttempt ||
        submittedRef.current ||
        submitInFlightRef.current
      ) {
        return false;
      }

      const copiedSnapshot = { ...snapshot };

      answersRef.current = copiedSnapshot;
      pendingAnswersRef.current = copiedSnapshot;

      storeLocally(currentAttempt.attemptId, copiedSnapshot);

      if (!navigator.onLine) {
        setSaveStatus("offline");
        return false;
      }

      if (
        !force &&
        deadlineRef.current !== null &&
        Date.now() >= deadlineRef.current
      ) {
        setSaveStatus("unsaved");
        return false;
      }

      return drainSaveQueue(force);
    },
    [drainSaveQueue, storeLocally]
  );

  const submitExam = useCallback(
    async (automatic = false) => {
      const currentAttempt = attemptRef.current;

      if (
        !currentAttempt ||
        submittedRef.current ||
        submitInFlightRef.current
      ) {
        return;
      }

      if (!navigator.onLine) {
        setSaveStatus("offline");
        setError(
          automatic
            ? "The exam time has ended, but this device is offline. Reconnect to submit the answers already saved on the server."
            : "You are offline. Reconnect before submitting your exam."
        );
        return;
      }

      if (
        !automatic &&
        deadlineRef.current !== null &&
        Date.now() >= deadlineRef.current
      ) {
        setError("The exam deadline has passed. The system will submit the saved answers.");
        return;
      }

      if (!automatic) {
        const unanswered =
          currentAttempt.exam.questions.length -
          currentAttempt.exam.questions.filter(
            (question) => answersRef.current[question._id] !== undefined
          ).length;

        const confirmation =
          unanswered > 0
            ? `You have ${unanswered} unanswered question(s). They will receive no marks. Submit your exam?`
            : "Are you sure you want to submit your exam? You cannot change your answers afterward.";

        if (!window.confirm(confirmation)) return;
      }

      submitInFlightRef.current = true;
      setSubmitting(true);
      setError("");
      setNotice("");

      try {
        // At the deadline, the backend may reject a late save and
        // finalize the attempt using answers already received.
        const deadlineHasPassed =
          deadlineRef.current !== null &&
          Date.now() >= deadlineRef.current;

        if (!deadlineHasPassed) {
          const saved = await persistAnswers(answersRef.current);

          if (!saved) {
            throw new Error(
              "Some answers are not yet saved. Please check your connection and try again."
            );
          }
        }

        if (!navigator.onLine) {
          throw new Error(
            "Your connection was lost. Reconnect to submit your exam."
          );
        }

        const response = await api.post(
          `/cbt/exams/attempts/${currentAttempt.attemptId}/submit`
        );

        const result = response.data?.data;

        submittedRef.current = true;
        setSubmitted(true);
        setSaveStatus("saved");
        pendingAnswersRef.current = null;

        removeLocalBackup(currentAttempt.attemptId);

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
        const status = err?.response?.status;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Submission failed. Reconnect and try again."
        );

        if (status === 409) {
          setNotice(
            "The exam may already have been finalized by the server. Return to your exam list and refresh its status."
          );
        }
      } finally {
        submitInFlightRef.current = false;
        setSubmitting(false);
      }
    },
    [persistAnswers, removeLocalBackup]
  );

  // Keep refs synchronized with React state.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  // Countdown uses the server-provided deadline.
  useEffect(() => {
    if (!attempt || submitted) return;

    const updateTime = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;

      setRemainingSeconds(
        Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      );
    };

    updateTime();

    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, submitted]);

  const deadlinePassed = remainingSeconds <= 0;

  // Debounced autosave.
  useEffect(() => {
    if (!attempt || submitted) return;

    storeLocally(attempt.attemptId, answers);

    if (
      sameAnswers(answers, savedAnswersRef.current) &&
      !pendingAnswersRef.current
    ) {
      setSaveStatus("saved");
      return;
    }

    pendingAnswersRef.current = { ...answers };
    setSaveStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void persistAnswers(answers);
    }, AUTOSAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [answers, attempt, submitted, persistAnswers, storeLocally]);

  // Periodic backup to the server.
  useEffect(() => {
    if (!attempt || submitted) return;

    const backup = window.setInterval(() => {
      if (
        !sameAnswers(answersRef.current, savedAnswersRef.current)
      ) {
        void persistAnswers(answersRef.current);
      }
    }, BACKUP_INTERVAL);

    return () => window.clearInterval(backup);
  }, [attempt, submitted, persistAnswers]);

  // Retry unsaved answers when the connection returns.
  useEffect(() => {
    if (!online || !attempt || submitted) return;

    if (!sameAnswers(answersRef.current, savedAnswersRef.current)) {
      void persistAnswers(answersRef.current);
    }
  }, [online, attempt, submitted, persistAnswers]);

  // Automatic submission retries after reconnecting.
  useEffect(() => {
    if (
      !attempt ||
      submitted ||
      !deadlinePassed ||
      !online ||
      autoSubmitInFlightRef.current
    ) {
      return;
    }

    autoSubmitInFlightRef.current = true;

    void submitExam(true).finally(() => {
      autoSubmitInFlightRef.current = false;
    });
  }, [attempt, deadlinePassed, online, submitted, submitExam]);

  // Preserve a local copy if the page is closed or backgrounded.
  useEffect(() => {
    if (!attempt) return;

    const preserve = () => {
      storeLocally(attempt.attemptId, answersRef.current);
    };

    window.addEventListener("pagehide", preserve);
    document.addEventListener("visibilitychange", preserve);

    return () => {
      window.removeEventListener("pagehide", preserve);
      document.removeEventListener("visibilitychange", preserve);
    };
  }, [attempt, storeLocally]);

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

  const question = questions[currentQuestion];

  const answeredCount = questions.filter(
    (item) => answers[item._id] !== undefined
  ).length;

  const saveStatusText: Record<SaveStatus, string> = {
    saved: "All answers saved",
    saving: "Saving answers...",
    unsaved: "Unsaved changes",
    offline: "Offline - backed up on device",
    failed: "Save failed - reconnect and retry",
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
              className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={() => router.push("/student/exams")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800"
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
        {/* Navigation and timer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/student/exams")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
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
                : "border-slate-200 bg-white"
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
              <h1 className="break-words text-xl font-bold sm:text-2xl">
                {attempt.exam.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Read each question carefully and select your answer.
              </p>
            </div>
          </div>

          {attempt.exam.instructions?.trim() && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
              <h2 className="text-sm font-bold text-blue-950">Instructions</h2>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                {attempt.exam.instructions}
              </p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Total questions</p>
              <p className="mt-1 text-lg font-bold">{questions.length}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Questions answered</p>
              <p className="mt-1 text-lg font-bold">
                {answeredCount} of {questions.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Time allowed</p>
              <p className="mt-1 text-lg font-bold">
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
                {questions.length - answeredCount} question(s) remaining.
              </p>
            </div>
          )}
        </section>

        {/* Save and connection status */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="flex items-center gap-2">
            {online ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span>{online ? "Connected" : "No internet connection"}</span>
          </div>

          <div className="flex items-center gap-2 font-medium">
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <span>{saveStatusText[saveStatus]}</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="break-words">{notice}</p>
          </div>
        )}

        {deadlinePassed && !submitted && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Your exam time has ended. The system is submitting the answers
            already received by the server. Reconnect if you are offline.
          </div>
        )}

        {questions.length === 0 && !submitted && (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-950">
              No questions were returned
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This exam does not contain any questions. Please contact your
              school administrator.
            </p>
          </section>
        )}

        {/* Submitted confirmation */}
        {submitted ? (
          <section className="rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-xl font-bold">
              Exam submitted successfully
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your answers have been submitted to your school.
            </p>
            <button
              type="button"
              onClick={() => router.push("/student/exams")}
              className="mt-6 min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
            >
              Return to my exams
            </button>
          </section>
        ) : question ? (
          <>
            {/* Question */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-700">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                  <h2 className="mt-3 whitespace-pre-wrap break-words text-lg font-bold leading-7 sm:text-xl">
                    {question.text || "Question text is missing."}
                  </h2>
                </div>

                <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                  {question.marks} {question.marks === 1 ? "mark" : "marks"}
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
                          disabled={deadlinePassed || submitting}
                          aria-pressed={selected}
                          onClick={() => {
                            setAnswers((previous) => {
                              const updated = {
                                ...previous,
                                [question._id]: index,
                              };

                              answersRef.current = updated;

                              if (attempt) {
                                storeLocally(attempt.attemptId, updated);
                              }

                              return updated;
                            });

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
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {letter}
                          </span>

                          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 text-base leading-6">
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
                      Please contact your school administrator.
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
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
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
                  className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Next question
                </button>
              </div>
            </section>

            {/* Review answers */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold">Review your answers</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Choose a question number to review it. Unanswered questions
                receive no marks.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {questions.map((item, index) => {
                  const selected = index === currentQuestion;
                  const answered = answers[item._id] !== undefined;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      disabled={deadlinePassed}
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
                            : "border-slate-300 bg-white"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-slate-600">
                Blue: current question. Green: answered. White: unanswered.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void persistAnswers(answersRef.current)}
                  disabled={
                    saving ||
                    submitting ||
                    deadlinePassed ||
                    submitted ||
                    questions.length === 0
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold disabled:opacity-50"
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
                  onClick={() => void submitExam(false)}
                  disabled={
                    submitting ||
                    saving ||
                    deadlinePassed ||
                    submitted ||
                    questions.length === 0
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
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



