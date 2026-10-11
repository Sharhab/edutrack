"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AcademicSession,
  createSession,
  getSessions,
  setCurrentSession,
} from "../../../../lib/sessions";
import {
  AcademicTerm,
  createTerm,
  getTerms,
  setCurrentTerm,
} from "../../../../lib/terms";

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString();
}

export default function AcademicPeriodsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [sessionName, setSessionName] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionCurrent, setSessionCurrent] = useState(false);

  const [termName, setTermName] = useState("First Term");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [termOrder, setTermOrder] = useState("1");
  const [termCurrent, setTermCurrent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async (preferredSessionId?: string) => {
    try {
      setLoading(true);
      setError("");

      const sessionList = await getSessions();
      setSessions(sessionList);

      const selected =
        sessionList.find((s) => s._id === preferredSessionId) ??
        sessionList.find((s) => s.isCurrent) ??
        sessionList[0];

      const sessionId = selected?._id ?? "";
      setSelectedSessionId(sessionId);

      const termList = await getTerms(sessionId || undefined);
      setTerms(termList);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Could not load academic sessions and terms."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateSession(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (sessionEnd < sessionStart) {
      setError("Session end date must be on or after its start date.");
      return;
    }

    try {
      setSavingSession(true);

      const created = await createSession({
        name: sessionName.trim(),
        startDate: sessionStart,
        endDate: sessionEnd,
        isCurrent: sessionCurrent,
      });

      setSessionName("");
      setSessionStart("");
      setSessionEnd("");
      setSessionCurrent(false);

      await loadData(created?._id);
      setMessage("Academic session created successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Could not create the session."
      );
    } finally {
      setSavingSession(false);
    }
  }

  async function handleCreateTerm(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedSessionId) {
      setError("Create or select an academic session first.");
      return;
    }

    if (termEnd < termStart) {
      setError("Term end date must be on or after its start date.");
      return;
    }

    try {
      setSavingTerm(true);

      await createTerm({
        sessionId: selectedSessionId,
        name: termName.trim(),
        startDate: termStart,
        endDate: termEnd,
        order: Number(termOrder),
        isCurrent: termCurrent,
      });

      setTermStart("");
      setTermEnd("");
      setTermCurrent(false);

      await loadData(selectedSessionId);
      setMessage("Term created successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Could not create the term."
      );
    } finally {
      setSavingTerm(false);
    }
  }

  async function handleSetCurrentSession(session: AcademicSession) {
    try {
      setError("");
      setMessage("");

      await setCurrentSession(session._id);
      await loadData(session._id);

      setMessage(`${session.name} is now the current session.`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Could not change the current session."
      );
    }
  }

  async function handleSetCurrentTerm(term: AcademicTerm) {
    try {
      setError("");
      setMessage("");

      await setCurrentTerm(term._id);
      await loadData(selectedSessionId);

      setMessage(`${term.name} is now the current term.`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Could not change the current term."
      );
    }
  }

  async function handleSelectSession(id: string) {
    setSelectedSessionId(id);
    setError("");

    try {
      const termList = await getTerms(id || undefined);
      setTerms(termList);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Could not load terms for this session."
      );
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Academic Periods
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Create school sessions and configure their terms and academic dates.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">
          Create Academic Session
        </h2>

        <form
          onSubmit={handleCreateSession}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <label className="text-sm text-slate-300">
            Session name
            <input
              required
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="2026/2027"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="text-sm text-slate-300">
            Start date
            <input
              required
              type="date"
              value={sessionStart}
              onChange={(e) => setSessionStart(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="text-sm text-slate-300">
            End date
            <input
              required
              type="date"
              min={sessionStart || undefined}
              value={sessionEnd}
              onChange={(e) => setSessionEnd(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={sessionCurrent}
              onChange={(e) => setSessionCurrent(e.target.checked)}
            />
            Make this the current session
          </label>

          <button
            disabled={savingSession}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white hover:bg-cyan-400 disabled:opacity-60 md:col-span-2"
          >
            {savingSession ? "Creating session..." : "Create Session"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">
          Academic Sessions
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No sessions yet. Create your first session above.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{session.name}</p>
                    {session.isCurrent && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatDate(session.startDate)} – {formatDate(session.endDate)}
                  </p>
                </div>

                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => void handleSetCurrentSession(session)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
                  >
                    Set as current
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Create Term</h2>
        <p className="mt-1 text-sm text-slate-400">
          Each term belongs to one academic session.
        </p>

        <form
          onSubmit={handleCreateTerm}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <label className="text-sm text-slate-300 md:col-span-2">
            Academic session
            <select
              required
              value={selectedSessionId}
              onChange={(e) => void handleSelectSession(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Term name
            <input
              required
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              placeholder="First Term"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="text-sm text-slate-300">
            Order
            <input
              required
              type="number"
              min="1"
              value={termOrder}
              onChange={(e) => setTermOrder(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="text-sm text-slate-300">
            Start date
            <input
              required
              type="date"
              value={termStart}
              onChange={(e) => setTermStart(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="text-sm text-slate-300">
            End date
            <input
              required
              type="date"
              min={termStart || undefined}
              value={termEnd}
              onChange={(e) => setTermEnd(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={termCurrent}
              onChange={(e) => setTermCurrent(e.target.checked)}
            />
            Make this the current term
          </label>

          <button
            disabled={savingTerm || !selectedSessionId}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white hover:bg-cyan-400 disabled:opacity-60"
          >
            {savingTerm ? "Creating term..." : "Create Term"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">
          Terms for Selected Session
        </h2>

        {!selectedSessionId ? (
          <p className="mt-4 text-sm text-slate-400">
            Select a session to view its terms.
          </p>
        ) : terms.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No terms exist for this session yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {terms.map((term) => (
              <div
                key={term._id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">
                      {term.order ? `${term.order}. ` : ""}
                      {term.name}
                    </p>
                    {term.isCurrent && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatDate(term.startDate)} – {formatDate(term.endDate)}
                  </p>
                </div>

                {!term.isCurrent && (
                  <button
                    type="button"
                    onClick={() => void handleSetCurrentTerm(term)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
                  >
                    Set as current
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
