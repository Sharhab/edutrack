"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  UserRound,
} from "lucide-react";

import api from "../../../../lib/axios";

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

type TimetablePeriod = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isActive: boolean;
};

type TimetableSetting = {
  days: string[];
  periods: TimetablePeriod[];
};

type PopulatedSubject =
  | string
  | {
      _id: string;
      name?: string;
      code?: string;
    };

type PopulatedClass =
  | string
  | {
      _id: string;
      name?: string;
      code?: string;
      level?: string;
    };

type TimetableEntry = {
  _id: string;
  classId: PopulatedClass;
  subjectId: PopulatedSubject;
  day: string;
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
  isDoublePeriod?: boolean;
  isActive?: boolean;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function extractArray<T>(
  response: any,
  keys: string[] = []
): T[] {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getId(value: any): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value._id || "";
}

function getSubjectName(value: PopulatedSubject) {
  if (!value) return "Unknown subject";

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.code || "Unknown subject";
}

function getClassName(value: PopulatedClass) {
  if (!value) return "Unknown class";

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.code || "Unknown class";
}

export default function TeacherTimetablePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [setting, setSetting] =
    useState<TimetableSetting | null>(null);

  const [entries, setEntries] = useState<TimetableEntry[]>(
    []
  );

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTerms, setLoadingTerms] =
    useState(false);
  const [loadingTimetable, setLoadingTimetable] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      setSetting(null);
      setEntries([]);
      return;
    }

    loadTerms(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !termId) {
      setSetting(null);
      setEntries([]);
      return;
    }

    loadTimetable();
  }, [sessionId, termId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sessions");

      const sessionList = extractArray<Session>(
        response,
        ["sessions"]
      );

      setSessions(sessionList);

      const currentSession =
        sessionList.find(
          (session) => session.isCurrent
        ) || sessionList[0];

      if (currentSession?._id) {
        setSessionId(currentSession._id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load sessions."
      );
    } finally {
      setLoading(false);
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

      const termList = extractArray<Term>(response, [
        "terms",
      ]);

      setTerms(termList);

      const currentTerm =
        termList.find(
          (term) => term.isCurrent
        ) || termList[0];

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

  async function loadTimetable() {
    try {
      setLoadingTimetable(true);
      setError("");

      /*
       * The backend uses the authenticated user's ID
       * for teacherId.
       */
      const [settingResponse, timetableResponse] =
        await Promise.all([
          api.get("/timetable-settings", {
            params: {
              sessionId,
              termId,
            },
          }),

          api.get("/timetables", {
            params: {
              sessionId,
              termId,
              isActive: true,
            },
          }),
        ]);

      const settingData =
        settingResponse?.data?.data ||
        settingResponse?.data;

      const timetableEntries =
        extractArray<TimetableEntry>(
          timetableResponse,
          ["entries", "timetables"]
        );

      setSetting(settingData || null);
      setEntries(timetableEntries);
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

  const activeDays = useMemo(() => {
    if (setting?.days?.length) {
      return DAYS.filter((day) =>
        setting.days.includes(day)
      );
    }

    return [];
  }, [setting]);

  const activePeriods = useMemo(() => {
    return (
      setting?.periods?.filter(
        (period) => period.isActive
      ) || []
    );
  }, [setting]);

  function getEntry(
    day: string,
    periodId: string
  ) {
    return entries.find(
      (entry) =>
        entry.day === day &&
        String(entry.periodId) ===
          String(periodId)
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
            <CalendarDays size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              My Timetable
            </h1>

            <p className="mt-1 text-sm text-white/60">
              View your teaching schedule for the selected
              academic term.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
              disabled={loading}
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
              disabled={
                !sessionId || loadingTerms
              }
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

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={loadTimetable}
            disabled={
              loadingTimetable ||
              !sessionId ||
              !termId
            }
            className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loadingTimetable
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {!setting &&
        !loadingTimetable &&
        sessionId &&
        termId && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <CalendarDays
              size={32}
              className="mx-auto text-white/30"
            />

            <p className="mt-3 text-sm text-white/60">
              No timetable settings were found for this
              term.
            </p>
          </div>
        )}

      {setting && (
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Weekly Schedule
              </h2>

              <p className="text-sm text-white/50">
                Your assigned teaching periods.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/50">
              <UserRound size={16} />
              {entries.length} scheduled periods
            </div>
          </div>

          {loadingTimetable ? (
            <div className="p-10 text-center">
              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-cyan-300"
              />

              <p className="mt-3 text-sm text-white/50">
                Loading timetable...
              </p>
            </div>
          ) : activeDays.length === 0 ||
            activePeriods.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/50">
              No active timetable days or periods are
              configured.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="sticky left-0 z-10 w-40 border-r border-white/10 px-4 py-4 text-left text-sm font-medium text-white/60">
                      Period
                    </th>

                    {activeDays.map((day) => (
                      <th
                        key={day}
                        className="min-w-[180px] px-4 py-4 text-left text-sm font-medium text-white/60"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {activePeriods.map((period) => (
                    <tr
                      key={period._id}
                      className="border-t border-white/10"
                    >
                      <td className="sticky left-0 z-10 border-r border-white/10 bg-[#111827] px-4 py-4 align-top">
                        <p className="font-medium">
                          {period.name}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {period.startTime} -{" "}
                          {period.endTime}
                        </p>
                      </td>

                      {activeDays.map((day) => {
                        const entry = getEntry(
                          day,
                          period._id
                        );

                        if (!entry) {
                          return (
                            <td
                              key={day}
                              className="h-28 px-3 py-3 align-top"
                            >
                              <div className="flex h-full min-h-[90px] items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-white/20">
                                Free
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={day}
                            className="px-3 py-3 align-top"
                          >
                            <div className="min-h-[90px] rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-cyan-100">
                                    {getSubjectName(
                                      entry.subjectId
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-white/50">
                                    {getClassName(
                                      entry.classId
                                    )}
                                  </p>
                                </div>

                                {entry.isDoublePeriod && (
                                  <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-1 text-[10px] text-purple-300">
                                    Double
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 text-xs text-white/50">
                                {entry.startTime} -{" "}
                                {entry.endTime}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
