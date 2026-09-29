"use client";

import { useEffect, useState } from "react";

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
  getTerms,
  getClassOptions,
  OptionItem,
} from "../../../../lib/options";

/* =========================================
   TYPES
========================================= */

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

/* =========================================
   PAGE
========================================= */

export default function ResultsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [terms, setTerms] = useState<OptionItem[]>([]);
  const [classes, setClasses] = useState<OptionItem[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  /* =========================================
     LOAD OPTIONS
  ========================================= */

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [s, t, c] = await Promise.all([
          getSessions(),
          getTerms(),
          getClassOptions(),
        ]);

        setSessions(s || []);
        setTerms(t || []);
        setClasses(c || []);

        if (s?.length) setSessionId(s[0]._id);
        if (t?.length) setTermId(t[0]._id);
      } catch (err) {
        console.error(err);
      }
    };

    loadOptions();
  }, []);

  /* =========================================
     LOAD DATA
  ========================================= */

  async function loadData(sessionId: string, termId: string) {
    try {
      setLoading(true);
      setError("");

      const summaryData = await getAdminResultSummary({
        sessionId,
        termId,
      });

      setSummary(Array.isArray(summaryData) ? summaryData : []);

      const overviewData = await getAdminResultOverview({
        sessionId,
        termId,
      });

      setOverview(overviewData as OverviewData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionId && termId) {
      loadData(sessionId, termId);
    }
  }, [sessionId, termId]);

  /* =========================================
     REFRESH
  ========================================= */

  const refresh = () => {
    if (sessionId && termId) {
      loadData(sessionId, termId);
    }
  };

  /* =========================================
     ACTIONS
  ========================================= */

  const handleGenerate = async (classId: string) => {
    try {
      setActionLoading(true);

      await generateResults({
        sessionId,
        termId,
        classId,
      });

      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (classId: string) => {
    try {
      setActionLoading(true);

      await publishResults({
        sessionId,
        termId,
        classId,
      });

      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async (classId: string) => {
    try {
      setActionLoading(true);

      await lockResults({
        sessionId,
        termId,
        classId,
      });

      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (classId: string) => {
    try {
      setActionLoading(true);

      await unlockResults({
        sessionId,
        termId,
        classId,
      });

      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================
     UI STATES
  ========================================= */

  if (loading && !overview) return <PageLoader />;

  if (error) {
    return (
      <EmptyState title="Dashboard Error" description={error} />
    );
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-6">

      {/* FILTERS */}
      <SectionCard title="Result Dashboard">

        <div className="grid md:grid-cols-2 gap-4">

          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select value={termId} onChange={(e) => setTermId(e.target.value)}>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

        </div>
      </SectionCard>

      {/* OVERVIEW */}
      <SectionCard title="Overview">
        <div className="grid md:grid-cols-5 gap-3">
          <div>Total: {overview?.totalResults}</div>
          <div>Students: {overview?.totalStudents}</div>
          <div>Published: {overview?.publishedResults}</div>
          <div>Locked: {overview?.lockedResults}</div>
          <div>Avg: {overview?.averageScore}</div>
        </div>
      </SectionCard>

      {/* CLASS PROGRESS */}
      <SectionCard title="Class Progress">

        {summary.length === 0 ? (
          <EmptyState title="No Data" />
        ) : (
          <div className="grid md:grid-cols-3 gap-4">

            {summary.map((item) => (
              <ResultProgressCard
                key={item.classId}
                className={item.className}
                draft={item.draft}
                generated={item.generated}
                locked={item.locked}
                published={item.published}
                totalResults={item.totalResults}
                progress={item.progress}
                loading={actionLoading}
                onGenerate={() => handleGenerate(item.classId)}
                onPublish={() => handlePublish(item.classId)}
                onLock={() => handleLock(item.classId)}
                onUnlock={() => handleUnlock(item.classId)}
              />
            ))}

          </div>
        )}
      </SectionCard>

    </div>
  );
}