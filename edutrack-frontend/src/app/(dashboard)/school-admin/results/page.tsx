"use client";

import { useCallback, useEffect, useState } from "react";

import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import ResultProgressCard from "../../../../components/results/result-progress-card";

import {
  getAdminResultOverview,
  getAdminResultSummary,
  publishResults,
  lockResults,
  unlockResults,
  generateResults,
} from "../../../../lib/admin-results";

import {
  getSessions,
  OptionItem,
} from "../../../../lib/options";
import api from "../../../../lib/axios";

type SummaryItem = {
  classId: string;
  className: string;
  draft: number;
  generated: number;
  locked: number;
  published: number;
  totalResults: number;
  progress: number;
};

type OverviewData = {
  totalResults: number;
  totalStudents: number;
  publishedResults: number;
  lockedResults: number;
  averageScore: number;
};

type TermOption = OptionItem & {
  sessionId?: string | { _id?: string };
};

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function ResultsAdminPage() {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load the school's sessions and classes once. Prefer the session marked current.
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const sessionOptions = await getSessions();

        if (!active) return;

        const availableSessions = sessionOptions || [];
        setSessions(availableSessions);

        const currentSession = availableSessions.find(
          (item) => item.isCurrent
        );
        setSessionId(currentSession?._id || availableSessions[0]?._id || "");
      } catch (err: any) {
        if (active) {
          setError(getErrorMessage(err, "Failed to load school sessions and classes."));
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  // Terms are always loaded for the selected session; never reuse a term from another session.
  useEffect(() => {
    let active = true;

    setTerms([]);
    setTermId("");
    setSummary([]);
    setOverview(null);
    setNotice("");

    if (!sessionId) {
      setLoadingTerms(false);
      return () => {
        active = false;
      };
    }

    async function loadSessionTerms() {
      setLoadingTerms(true);
      setError("");

      try {
        const response = await api.get("/terms", {
          params: { sessionId },
        });

        if (!active) return;

        const rawTerms = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        const sessionTerms: TermOption[] = rawTerms
          .filter((term: any) => {
            const termSessionId =
              typeof term?.sessionId === "object"
                ? term.sessionId?._id
                : term?.sessionId;
            return !termSessionId || String(termSessionId) === sessionId;
          })
          .map((term: any) => ({
            _id: String(term?._id || term?.value || ""),
            name: String(term?.name || term?.label || ""),
            label: term?.label,
            isCurrent: Boolean(term?.isCurrent),
            sessionId: term?.sessionId,
          }))
    .filter((term: TermOption) => Boolean(term._id && term.name));
        setTerms(sessionTerms);
        const currentTerm = sessionTerms.find((term) => term.isCurrent);
        setTermId(currentTerm?._id || sessionTerms[0]?._id || "");
      } catch (err: any) {
        if (active) {
          setTerms([]);
          setTermId("");
          setError(getErrorMessage(err, "Could not load terms for the selected academic session."));
        }
      } finally {
        if (active) setLoadingTerms(false);
      }
    }

    void loadSessionTerms();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const loadData = useCallback(async (selectedSessionId: string, selectedTermId: string) => {
    if (!selectedSessionId || !selectedTermId) {
      setSummary([]);
      setOverview(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = {
        sessionId: selectedSessionId,
        termId: selectedTermId,
      };

      const [summaryData, overviewData] = await Promise.all([
        getAdminResultSummary(params),
        getAdminResultOverview(params),
      ]);

      setSummary(Array.isArray(summaryData) ? summaryData : []);
      setOverview(overviewData && typeof overviewData === "object" ? overviewData as OverviewData : null);
    } catch (err: any) {
      setSummary([]);
      setOverview(null);
      setError(getErrorMessage(err, "Failed to load results for this academic period."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      !sessionId ||
      !termId ||
      loadingTerms ||
      !terms.some((term) => term._id === termId)
    ) return;
    void loadData(sessionId, termId);
  }, [sessionId, termId, terms, loadingTerms, loadData]);

  const refresh = useCallback(async () => {
    if (sessionId && termId) {
      await loadData(sessionId, termId);
    }
  }, [sessionId, termId, loadData]);

  const runAction = async (
    classId: string,
    action: (payload: { sessionId: string; termId: string; classId: string }) => Promise<any>,
    successMessage: string
  ) => {
    if (!sessionId || !termId || !classId || actionLoading) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await action({ sessionId, termId, classId });
      setNotice(successMessage);
      await refresh();
    } catch (err: any) {
      setError(getErrorMessage(err, "The result action failed. Please try again."));
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingOptions) return <PageLoader />;

  if (error && !sessions.length) {
    return <EmptyState title="Could not load Results" description={error} />;
  }

  const selectedSession = sessions.find((item) => item._id === sessionId);
  const selectedTerm = terms.find((item) => item._id === termId);
  const periodReady = Boolean(sessionId && termId && !loadingTerms);

  return (
    <div className="space-y-6">
      <SectionCard title="Result Dashboard">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="results-session" className="block text-sm font-medium text-slate-300">
              Academic session
            </label>
            <select
              id="results-session"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              disabled={!sessions.length || actionLoading}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="">Select academic session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}{session.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="results-term" className="block text-sm font-medium text-slate-300">
              Academic term
            </label>
            <select
              id="results-term"
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              disabled={!sessionId || loadingTerms || !terms.length || actionLoading}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="">
                {loadingTerms ? "Loading terms…" : terms.length ? "Select academic term" : "No terms for this session"}
              </option>
              {terms.map((term) => (
                <option key={term._id} value={term._id}>
                  {term.name}{term.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-slate-300">
            Showing results for <span className="font-semibold text-white">{selectedSession?.name || "—"}</span>
            <span className="mx-2 text-slate-500">/</span>
            <span className="font-semibold text-white">{selectedTerm?.name || (loadingTerms ? "Loading…" : "No term selected")}</span>
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={!periodReady || loading || actionLoading}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Refreshing…" : "Refresh results"}
          </button>
        </div>
      </SectionCard>

      {error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <SectionCard title="Overview">
        {!periodReady ? (
          <p className="text-sm text-slate-400">
            {loadingTerms ? "Loading terms for the selected session…" : "Select an academic session and a term to view results."}
          </p>
        ) : loading && !overview ? (
          <p className="text-sm text-slate-400">Loading result overview…</p>
        ) : overview ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">Total results</p>
              <p className="mt-1 text-2xl font-bold text-white">{overview.totalResults ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">Students</p>
              <p className="mt-1 text-2xl font-bold text-white">{overview.totalStudents ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">Published</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">{overview.publishedResults ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">Locked</p>
              <p className="mt-1 text-2xl font-bold text-amber-300">{overview.lockedResults ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">Average score</p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">{Number(overview.averageScore ?? 0).toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No overview data is available for this academic period.</p>
        )}
      </SectionCard>

      <SectionCard title="Class Progress">
        {!periodReady ? (
          <p className="text-sm text-slate-400">Choose a valid academic session and term to manage results.</p>
        ) : loading && summary.length === 0 ? (
          <p className="text-sm text-slate-400">Loading class progress…</p>
        ) : summary.length === 0 ? (
          <EmptyState title="No Data" description="No class result records were found for the selected session and term." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.map((item) => (
              <ResultProgressCard
                key={item.classId}
                className={item.className}
                draft={item.draft ?? 0}
                generated={item.generated ?? 0}
                locked={item.locked ?? 0}
                published={item.published ?? 0}
                totalResults={item.totalResults ?? 0}
                progress={item.progress ?? 0}
                loading={actionLoading}
                onGenerate={() => void runAction(item.classId, generateResults, `Results generated for ${item.className}.`)}
                onPublish={() => void runAction(item.classId, publishResults, `Results published for ${item.className}.`)}
                onLock={() => void runAction(item.classId, lockResults, `Results locked for ${item.className}.`)}
                onUnlock={() => void runAction(item.classId, unlockResults, `Results unlocked for ${item.className}.`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
