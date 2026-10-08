"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  ChevronDown,
  Loader2,
  Printer,
} from "lucide-react";

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

type SchoolClass = {
  _id: string;
  name: string;
  level?: string;
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
  classId:
    | string
    | {
        _id: string;
        name: string;
      };
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
  isBreak?: boolean;
};

type SchoolInfo = {
  schoolName?: string;
  logoUrl?: string;
};

function getId(value: string | { _id: string } | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function getSubjectName(
  value: string | { _id: string; name: string }
) {
  if (typeof value === "string") return "";
  return value?.name || "";
}

function getClassName(
  value: string | { _id: string; name: string }
) {
  if (typeof value === "string") return "";
  return value?.name || "";
}

function getTeacherName(
  value:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      }
) {
  if (typeof value === "string") return "";

  if (value.name) return value.name;

  return [value.firstName, value.lastName]
    .filter(Boolean)
    .join(" ");
}

function extractData<T>(response: any): T[] {
  const data = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.sessions)) return data.sessions;
  if (Array.isArray(data?.terms)) return data.terms;
  if (Array.isArray(data?.classes)) return data.classes;
  if (Array.isArray(data?.entries)) return data.entries;

  return [];
}

function extractSingle<T>(response: any): T | null {
  const data = response?.data?.data ?? response?.data ?? null;

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  if (data?.setting) return data.setting;
  if (data?.data) return data.data;

  return data;
}

function getSessionId(term: Term) {
  if (!term.sessionId) return "";

  return typeof term.sessionId === "string"
    ? term.sessionId
    : term.sessionId._id;
}

