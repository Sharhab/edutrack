"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  UserRound,
} from "lucide-react";

import api from "../../../../../../lib/axios";

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

type ClassOption = {
  _id: string;
  name: string;
  code?: string;
  level?: string;
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

type PopulatedTeacher =
  | string
  | {
      _id: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      email?: string;
    };

type TimetableEntry = {
  _id: string;
  classId: string | ClassOption;
  subjectId: PopulatedSubject;
  teacherId: PopulatedTeacher;
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

function getSubjectName(value: PopulatedSubject) {
  if (!value) return "Unknown subject";

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.code || "Unknown subject";
}

function getTeacherName(value: PopulatedTeacher) {
  if (!value) return "Unknown teacher";

  if (typeof value === "string") {
    return value;
  }

  const name = [
    value.firstName,
    value.middleName,
    value.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || value.email || "Unknown teacher";
}

export default function ClassTimetablePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [setting, setSetting] =
    useState<TimetableSetting | null>(null);

  const [entries, setEntries] =
    useState<TimetableEntry[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");

  const [loading, setLoading] = useState(false);
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
      setEntries([]);
      setSetting(null);
      return;
    }

    loadTerms(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !termId || !classId) {
      setEntries([]);
      setSetting(null);
      return;
    }

    loadTimetable();
  }, [sessionId, termId, classId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [
        sessionsResponse,
        classesResponse,
      ] = await Promise.all([
        api.get("/sessions"),
        api.get("/classes"),
      ]);

      const sessionList = extractArray<Session>(
        sessionsResponse,
        ["sessions"]
      );

      const classList = extractArray<ClassOption>(
        classesResponse,
        ["classes"]
      );

      setSessions(sessionList);
      setClasses(classList);

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
          "Failed to load timetable data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTerms(selectedSessionId: string) {
    try {
      setError("");
      setTermId("");

      const response = await api.get("/terms", {
        params: {
          sessionId: selectedSessionId,
        },
      });

      const termList = extractArray<Term>(
        response,
        ["terms"]
      );

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
      setTermId("");

      setError(
        err?.response?.data?.message ||
          "Failed to load terms."
      );
    }
  }

  async function loadTimetable() {
    if (!sessionId || !termId || !classId) {
      return;
    }

    try {
      setLoadingTimetable(true);
      setError("");

      const [
        settingResponse,
        timetableResponse,
      ] = await Promise.all([
        api.get("/timetable-settings", {
          params: {
            sessionId,
            termId,
          },
        }),

        api.get("/class/timetable", {
          params: {
            sessionId,
            termId,
            classId,
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
          "Failed to load class timetable."
      );
    } finally {
      setLoadingTimetable(false);
    }
  }

  const activeDays = useMemo(() => {
    if (!setting?.days?.length) {
      return [];
    }

    return DAYS.filter((day) =>
      setting.days.includes(day)
    );
  }, [setting]);

  const activePeriods = useMemo(() => {
    return (
      setting?.periods?.filter(
        (period) =>
          period.isActive && !period.isBreak
      ) || []
    );
  }, [setting]);

  const selectedClass = classes.find(
    (item) => item._id === classId
  );

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
              Class Timetable
            </h1>

            <p className="mt-1 text-sm text-white/60">
              View the complete weekly schedule for a class.
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
        <div className="grid gap-4 md:grid-cols-3">
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
              disabled={!sessionId}
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

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Class
            </label>

            <select
              className="input"
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
              disabled={!sessionId || !termId}
            >
              <option value="">
                Select class
              </option>

              {classes.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                  {item.level ? ` - ${item.level}` : ""}
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
              !termId ||
              !classId
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

      {setting && (
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedClass?.name || "Class"} Timetable
              </h2>

              <p className="text-sm text-white/50">
                {selectedClass?.level
                  ? `${selectedClass.level} • `
                  : ""}
                {entries.length} scheduled periods
              </p>
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
              No active timetable days or teaching periods
              are configured.
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
                                    {getTeacherName(
                                      entry.teacherId
                                    )}
                                  </p>
                                </div>

                                {entry.isDoublePeriod && (
                                  <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-1 text-[10px] text-purple-300">
                                    Double
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-1.5 text-xs text-white/50">
                                <UserRound size={13} />

                                <span>
                                  {entry.startTime} -{" "}
                                  {entry.endTime}
                                </span>
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

      {!setting &&
        !loadingTimetable &&
        sessionId &&
        termId &&
        classId && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <CalendarDays
              size={32}
              className="mx-auto text-white/30"
            />

            <p className="mt-3 text-sm text-white/60">
              No timetable settings were found for the
              selected session and term.
            </p>
          </div>
        )}
    </div>
  );
}
