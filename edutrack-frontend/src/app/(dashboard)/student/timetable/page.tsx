"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Loader2 } from "lucide-react";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edutrack-dpui.onrender.com/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type Session = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

type Term = {
  _id: string;
  name: string;
  sessionId?: string | { _id: string };
  isCurrent?: boolean;
};

type Period = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  isActive?: boolean;
};

type TimetableSetting = {
  _id: string;
  days: string[];
  periods: Period[];
};

type TimetableEntry = {
  _id: string;
  subjectId:
    | string
    | {
        _id: string;
        name: string;
      };
  teacherId:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      };
  day: string;
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
  isDoublePeriod?: boolean;
};

function extractData<T>(response: any): T[] {
  const data = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.sessions)) return data.sessions;
  if (Array.isArray(data?.terms)) return data.terms;
  if (Array.isArray(data?.entries)) return data.entries;

  return [];
}

function extractSingle<T>(response: any): T | null {
  const data = response?.data?.data ?? response?.data ?? null;

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data;
}

function getSessionId(term: Term) {
  if (!term.sessionId) return "";

  return typeof term.sessionId === "string"
    ? term.sessionId
    : term.sessionId._id;
}

function getSubjectName(
  subject:
    | string
    | {
        _id: string;
        name: string;
      }
) {
  if (typeof subject === "string") {
    return "";
  }

  return subject?.name || "";
}

function getTeacherName(
  teacher:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      }
) {
  if (typeof teacher === "string") {
    return "";
  }

  if (teacher?.name) {
    return teacher.name;
  }

  return [teacher?.firstName, teacher?.lastName]
    .filter(Boolean)
    .join(" ");
}

