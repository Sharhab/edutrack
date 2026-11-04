
"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import api from "../../../../../../lib/axios";

type ExamResult = {
  attemptId: string;
  studentId: string | null;
  studentName: string;
  admissionNumber: string;
  status: "submitted" | "in_progress";
  score: number | null;
  totalMarks: number;
  percentage: number | null;
  startedAt: string | null;
  submittedAt: string | null;
};

type ExamInfo = {
  _id: string;
  title: string;
  classId?: { name?: string; level?: string } | string | null;
  subjectId?: { name?: string; code?: string } | string | null;
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
): string {
  if (value && typeof value === "object") {
    return value.name || value.level || value.code || "—";
  }

  return typeof value === "string" && value.trim()
    ? value
    : "—";
}


function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function CbtExamResultsPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();
  const examId = params.examId;

  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "submitted" | "in_progress"
  >("all");

  const loadResults = useCallback(async () => {
    if (!examId) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/cbt/exams/${examId}/results`
      );

      const result = response.data?.data;

      if (!result || !Array.isArray(result.results)) {
        throw new Error(
          "The server returned an unexpected results format."
        );
      }

      setData(result);
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Could not load this exam's results."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const results = data?.results ?? [];

  const filteredResults = results.filter((result) => {
    const matchesStatus =
      statusFilter === "all" ||
      result.status === statusFilter;

    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      result.studentName.toLowerCase().includes(searchText) ||
      result.admissionNumber.toLowerCase().includes(searchText);

    return matchesStatus && matchesSearch;
  });

  const downloadCsv = () => {
    if (!data) return;

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
      result.status === "submitted" ? "Submitted" : "In progress",
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
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "edutrack-cbt-results.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const submittedCount = results.filter(
    (result) => result.status === "submitted"
  ).length;

  const inProgressCount = results.filter(
    (result) => result.status === "in_progress"
  ).length;

  const scoredResults = results.filter(
    (result) =>
      result.status === "submitted" &&
      result.score !== null
  );

  const averagePercentage =
    scoredResults.length > 0
      ? scoredResults.reduce(
          (sum, result) => sum + (result.percentage ?? 0),
          0
        ) / scoredResults.length
      : null;

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/school-admin/exams")
            }
            aria-label="Back to exams"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-white">
              CBT Exam Results
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Review student submissions, scores, and progress.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadResults()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={downloadCsv}
            disabled={!data || filteredResults.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Unable to load exam results
            </p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <>
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

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total attempts",
                value: results.length,
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
                      className={`h-5 w-5 ${item.color}`}
                    />
                  </div>

                  <p className="mt-3 text-3xl font-bold text-white">
                    {item.value}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="space-y-4 border-b border-white/10 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Student submissions
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredResults.length} student attempt(s) shown.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search student or admission number"
                    aria-label="Search students"
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | "submitted"
                        | "in_progress"
                    )
                  }
                  aria-label="Filter by submission status"
                  className="min-h-11 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="all">All attempts</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In progress</option>
                </select>
              </div>
            </div>

            {loading && !data ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Loading student results…
              </p>
            ) : filteredResults.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="mx-auto h-9 w-9 text-slate-500" />
                <h3 className="mt-3 font-semibold text-white">
                  No matching submissions
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  No attempts match your current search or filter.
                  Submitted attempts will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile-friendly student cards */}
                <div className="divide-y divide-white/10 md:hidden">
                  {filteredResults.map((result) => (
                    <article
                      key={result.attemptId}
                      className="space-y-3 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-semibold text-white">
                            {result.studentName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            Admission No.:{" "}
                            {result.admissionNumber || "—"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            result.status === "submitted"
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                          }`}
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
                              : "Not available yet"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">
                            Percentage
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {result.percentage === null
                              ? "—"
                              : `${result.percentage.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs leading-5 text-slate-400">
                        <p>Started: {formatDate(result.startedAt)}</p>
                        <p>
                          Submitted: {formatDate(result.submittedAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          Student
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Admission number
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Status
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Score
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Percentage
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Submitted at
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/10">
                      {filteredResults.map((result) => (
                        <tr
                          key={result.attemptId}
                          className="hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4 font-medium text-white">
                            {result.studentName}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {result.admissionNumber || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                result.status === "submitted"
                                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                  : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                              }`}
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
                            {result.percentage === null
                              ? "—"
                              : `${result.percentage.toFixed(1)}%`}
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {formatDate(result.submittedAt)}
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
