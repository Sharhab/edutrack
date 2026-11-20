

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  Clock3,
  ClipboardList,
  AlertCircle,
  Eye,
  Upload,
  Info,
  XCircle,
} from "lucide-react";

import api from "../../../../../../lib/axios";

type AttemptStatus = "submitted" | "in_progress";

type ExamResult = {
  attemptId: string;
  studentId: string | null;
  studentName: string;
  admissionNumber: string;
  status: AttemptStatus;
  score: number | null;
  totalMarks: number;
  percentage: number | null;
  startedAt: string | null;
  submittedAt: string | null;
};

type ExamInfo = {
  _id: string;
  title: string;
  classId?: {
    name?: string;
    level?: string;
  } | string | null;
  subjectId?: {
    name?: string;
    code?: string;
  } | string | null;
};

type ResultsResponse = {
  exam: ExamInfo;
  summary: {
    totalAttempts: number;
    submitted: number;
    inProgress: number;
  };
  results: ExamResult[];
};

type FilterStatus = "all" | AttemptStatus;

type SyncedStudent = {
  studentId: string;
  componentKey: string;
  score: number;
  maxScore: number;
  attemptsUsed: number;
};

type SkippedStudent = {
  studentId: string;
  reason: string;
};

type SyncReport = {
  syncedCount: number;
  skippedCount: number;
  synced: SyncedStudent[];
  skipped: SkippedStudent[];
  assessmentKey?: string;
  aggregationMethod?: "average" | "highest" | "selected";
};

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function getReferenceName(
  value:
    | { name?: string; level?: string; code?: string }
    | string
    | null
    | undefined
) {
  if (value && typeof value === "object") {
    return value.name || value.level || value.code || "—";
  }

  return typeof value === "string" && value.trim()
    ? value
    : "—";
}

function csvCell(value: unknown) {
  let text = String(value ?? "");

  // Protect spreadsheet users from formula injection.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function statusStyle(status: AttemptStatus) {
  return status === "submitted"
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
    : "border-amber-400/30 bg-amber-500/10 text-amber-300";
}

function formatAggregationMethod(
  method?: SyncReport["aggregationMethod"]
) {
  if (method === "highest") return "Highest score";
  if (method === "selected") return "Selected score";
  return "Average score";
}