export default function StudentTimetablePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [setting, setSetting] =
    useState<TimetableSetting | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingTimetable, setLoadingTimetable] =
    useState(false);
  const [error, setError] = useState("");

  /* =========================================
     LOAD SESSIONS
  ========================================= */
  useEffect(() => {
    async function loadSessions() {
      try {
        setLoadingInitial(true);
        setError("");

        const response = await api.get("/sessions");

        const loadedSessions =
          extractData<Session>(response);

        setSessions(loadedSessions);

        const currentSession =
          loadedSessions.find(
            (session) => session.isCurrent
          ) || loadedSessions[0];

        if (currentSession) {
          setSessionId(currentSession._id);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to load sessions."
        );
      } finally {
        setLoadingInitial(false);
      }
    }

    loadSessions();
  }, []);

  /* =========================================
     LOAD TERMS
  ========================================= */
  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      return;
    }

    async function loadTerms() {
      try {
        setError("");

        const response = await api.get("/terms", {
          params: {
            sessionId,
          },
        });

        const loadedTerms =
          extractData<Term>(response);

        const sessionTerms = loadedTerms.filter(
          (term) => {
            const termSessionId = getSessionId(term);

            return (
              !termSessionId ||
              termSessionId === sessionId
            );
          }
        );

        setTerms(sessionTerms);

        const currentTerm =
          sessionTerms.find(
            (term) => term.isCurrent
          ) || sessionTerms[0];

        setTermId(currentTerm?._id || "");
      } catch (err: any) {
        setTerms([]);
        setTermId("");

        setError(
          err?.response?.data?.message ||
            "Failed to load terms."
        );
      }
    }

    loadTerms();
  }, [sessionId]);

  /* =========================================
     LOAD STUDENT TIMETABLE
  ========================================= */
  useEffect(() => {
    if (!sessionId || !termId) {
      setSetting(null);
      setEntries([]);
      return;
    }

    async function loadTimetable() {
      try {
        setLoadingTimetable(true);
        setError("");

        const [settingResponse, timetableResponse] =
          await Promise.all([
            api.get("/timetable-settings", {
              params: {
                sessionId,
                termId,
              },
            }),

            api.get("/student/timetable", {
              params: {
                sessionId,
                termId,
              },
            }),
          ]);

        const loadedSetting =
          extractSingle<TimetableSetting>(
            settingResponse
          );

        const loadedEntries =
          extractData<TimetableEntry>(
            timetableResponse
          );

        setSetting(loadedSetting);
        setEntries(loadedEntries);
      } catch (err: any) {
        setSetting(null);
        setEntries([]);

        setError(
          err?.response?.data?.message ||
            "Failed to load your timetable."
        );
      } finally {
        setLoadingTimetable(false);
      }
    }

    loadTimetable();
  }, [sessionId, termId]);

  /* =========================================
     ACTIVE DAYS
  ========================================= */
  const activeDays = useMemo(() => {
    if (!setting?.days?.length) {
      return DAYS.slice(0, 5);
    }

    return DAYS.filter((day) =>
      setting.days.includes(day)
    );
  }, [setting]);

  /* =========================================
     ACTIVE PERIODS
  ========================================= */
  const periods = useMemo(() => {
    if (!setting?.periods) {
      return [];
    }

    return setting.periods.filter(
      (period) => period.isActive !== false
    );
  }, [setting]);

  /* =========================================
     FIND ENTRY
  ========================================= */
  function getEntry(day: string, period: Period) {
    return entries.find(
      (entry) =>
        entry.day === day &&
        entry.periodId === period._id
    );
  }

  const selectedSession = sessions.find(
    (session) => session._id === sessionId
  );

  const selectedTerm = terms.find(
    (term) => term._id === termId
  );

  /* =========================================
     LOADING
  ========================================= */
  if (loadingInitial) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading timetable...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-cyan-500/10 p-3">
              <CalendarDays
                size={24}
                className="text-cyan-300"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                My Timetable
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                View your weekly class timetable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTORS */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {/* SESSION */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Session
            </label>

            <select
              value={sessionId}
              onChange={(event) =>
                setSessionId(event.target.value)
              }
              className="input w-full"
            >
              <option value="">
                Select session
              </option>

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

          {/* TERM */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Term
            </label>

            <select
              value={termId}
              onChange={(event) =>
                setTermId(event.target.value)
              }
              disabled={!sessionId}
              className="input w-full disabled:opacity-50"
            >
              <option value="">
                Select term
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
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loadingTimetable && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading your timetable...
        </div>
      )}

      {/* EMPTY */}
      {!loadingTimetable &&
        sessionId &&
        termId &&
        entries.length === 0 &&
        !error && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center">
            <CalendarDays
              size={40}
              className="mx-auto mb-4 text-slate-500"
            />

            <h2 className="text-lg font-semibold">
              No timetable available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Your school has not published a timetable
              for this session and term yet.
            </p>
          </div>
        )}

      {/* TIMETABLE */}
      {!loadingTimetable &&
        setting &&
        entries.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            {/* TITLE */}
            <div className="mb-5 text-center">
              <h2 className="text-xl font-bold">
                My Weekly Timetable
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {selectedSession?.name || ""}
                {selectedTerm?.name
                  ? ` • ${selectedTerm.name}`
                  : ""}
              </p>
            </div>

            {/* GRID */}
            <div className="overflow-x-auto">
              <div className="min-w-[950px] overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-[160px_repeat(7,minmax(110px,1fr))]">
                  {/* HEADER */}
                  <div className="bg-white/5 p-3 text-sm font-semibold text-slate-300">
                    Period
                  </div>

                  {DAYS.map((day) => {
                    const active =
                      activeDays.includes(day);

                    return (
                      <div
                        key={day}
                        className={`border-l border-white/10 bg-white/5 p-3 text-center text-sm font-semibold ${
                          active
                            ? "text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}

                  {/* PERIODS */}
                  {periods.map((period) => (
                    <div
                      key={period._id}
                      className="contents"
                    >
                      {/* PERIOD */}
                      <div className="border-t border-white/10 bg-white/[0.03] p-3">
                        <p className="text-sm font-semibold text-white">
                          {period.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {period.startTime} –{" "}
                          {period.endTime}
                        </p>

                        {period.isBreak && (
                          <span className="mt-2 inline-block rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
                            BREAK
                          </span>
                        )}
                      </div>

                      {/* DAYS */}
                      {DAYS.map((day) => {
                        const entry = getEntry(
                          day,
                          period
                        );

                        const active =
                          activeDays.includes(day);

                        return (
                          <div
                            key={`${period._id}-${day}`}
                            className={`min-h-[105px] border-l border-t border-white/10 p-2 ${
                              active
                                ? "bg-slate-950/40"
                                : "bg-slate-950/80"
                            }`}
                          >
                            {!active ? (
                              <span className="text-xs text-slate-700">
                                —
                              </span>
                            ) : period.isBreak ? (
                              <div className="flex min-h-[85px] items-center justify-center text-xs font-semibold text-amber-300">
                                BREAK
                              </div>
                            ) : entry ? (
                              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                                <p className="font-semibold text-white">
                                  {getSubjectName(
                                    entry.subjectId
                                  ) ||
                                    "Subject"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {getTeacherName(
                                    entry.teacherId
                                  ) || "Teacher"}
                                </p>

                                <p className="mt-2 text-[11px] text-slate-500">
                                  {entry.startTime} –{" "}
                                  {entry.endTime}
                                </p>

                                {entry.isDoublePeriod && (
                                  <span className="mt-2 inline-block rounded-full bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-300">
                                    DOUBLE
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex min-h-[85px] items-center justify-center text-xs text-slate-700">
                                Free
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
