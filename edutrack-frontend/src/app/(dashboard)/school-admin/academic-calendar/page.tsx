
"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/axios";

type SessionOption = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

type TermOption = {
  _id: string;
  name: string;
  sessionId?: string | { _id: string };
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
};

function dateInputValue(value?: string | null) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default function AcademicCalendarPage() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedTerm = terms.find(
    (term) => term._id === termId
  );

  // Load this school's academic sessions.
  useEffect(() => {
    let active = true;

    async function loadSessions() {
      setLoadingSessions(true);
      setError("");

      try {
        const response = await api.get("/sessions");
        const payload = response.data?.data ?? response.data;

        const list: SessionOption[] =
          Array.isArray(payload) ? payload : [];

        if (!active) return;

        setSessions(list);

        const current =
          list.find((item) => item.isCurrent) || list[0];

        setSessionId(current?._id || "");
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoadingSessions(false);
      }
    }

    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  // Load terms belonging only to the selected session.
  useEffect(() => {
    let active = true;

    setTerms([]);
    setTermId("");
    setStartDate("");
    setEndDate("");
    setMessage("");

    if (!sessionId) {
      setLoadingTerms(false);
      return () => {
        active = false;
      };
    }

    async function loadTerms() {
      setLoadingTerms(true);
      setError("");

      try {
        const response = await api.get("/terms", {
          params: { sessionId },
        });

        const payload = response.data?.data ?? response.data;

        const list: TermOption[] = Array.isArray(payload)
          ? payload
          : [];

        if (!active) return;

        setTerms(list);

        const current =
          list.find((item) => item.isCurrent) || list[0];

        setTermId(current?._id || "");
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoadingTerms(false);
      }
    }

    void loadTerms();

    return () => {
      active = false;
    };
  }, [sessionId]);

  // Populate date inputs whenever the selected term changes.
  useEffect(() => {
    setStartDate(dateInputValue(selectedTerm?.startDate));
    setEndDate(dateInputValue(selectedTerm?.endDate));
    setMessage("");
  }, [selectedTerm?._id, selectedTerm?.startDate, selectedTerm?.endDate]);

  async function handleSave() {
    if (!termId) {
      setError("Select an academic term first.");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError("The closing date must not be before the start date.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(`/terms/${termId}`, {
        startDate: startDate || null,
        endDate: endDate || null,
      });

      const updated: TermOption =
        response.data?.data ?? response.data;

      setTerms((previous) =>
        previous.map((term) =>
          term._id === termId
            ? {
                ...term,
                startDate: updated.startDate ?? null,
                endDate: updated.endDate ?? null,
              }
            : term
        )
      );

      setMessage("Academic calendar dates saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const selectedSession = sessions.find(
    (session) => session._id === sessionId
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
          School settings
        </p>

        <h1 className="mt-2 text-2xl font-bold text-white">
          Academic Calendar
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Set the dates for each academic term. These dates
          will be used on student report cards.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-7">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
          >
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="calendar-session"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Academic session
            </label>

            <select
              id="calendar-session"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              disabled={loadingSessions || saving}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="">Select session</option>

              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}
                  {session.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="calendar-term"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Academic term
            </label>

            <select
              id="calendar-term"
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              disabled={
                loadingTerms ||
                !sessionId ||
                !terms.length ||
                saving
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="">Select term</option>

              {terms.map((term) => (
                <option key={term._id} value={term._id}>
                  {term.name}
                  {term.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTerm && (
          <>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
              <p className="font-semibold text-white">
                {selectedSession?.name} · {selectedTerm.name}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Dates apply to this term at your school only.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="term-start-date"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Term start date
                </label>

                <input
                  id="term-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Used as the resumption date when this is the next term.
                </p>
              </div>

              <div>
                <label
                  htmlFor="term-end-date"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Term closing date
                </label>

                <input
                  id="term-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />

                <p className="mt-2 text-xs text-slate-500">
                  The date the selected term ends.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loadingTerms}
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving dates…" : "Save academic dates"}
              </button>
            </div>
          </>
        )}

        {!loadingSessions && sessions.length === 0 && (
          <p className="text-sm text-amber-300">
            Create an academic session before configuring term dates.
          </p>
        )}

        {!loadingTerms && sessionId && terms.length === 0 && (
          <p className="text-sm text-amber-300">
            No terms exist for this session yet. Create its terms first.
          </p>
        )}
      </section>
    </div>
  );
}