export default function CbtExamResultsPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();

  const examId = params.examId;

  const [data, setData] = useState<ResultsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("all");

  const [syncReport, setSyncReport] =
    useState<SyncReport | null>(null);

  const loadResults = useCallback(
    async (refresh = false) => {
      if (!examId) return;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await api.get(
          `/cbt/exams/${examId}/results`
        );

        const result = response.data?.data;

        if (
          !result ||
          !Array.isArray(result.results) ||
          !result.exam
        ) {
          throw new Error(
            "The server returned an unexpected results format."
          );
        }

        setData(result);
      } catch (err: any) {
        setError(
          getErrorMessage(
            err,
            "Could not load this exam's results."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [examId]
  );

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const results = data?.results ?? [];

  const filteredResults = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return results.filter((result) => {
      const matchesStatus =
        statusFilter === "all" ||
        result.status === statusFilter;

      const matchesSearch =
        !searchText ||
        (result.studentName || "")
          .toLowerCase()
          .includes(searchText) ||
        (result.admissionNumber || "")
          .toLowerCase()
          .includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [results, search, statusFilter]);

  const submittedCount =
    data?.summary?.submitted ??
    results.filter(
      (item) => item.status === "submitted"
    ).length;

  const inProgressCount =
    data?.summary?.inProgress ??
    results.filter(
      (item) => item.status === "in_progress"
    ).length;

  const totalAttempts =
    data?.summary?.totalAttempts ?? results.length;

  const scoredResults = results.filter(
    (result) =>
      result.status === "submitted" &&
      result.score !== null &&
      result.totalMarks > 0
  );

  const averagePercentage =
    scoredResults.length > 0
      ? scoredResults.reduce(
          (sum, result) =>
            sum + (result.percentage ?? 0),
          0
        ) / scoredResults.length
      : null;

  async function syncCbtMarks() {
    if (!examId || syncing || loading || refreshing) {
      return;
    }

    const confirmed = window.confirm(
      "Synchronize submitted CBT marks into student results?\n\n" +
        "Only the assessment component linked to this CBT exam will be updated. " +
        "Other teacher-entered marks will be preserved. Published and locked results will be skipped."
    );

    if (!confirmed) return;

    setSyncing(true);
    setSyncError("");
    setSyncReport(null);

    try {
      const response = await api.post(
        `/cbt/exams/${examId}/sync-results`
      );

      const report = response.data?.data;

      if (
        !report ||
        typeof report.syncedCount !== "number" ||
        typeof report.skippedCount !== "number"
      ) {
        throw new Error(
          "The server returned an unexpected synchronization response."
        );
      }

      setSyncReport({
        syncedCount: report.syncedCount,
        skippedCount: report.skippedCount,
        synced: Array.isArray(report.synced)
          ? report.synced
          : [],
        skipped: Array.isArray(report.skipped)
          ? report.skipped
          : [],
        assessmentKey: report.assessmentKey,
        aggregationMethod: report.aggregationMethod,
      });

      await loadResults(true);
    } catch (err: any) {
      setSyncError(
        getErrorMessage(
          err,
          "Could not synchronize CBT marks."
        )
      );
    } finally {
      setSyncing(false);
    }
  }

  function openAnswerReview(result: ExamResult) {
    if (
      result.status !== "submitted" ||
      !result.attemptId
    ) {
      return;
    }

    router.push(
      `/school-admin/exams/${examId}/results/${result.attemptId}`
    );
  }

  function downloadCsv() {
    if (!data || filteredResults.length === 0) return;

    const headers = [
      "Student Name",
      "Admission Number",
      "Status",
      "Score",
      "Total Marks",
      "Percentage",
      "Started At",
      "Submitted At",
    ];

    const rows = filteredResults.map((result) => [
      result.studentName,
      result.admissionNumber,
      result.status === "submitted"
        ? "Submitted"
        : "In progress",
      result.score ?? "",
      result.totalMarks,
      result.percentage == null
        ? ""
        : `${result.percentage}%`,
      result.startedAt
        ? formatDate(result.startedAt)
        : "",
      result.submittedAt
        ? formatDate(result.submittedAt)
        : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `edutrack-cbt-results-${examId}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/school-admin/exams")
            }
            aria-label="Back to exams"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">
              CBT Exam Results
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Review student attempts, scores, submitted answers
              and examination progress.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => void loadResults(true)}
            disabled={loading || refreshing || syncing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={downloadCsv}
            disabled={
              !data ||
              filteredResults.length === 0 ||
              syncing
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Results loading error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load exam results
            </p>

            <p className="mt-1 break-words">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadResults(true)}
              className="mt-2 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Initial loading */}
      {loading && !data && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
          <RefreshCw
            size={24}
            className="mx-auto animate-spin"
          />
          <p className="mt-3">
            Loading examination results...
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Exam information */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-sm font-medium text-cyan-300">
              Selected examination
            </p>

            <h2 className="mt-2 break-words text-xl font-bold text-white sm:text-2xl">
              {data.exam.title}
            </h2>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span>
                Class:{" "}
                <strong className="text-slate-200">
                  {getReferenceName(data.exam.classId)}
                </strong>
              </span>

              <span>
                Subject:{" "}
                <strong className="text-slate-200">
                  {getReferenceName(data.exam.subjectId)}
                </strong>
              </span>
            </div>
          </section>

          {/* CBT synchronization */}
          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <Upload size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="font-semibold text-white">
                    Assessment results synchronization
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Transfer submitted CBT marks into the
                    assessment component selected when this
                    examination was created.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void syncCbtMarks()}
                disabled={
                  syncing ||
                  loading ||
                  refreshing
                }
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={16} />
                )}

                {syncing
                  ? "Synchronizing..."
                  : "Sync CBT Marks"}
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-xs leading-5 text-slate-400">
              <Info
                size={16}
                className="mt-0.5 shrink-0 text-cyan-300"
              />

              <p>
                Only submitted attempts are synchronized.
                Existing teacher-entered component scores are
                preserved. Published or locked results are
                protected and will be skipped.
              </p>
            </div>

            {syncError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div className="min-w-0">
                  <p className="font-semibold">
                    Synchronization failed
                  </p>
                  <p className="mt-1 break-words">
                    {syncError}
                  </p>
                </div>
              </div>
            )}

            {syncReport && (
              <div className="mt-4 space-y-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-300"
                  />

                  <div>
                    <h3 className="font-semibold text-white">
                      Synchronization completed
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      The CBT synchronization request
                      completed. Review the summary below.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-950/50 p-3">
                    <p className="text-xs text-slate-400">
                      Results synchronized
                    </p>

                    <p className="mt-1 text-2xl font-bold text-emerald-300">
                      {syncReport.syncedCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/50 p-3">
                    <p className="text-xs text-slate-400">
                      Records skipped
                    </p>

                    <p className="mt-1 text-2xl font-bold text-amber-300">
                      {syncReport.skippedCount}
                    </p>
                  </div>
                </div>

                {(syncReport.assessmentKey ||
                  syncReport.aggregationMethod) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {syncReport.assessmentKey && (
                      <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-slate-300">
                        Component:{" "}
                        <strong className="text-white">
                          {syncReport.assessmentKey}
                        </strong>
                      </span>
                    )}

                    {syncReport.aggregationMethod && (
                      <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-slate-300">
                        Method:{" "}
                        <strong className="text-white">
                          {formatAggregationMethod(
                            syncReport.aggregationMethod
                          )}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                {syncReport.synced.length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <h4 className="text-sm font-semibold text-white">
                      Synchronized student scores
                    </h4>

                    <div className="max-h-56 space-y-2 overflow-y-auto">
                      {syncReport.synced.map(
                        (item, index) => (
                          <div
                            key={`${item.studentId}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/40 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0 break-all text-slate-300">
                              Student {item.studentId}
                            </span>

                            <span className="shrink-0 font-semibold text-emerald-300">
                              {item.score} / {item.maxScore}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {syncReport.skipped.length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2">
                      <XCircle
                        size={17}
                        className="text-amber-300"
                      />

                      <h4 className="text-sm font-semibold text-white">
                        Skipped records
                      </h4>
                    </div>

                    <div className="max-h-56 space-y-2 overflow-y-auto">
                      {syncReport.skipped.map(
                        (item, index) => (
                          <div
                            key={`${item.studentId}-${index}`}
                            className="rounded-lg bg-slate-950/40 p-3"
                          >
                            <p className="break-all text-xs font-semibold text-slate-300">
                              Student {item.studentId}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              {item.reason}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total attempts",
                value: totalAttempts,
                icon: Users,
                color: "text-cyan-300",
              },
              {
                label: "Submitted",
                value: submittedCount,
                icon: CheckCircle2,
                color: "text-emerald-300",
              },
              {
                label: "In progress",
                value: inProgressCount,
                icon: Clock3,
                color: "text-amber-300",
              },
              {
                label: "Average percentage",
                value:
                  averagePercentage === null
                    ? "—"
                    : `${averagePercentage.toFixed(1)}%`,
                icon: ClipboardList,
                color: "text-violet-300",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">
                      {item.label}
                    </p>

                    <Icon
                      size={20}
                      className={item.color}
                    />
                  </div>

                  <p className="mt-3 text-3xl font-bold text-white">
                    {item.value}
                  </p>
                </article>
              );
            })}
          </section>

          {/* Student submissions */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="space-y-4 border-b border-white/10 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Student submissions
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Showing {filteredResults.length} of{" "}
                  {results.length} attempts.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search name or admission number"
                    aria-label="Search students"
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as FilterStatus
                    )
                  }
                  aria-label="Filter by attempt status"
                  className="min-h-11 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All attempts</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">
                    In progress
                  </option>
                </select>
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="p-10 text-center">
                <Users
                  size={36}
                  className="mx-auto text-slate-500"
                />

                <h3 className="mt-3 font-semibold text-white">
                  No matching attempts
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Try changing your search or status filter.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="divide-y divide-white/10 md:hidden">
                  {filteredResults.map((result) => (
                    <article
                      key={result.attemptId}
                      className="space-y-3 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-semibold text-white">
                            {result.studentName ||
                              "Unknown student"}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            Admission No.:{" "}
                            {result.admissionNumber || "—"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(result.status)}`}
                        >
                          {result.status === "submitted"
                            ? "Submitted"
                            : "In progress"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-900/70 p-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            Score
                          </p>

                          <p className="mt-1 font-semibold text-white">
                            {result.status === "submitted" &&
                            result.score !== null
                              ? `${result.score} / ${result.totalMarks}`
                              : "Pending"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Percentage
                          </p>

                          <p className="mt-1 font-semibold text-white">
                            {result.status === "submitted" &&
                            result.percentage !== null
                              ? `${result.percentage.toFixed(1)}%`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs leading-5 text-slate-400">
                        <p>
                          Started: {formatDate(result.startedAt)}
                        </p>

                        <p>
                          Submitted: {formatDate(result.submittedAt)}
                        </p>
                      </div>

                      {result.status === "submitted" && (
                        <button
                          type="button"
                          onClick={() =>
                            openAnswerReview(result)
                          }
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          <Eye size={17} />
                          Review answers
                        </button>
                      )}
                    </article>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-4">
                          Student name
                        </th>

                        <th className="px-5 py-4">
                          Admission number
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Score
                        </th>

                        <th className="px-5 py-4">
                          Percentage
                        </th>

                        <th className="px-5 py-4">
                          Submitted at
                        </th>

                        <th className="px-5 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/10">
                      {filteredResults.map((result) => (
                        <tr
                          key={result.attemptId}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4 font-medium text-white">
                            {result.studentName ||
                              "Unknown student"}
                          </td>

                          <td className="px-5 py-4 text-slate-300">
                            {result.admissionNumber || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(result.status)}`}
                            >
                              {result.status === "submitted"
                                ? "Submitted"
                                : "In progress"}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-semibold text-white">
                            {result.status === "submitted" &&
                            result.score !== null
                              ? `${result.score} / ${result.totalMarks}`
                              : "—"}
                          </td>

                          <td className="px-5 py-4 text-slate-300">
                            {result.status === "submitted" &&
                            result.percentage !== null
                              ? `${result.percentage.toFixed(1)}%`
                              : "—"}
                          </td>

                          <td className="px-5 py-4 text-slate-400">
                            {formatDate(result.submittedAt)}
                          </td>

                          <td className="px-5 py-4">
                            {result.status === "submitted" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAnswerReview(result)
                                }
                                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                              >
                                <Eye size={15} />
                                Review answers
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Not submitted
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
