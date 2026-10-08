"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import api from "../../../../../lib/axios";

type Session = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

type Term = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

type GenerationResult = {
  totalRequirements: number;
  generated: number;
  conflicts: Array<{
    classId: string;
    subjectId: string;
    teacherId: string;
    required: number;
    scheduled: number;
    unscheduled: number;
  }>;
};

export default function TimetableGeneratorPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [clearExisting, setClearExisting] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const [result, setResult] =
    useState<GenerationResult | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      return;
    }

    loadTerms(sessionId);
  }, [sessionId]);

  async function loadSessions() {
    try {
      setError("");

      const response = await api.get("/sessions");

      const data = response?.data?.data;

      const sessionList = Array.isArray(data)
        ? data
        : Array.isArray(data?.sessions)
        ? data.sessions
        : [];

      setSessions(sessionList);

      const currentSession =
        sessionList.find(
          (session: Session) => session.isCurrent
        ) || sessionList[0];

      if (currentSession?._id) {
        setSessionId(currentSession._id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load sessions."
      );
    }
  }

  async function loadTerms(selectedSessionId: string) {
    try {
      setLoadingTerms(true);
      setError("");
      setTermId("");

      const response = await api.get("/terms", {
        params: {
          sessionId: selectedSessionId,
        },
      });

      const data = response?.data?.data;

      const termList = Array.isArray(data)
        ? data
        : Array.isArray(data?.terms)
        ? data.terms
        : [];

      setTerms(termList);

      const currentTerm =
        termList.find((term: Term) => term.isCurrent) ||
        termList[0];

      if (currentTerm?._id) {
        setTermId(currentTerm._id);
      }
    } catch (err: any) {
      setTerms([]);
      setError(
        err?.response?.data?.message ||
          "Failed to load terms."
      );
    } finally {
      setLoadingTerms(false);
    }
  }

  async function generateTimetable() {
    if (!sessionId) {
      setError("Please select a session.");
      return;
    }

    if (!termId) {
      setError("Please select a term.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setResult(null);

      const response = await api.post(
        "/timetables/generate",
        {
          sessionId,
          termId,
          clearExisting,
        }
      );

      const data =
        response?.data?.data || response?.data;

      setResult(data);

      if (data?.conflicts?.length > 0) {
        setSuccess(
          `Timetable generated with ${data.conflicts.length} unresolved requirement(s).`
        );
      } else {
        setSuccess(
          "Timetable generated successfully with no scheduling conflicts."
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to generate timetable."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              Timetable Generator
            </h1>

            <p className="mt-1 text-sm text-white/60">
              Automatically generate a timetable from your
              teaching requirements.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Generation Settings
          </h2>

          <p className="mt-1 text-sm text-white/50">
            Select the academic session and term for the
            timetable.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Session
            </label>

            <select
              className="input"
              value={sessionId}
              onChange={(event) =>
                setSessionId(event.target.value)
              }
            >
              <option value="">Select session</option>

              {sessions.map((session) => (
                <option
                  key={session._id}
                  value={session._id}
                >
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Term
            </label>

            <select
              className="input"
              value={termId}
              onChange={(event) =>
                setTermId(event.target.value)
              }
              disabled={!sessionId || loadingTerms}
            >
              <option value="">
                {loadingTerms
                  ? "Loading terms..."
                  : "Select term"}
              </option>

              {terms.map((term) => (
                <option
                  key={term._id}
                  value={term._id}
                >
                  {term.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(event) =>
                setClearExisting(event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
            />

            <span>
              <span className="block text-sm font-medium">
                Replace existing timetable
              </span>

              <span className="mt-1 block text-xs text-white/50">
                When enabled, existing timetable entries for
                the selected session and term will be removed
                before generating a new timetable.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={generateTimetable}
            disabled={
              loading ||
              !sessionId ||
              !termId ||
              loadingTerms
            }
            className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw
                size={17}
                className="animate-spin"
              />
            ) : (
              <Sparkles size={17} />
            )}

            {loading
              ? "Generating..."
              : "Generate Timetable"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3">
          <CalendarDays
            size={20}
            className="text-cyan-300"
          />

          <div>
            <h2 className="font-semibold">
              Before generating
            </h2>

            <p className="text-sm text-white/50">
              Make sure timetable settings and teaching
              requirements are configured first.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">
              1. Timetable Settings
            </p>

            <p className="mt-1 text-xs text-white/50">
              Configure school days and teaching periods.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">
              2. Teaching Requirements
            </p>

            <p className="mt-1 text-xs text-white/50">
              Set weekly periods, teachers and classes.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">
              3. Generate
            </p>

            <p className="mt-1 text-xs text-white/50">
              Generate the timetable automatically.
            </p>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-semibold">
              Generation Result
            </h2>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">
                Requirements
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {result.totalRequirements}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">
                Periods Generated
              </p>

              <p className="mt-1 text-2xl font-semibold text-emerald-300">
                {result.generated}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">
                Unresolved Requirements
              </p>

              <p className="mt-1 text-2xl font-semibold text-amber-300">
                {result.conflicts?.length || 0}
              </p>
            </div>
          </div>

          {result.conflicts?.length === 0 ? (
            <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <CheckCircle2
                size={20}
                className="text-emerald-300"
              />

              <div>
                <p className="text-sm font-medium text-emerald-200">
                  All requirements were scheduled.
                </p>

                <p className="mt-1 text-xs text-emerald-300/70">
                  The generated timetable did not leave any
                  requirement unscheduled.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-5 mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">
                Some requirements could not be fully
                scheduled.
              </p>

              <div className="mt-3 space-y-2">
                {result.conflicts.map(
                  (conflict, index) => (
                    <div
                      key={`${conflict.classId}-${conflict.subjectId}-${index}`}
                      className="rounded-lg border border-white/10 bg-black/10 p-3 text-xs text-white/70"
                    >
                      Required{" "}
                      <span className="font-semibold text-white">
                        {conflict.required}
                      </span>{" "}
                      periods, but only{" "}
                      <span className="font-semibold text-white">
                        {conflict.scheduled}
                      </span>{" "}
                      were scheduled.
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