export default function TimetablePrintPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");

  const [setting, setSetting] =
    useState<TimetableSetting | null>(null);

  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [school, setSchool] = useState<SchoolInfo | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [error, setError] = useState("");

  /* =========================================
     LOAD SCHOOL INFO
  ========================================= */
  useEffect(() => {
    async function loadSchool() {
      try {
        const response = await api.get("/schools");

        const data = response?.data?.data ?? response?.data ?? null;

        if (data) {
          setSchool({
            schoolName:
              data.schoolName ||
              data.name ||
              data.school?.name ||
              "School",
            logoUrl:
              data.logoUrl ||
              data.logo ||
              data.school?.logoUrl ||
              "",
          });
        }
      } catch {
        // School information is optional for printing.
      }
    }

    loadSchool();
  }, []);

  /* =========================================
     LOAD SESSIONS / CLASSES
  ========================================= */
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        setError("");

        const [sessionsResponse, classesResponse] =
          await Promise.all([
            api.get("/sessions"),
            api.get("/classes"),
          ]);

        const loadedSessions =
          extractData<Session>(sessionsResponse);

        const loadedClasses =
          extractData<SchoolClass>(classesResponse);

        setSessions(loadedSessions);
        setClasses(loadedClasses);

        const currentSession =
          loadedSessions.find((item) => item.isCurrent) ||
          loadedSessions[0];

        if (currentSession) {
          setSessionId(currentSession._id);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to load timetable information."
        );
      } finally {
        setLoadingInitial(false);
      }
    }

    loadInitialData();
  }, []);

  /* =========================================
     LOAD TERMS WHEN SESSION CHANGES
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

        const loadedTerms = extractData<Term>(response);

        const sessionTerms = loadedTerms.filter((term) => {
          const termSessionId = getSessionId(term);

          return !termSessionId || termSessionId === sessionId;
        });

        setTerms(sessionTerms);

        const currentTerm =
          sessionTerms.find((term) => term.isCurrent) ||
          sessionTerms[0];

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
     LOAD TIMETABLE
  ========================================= */
  useEffect(() => {
    if (!sessionId || !termId || !classId) {
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

            api.get("/timetables", {
              params: {
                sessionId,
                termId,
                classId,
                isActive: true,
              },
            }),
          ]);

        const loadedSetting =
          extractSingle<TimetableSetting>(settingResponse);

        const loadedEntries =
          extractData<TimetableEntry>(timetableResponse);

        setSetting(loadedSetting);
        setEntries(loadedEntries);
      } catch (err: any) {
        setSetting(null);
        setEntries([]);

        setError(
          err?.response?.data?.message ||
            "Failed to load timetable."
        );
      } finally {
        setLoadingTimetable(false);
      }
    }

    loadTimetable();
  }, [sessionId, termId, classId]);

  /* =========================================
     SELECTED DATA
  ========================================= */
  const selectedSession = useMemo(
    () => sessions.find((item) => item._id === sessionId),
    [sessions, sessionId]
  );

  const selectedTerm = useMemo(
    () => terms.find((item) => item._id === termId),
    [terms, termId]
  );

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === classId),
    [classes, classId]
  );

  /* =========================================
     PERIODS
  ========================================= */
  const periods = useMemo(() => {
    if (!setting?.periods) return [];

    return setting.periods.filter(
      (period) => period.isActive !== false
    );
  }, [setting]);

  /* =========================================
     DAYS
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
     FIND ENTRY
  ========================================= */
  function getEntry(day: string, period: Period) {
    return entries.find((entry) => {
      const entryPeriodId = getId(entry.periodId as any);

      return (
        entry.day === day &&
        entryPeriodId === period._id
      );
    });
  }

  /* =========================================
     PRINT
  ========================================= */
  function handlePrint() {
    if (!classId || !setting || !entries.length) {
      return;
    }

    window.print();
  }

  if (loadingInitial) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="animate-spin" size={20} />
          Loading timetable...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 text-white print:hidden">
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
                  Print Timetable
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Generate a clean printable timetable for a class.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            disabled={
              !classId ||
              !setting ||
              !entries.length ||
              loadingTimetable
            }
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={18} />
            Print / Save PDF
          </button>
        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            {/* SESSION */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Session
              </label>

              <div className="relative">
                <select
                  value={sessionId}
                  onChange={(event) => {
                    setSessionId(event.target.value);
                    setClassId("");
                  }}
                  className="input w-full appearance-none pr-10"
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

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* TERM */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Term
              </label>

              <div className="relative">
                <select
                  value={termId}
                  onChange={(event) =>
                    setTermId(event.target.value)
                  }
                  disabled={!sessionId}
                  className="input w-full appearance-none pr-10 disabled:opacity-50"
                >
                  <option value="">Select term</option>

                  {terms.map((term) => (
                    <option
                      key={term._id}
                      value={term._id}
                    >
                      {term.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Class
              </label>

              <div className="relative">
                <select
                  value={classId}
                  onChange={(event) =>
                    setClassId(event.target.value)
                  }
                  disabled={!sessionId || !termId}
                  className="input w-full appearance-none pr-10 disabled:opacity-50"
                >
                  <option value="">Select class</option>

                  {classes.map((schoolClass) => (
                    <option
                      key={schoolClass._id}
                      value={schoolClass._id}
                    >
                      {schoolClass.name}
                      {schoolClass.level
                        ? ` — ${schoolClass.level}`
                        : ""}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
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
            Loading timetable...
          </div>
        )}

        {/* EMPTY */}
        {!loadingTimetable &&
          classId &&
          setting &&
          entries.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center">
              <CalendarDays
                size={40}
                className="mx-auto mb-4 text-slate-500"
              />

              <h2 className="text-lg font-semibold text-white">
                No timetable entries
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                There are no timetable entries for this class,
                session and term.
              </p>
            </div>
          )}

        {/* PREVIEW */}
        {!loadingTimetable &&
          setting &&
          classId &&
          entries.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="min-w-[1000px]">
                <div className="mb-5 text-center">
                  <h2 className="text-xl font-bold">
                    {school?.schoolName || "School"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {selectedSession?.name || ""}
                    {selectedTerm?.name
                      ? ` • ${selectedTerm.name}`
                      : ""}
                  </p>

                  <p className="mt-2 text-lg font-semibold text-cyan-300">
                    {selectedClass?.name || "Class"} Timetable
                  </p>
                </div>

                <div className="grid grid-cols-[170px_repeat(7,minmax(120px,1fr))] overflow-hidden rounded-xl border border-white/10">
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

                  {/* PERIOD ROWS */}
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
                            className={`min-h-[100px] border-l border-t border-white/10 p-2 ${
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
                              <div className="flex h-full min-h-[80px] items-center justify-center text-xs font-semibold text-amber-300">
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

                                {entry.isDoublePeriod && (
                                  <span className="mt-2 inline-block rounded-full bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-300">
                                    DOUBLE
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex min-h-[80px] items-center justify-center text-xs text-slate-700">
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
          )}
      </div>

      {/* =========================================
          PRINT VERSION
      ========================================= */}
      <div className="hidden print:block">
        <div className="print-page">
          {/* SCHOOL HEADER */}
          <div className="print-header">
            {school?.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.schoolName || "School"}
                className="print-logo"
              />
            ) : null}

            <div>
              <h1>
                {school?.schoolName || "School"}
              </h1>

              <p>
                {selectedSession?.name || ""}
                {selectedTerm?.name
                  ? ` • ${selectedTerm.name}`
                  : ""}
              </p>

              <h2>
                {selectedClass?.name || "Class"} Timetable
              </h2>
            </div>
          </div>

          {/* PRINT TABLE */}
          <table className="print-table">
            <thead>
              <tr>
                <th className="period-column">
                  Period
                </th>

                {DAYS.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {periods.map((period) => (
                <tr key={period._id}>
                  <td className="period-cell">
                    <strong>{period.name}</strong>

                    <span>
                      {period.startTime} –{" "}
                      {period.endTime}
                    </span>

                    {period.isBreak && (
                      <small>BREAK</small>
                    )}
                  </td>

                  {DAYS.map((day) => {
                    const entry = getEntry(
                      day,
                      period
                    );

                    const active =
                      activeDays.includes(day);

                    return (
                      <td
                        key={`${period._id}-${day}`}
                        className={
                          !active
                            ? "inactive-cell"
                            : ""
                        }
                      >
                        {!active ? (
                          "—"
                        ) : period.isBreak ? (
                          <strong>BREAK</strong>
                        ) : entry ? (
                          <div>
                            <strong>
                              {getSubjectName(
                                entry.subjectId
                              ) || "Subject"}
                            </strong>

                            <span className="teacher">
                              {getTeacherName(
                                entry.teacherId
                              ) || "Teacher"}
                            </span>

                            {entry.isDoublePeriod && (
                              <small>
                                Double Period
                              </small>
                            )}
                          </div>
                        ) : (
                          <span className="free">
                            Free
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-footer">
            <span>
              Generated by EduTrack
            </span>

            <span>
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================
          PRINT STYLES
      ========================================= */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-page {
            width: 100%;
            color: #000000;
            background: #ffffff;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .print-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 18px;
            text-align: center;
          }

          .print-logo {
            width: 58px;
            height: 58px;
            object-fit: cover;
            border-radius: 8px;
          }

          .print-header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
          }

          .print-header p {
            margin: 4px 0;
            font-size: 12px;
            color: #444444;
          }

          .print-header h2 {
            margin: 6px 0 0;
            font-size: 17px;
            font-weight: 700;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #222222;
            padding: 6px;
            vertical-align: middle;
            text-align: center;
          }

          .print-table th {
            background: #eeeeee !important;
            font-weight: 800;
            height: 32px;
          }

          .print-table td {
            height: 62px;
          }

          .print-table .period-column {
            width: 105px;
          }

          .period-cell {
            background: #f5f5f5 !important;
          }

          .period-cell strong {
            display: block;
            font-size: 10px;
          }

          .period-cell span {
            display: block;
            margin-top: 3px;
            font-size: 8px;
            color: #555555;
          }

          .period-cell small {
            display: block;
            margin-top: 3px;
            font-size: 7px;
            font-weight: 700;
          }

          .print-table td strong {
            display: block;
            font-size: 10px;
          }

          .print-table .teacher {
            display: block;
            margin-top: 3px;
            font-size: 8px;
            color: #555555;
          }

          .print-table td small {
            display: block;
            margin-top: 3px;
            font-size: 7px;
            color: #555555;
          }

          .print-table .free {
            color: #888888;
            font-size: 8px;
          }

          .inactive-cell {
            color: #bbbbbb;
            background: #fafafa !important;
          }

          .print-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 8px;
            color: #666666;
          }
        }
      `}</style>
    </>
  );
}
