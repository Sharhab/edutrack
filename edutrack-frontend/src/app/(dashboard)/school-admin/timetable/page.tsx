"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CalendarDays,
  Save,
} from "lucide-react";

import api from "../../../../lib/axios";

type Session = {
  _id: string;
  name: string;
};

type Term = {
  _id: string;
  name: string;
  sessionId: string;
};

type Period = {
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isActive: boolean;
  _id?: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const defaultPeriod: Period = {
  name: "",
  startTime: "",
  endTime: "",
  isBreak: false,
  isActive: true,
};

export default function TimetablePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [days, setDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);

  const [periods, setPeriods] = useState<Period[]>([
    {
      name: "Period 1",
      startTime: "08:00",
      endTime: "08:40",
      isBreak: false,
      isActive: true,
    },
    {
      name: "Period 2",
      startTime: "08:40",
      endTime: "09:20",
      isBreak: false,
      isActive: true,
    },
    {
      name: "Break",
      startTime: "09:20",
      endTime: "09:40",
      isBreak: true,
      isActive: true,
    },
  ]);

  const [settingId, setSettingId] = useState("");

  const [loadingSessions, setLoadingSessions] =
    useState(true);

  const [loadingTerms, setLoadingTerms] =
    useState(false);

  const [loadingSettings, setLoadingSettings] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  // =========================================
  // LOAD SESSIONS
  // =========================================

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      setError("");

      const res = await api.get("/sessions");

      const data = res?.data?.data;

      const sessionList = Array.isArray(data)
        ? data
        : Array.isArray(data?.sessions)
        ? data.sessions
        : [];

      setSessions(sessionList);

      const currentSession =
        sessionList.find(
          (session: any) => session.isCurrent
        );

      if (currentSession) {
        setSessionId(currentSession._id);
      } else if (sessionList.length > 0) {
        setSessionId(sessionList[0]._id);
      }
    } catch (err: any) {
      console.error(
        "Failed to load sessions",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load sessions"
      );
    } finally {
      setLoadingSessions(false);
    }
  }

  // =========================================
  // LOAD TERMS
  // =========================================

  async function loadTerms(selectedSessionId: string) {
    if (!selectedSessionId) {
      setTerms([]);
      setTermId("");
      return;
    }

    try {
      setLoadingTerms(true);
      setError("");

      const res = await api.get(
        `/terms?sessionId=${selectedSessionId}`
      );

      const data = res?.data?.data;

      const termList = Array.isArray(data)
        ? data
        : Array.isArray(data?.terms)
        ? data.terms
        : [];

      setTerms(termList);

      const currentTerm =
        termList.find(
          (term: any) => term.isCurrent
        );

      if (currentTerm) {
        setTermId(currentTerm._id);
      } else if (termList.length > 0) {
        setTermId(termList[0]._id);
      } else {
        setTermId("");
      }
    } catch (err: any) {
      console.error(
        "Failed to load terms",
        err
      );

      setTerms([]);
      setTermId("");

      setError(
        err?.response?.data?.message ||
          "Failed to load terms"
      );
    } finally {
      setLoadingTerms(false);
    }
  }

  // =========================================
  // LOAD EXISTING SETTINGS
  // =========================================

  async function loadSettings(
    selectedSessionId: string,
    selectedTermId: string
  ) {
    if (
      !selectedSessionId ||
      !selectedTermId
    ) {
      return;
    }

    try {
      setLoadingSettings(true);
      setError("");
      setMessage("");

      const res = await api.get(
        `/timetable-settings?sessionId=${selectedSessionId}&termId=${selectedTermId}`
      );

      const data = res?.data?.data;

      if (!data) {
        setSettingId("");

        setDays([
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ]);

        setPeriods([
          {
            name: "Period 1",
            startTime: "08:00",
            endTime: "08:40",
            isBreak: false,
            isActive: true,
          },
          {
            name: "Period 2",
            startTime: "08:40",
            endTime: "09:20",
            isBreak: false,
            isActive: true,
          },
          {
            name: "Break",
            startTime: "09:20",
            endTime: "09:40",
            isBreak: true,
            isActive: true,
          },
        ]);

        return;
      }

      setSettingId(data._id || "");

      if (Array.isArray(data.days)) {
        setDays(data.days);
      }

      if (Array.isArray(data.periods)) {
        setPeriods(
          data.periods.map((period: Period) => ({
            name: period.name || "",
            startTime:
              period.startTime || "",
            endTime:
              period.endTime || "",
            isBreak:
              Boolean(period.isBreak),
            isActive:
              period.isActive !== false,
            _id: period._id,
          }))
        );
      }
    } catch (err: any) {
      /*
       * A 404/no existing settings should not
       * prevent the admin from creating settings.
       */

      if (
        err?.response?.status === 404
      ) {
        setSettingId("");
        return;
      }

      console.error(
        "Failed to load timetable settings",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load timetable settings"
      );
    } finally {
      setLoadingSettings(false);
    }
  }

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadSessions();
  }, []);

  // =========================================
  // SESSION CHANGED
  // =========================================

  useEffect(() => {
    if (!sessionId) return;

    loadTerms(sessionId);
  }, [sessionId]);

  // =========================================
  // TERM CHANGED
  // =========================================

  useEffect(() => {
    if (!sessionId || !termId) return;

    loadSettings(
      sessionId,
      termId
    );
  }, [sessionId, termId]);

  // =========================================
  // TOGGLE DAY
  // =========================================

  function toggleDay(day: string) {
    setDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter(
          (item) => item !== day
        );
      }

      return [...prev, day];
    });
  }

  // =========================================
  // ADD PERIOD
  // =========================================

  function addPeriod() {
    setPeriods((prev) => [
      ...prev,
      {
        ...defaultPeriod,
        name: `Period ${prev.length + 1}`,
      },
    ]);
  }

  // =========================================
  // REMOVE PERIOD
  // =========================================

  function removePeriod(index: number) {
    setPeriods((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  // =========================================
  // UPDATE PERIOD
  // =========================================

  function updatePeriod(
    index: number,
    field: keyof Period,
    value: string | boolean
  ) {
    setPeriods((prev) =>
      prev.map((period, i) =>
        i === index
          ? {
              ...period,
              [field]: value,
            }
          : period
      )
    );
  }

  // =========================================
  // VALIDATE
  // =========================================

  function validate() {
    if (!sessionId) {
      return "Please select a session";
    }

    if (!termId) {
      return "Please select a term";
    }

    if (days.length === 0) {
      return "Select at least one school day";
    }

    if (periods.length === 0) {
      return "Add at least one period";
    }

    for (const period of periods) {
      if (!period.name.trim()) {
        return "Every period must have a name";
      }

      if (!period.startTime) {
        return `Start time is required for ${period.name}`;
      }

      if (!period.endTime) {
        return `End time is required for ${period.name}`;
      }
    }

    return "";
  }

  // =========================================
  // SAVE
  // =========================================

  async function saveSettings() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        sessionId,
        termId,
        days,
        periods: periods.map((period) => ({
          name: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak,
          isActive: period.isActive,
        })),
      };

      let res;

      if (settingId) {
        res = await api.put(
          `/timetable-settings/${settingId}`,
          payload
        );
      } else {
        res = await api.post(
          "/timetable-settings",
          payload
        );
      }

      const saved =
        res?.data?.data;

      if (saved?._id) {
        setSettingId(saved._id);
      }

      setMessage(
        settingId
          ? "Timetable settings updated successfully"
          : "Timetable settings created successfully"
      );
    } catch (err: any) {
      console.error(
        "Failed to save timetable settings",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save timetable settings"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 text-white">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <CalendarDays size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            Timetable
          </h1>

          <p className="text-slate-400">
            Configure school days and timetable periods
          </p>
        </div>

      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300">
          {error}
        </div>
      )}

      {/* =========================================
          SUCCESS
      ========================================= */}

      {message && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-green-300">
          {message}
        </div>
      )}

      {/* =========================================
          SESSION / TERM
      ========================================= */}

      <div className="rounded-2xl border border-white/10 p-5">

        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Academic Period
          </h2>

          <p className="text-sm text-slate-400">
            Select the session and term for this timetable
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* SESSION */}

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Session
            </label>

            <select
              value={sessionId}
              onChange={(e) =>
                setSessionId(e.target.value)
              }
              disabled={loadingSessions}
              className="input w-full"
            >
              <option value="">
                {loadingSessions
                  ? "Loading sessions..."
                  : "Select session"}
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
            <label className="mb-1 block text-sm text-slate-300">
              Term
            </label>

            <select
              value={termId}
              onChange={(e) =>
                setTermId(e.target.value)
              }
              disabled={
                loadingTerms ||
                !sessionId
              }
              className="input w-full"
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
      </div>

      {/* =========================================
          SCHOOL DAYS
      ========================================= */}

      <div className="rounded-2xl border border-white/10 p-5">

        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            School Days
          </h2>

          <p className="text-sm text-slate-400">
            Select the days used for teaching
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          {DAYS.map((day) => {
            const selected =
              days.includes(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() =>
                  toggleDay(day)
                }
                className={
                  selected
                    ? "rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                    : "rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
                }
              >
                {day}
              </button>
            );
          })}

        </div>
      </div>

      {/* =========================================
          PERIODS
      ========================================= */}

      <div className="rounded-2xl border border-white/10 overflow-x-auto">

        <div className="flex items-center justify-between border-b border-white/10 p-5">

          <div>
            <h2 className="text-lg font-semibold">
              Timetable Periods
            </h2>

            <p className="text-sm text-slate-400">
              Configure teaching periods and breaks
            </p>
          </div>

          <button
            type="button"
            onClick={addPeriod}
            className="btn-secondary"
          >
            <Plus
              size={16}
              className="mr-2"
            />

            Add Period
          </button>

        </div>

        <table className="w-full text-sm">

          <thead className="bg-white/5">

            <tr>
              <th className="p-3 text-left">
                Period
              </th>

              <th className="p-3 text-left">
                Start Time
              </th>

              <th className="p-3 text-left">
                End Time
              </th>

              <th className="p-3 text-center">
                Break
              </th>

              <th className="p-3 text-center">
                Active
              </th>

              <th className="p-3 text-center">
              </th>
            </tr>

          </thead>

          <tbody>

            {periods.map(
              (period, index) => (
                <tr
                  key={index}
                  className="border-t border-white/10"
                >

                  {/* NAME */}

                  <td className="p-2">

                    <input
                      type="text"
                      value={period.name}
                      onChange={(e) =>
                        updatePeriod(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Period 1"
                      className="input w-full"
                    />

                  </td>

                  {/* START */}

                  <td className="p-2">

                    <input
                      type="time"
                      value={
                        period.startTime
                      }
                      onChange={(e) =>
                        updatePeriod(
                          index,
                          "startTime",
                          e.target.value
                        )
                      }
                      className="input w-full"
                    />

                  </td>

                  {/* END */}

                  <td className="p-2">

                    <input
                      type="time"
                      value={
                        period.endTime
                      }
                      onChange={(e) =>
                        updatePeriod(
                          index,
                          "endTime",
                          e.target.value
                        )
                      }
                      className="input w-full"
                    />

                  </td>

                  {/* BREAK */}

                  <td className="p-2 text-center">

                    <input
                      type="checkbox"
                      checked={
                        period.isBreak
                      }
                      onChange={(e) =>
                        updatePeriod(
                          index,
                          "isBreak",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />

                  </td>

                  {/* ACTIVE */}

                  <td className="p-2 text-center">

                    <input
                      type="checkbox"
                      checked={
                        period.isActive
                      }
                      onChange={(e) =>
                        updatePeriod(
                          index,
                          "isActive",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />

                  </td>

                  {/* DELETE */}

                  <td className="p-2 text-center">

                    <button
                      type="button"
                      onClick={() =>
                        removePeriod(
                          index
                        )
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>

                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>
      </div>

      {/* =========================================
          SAVE
      ========================================= */}

      <div className="flex gap-3">

        <button
          type="button"
          onClick={saveSettings}
          disabled={
            saving ||
            loadingSettings
          }
          className="btn-primary"
        >
          <Save
            size={16}
            className="mr-2"
          />

          {saving
            ? "Saving..."
            : settingId
            ? "Update Timetable Settings"
            : "Save Timetable Settings"}
        </button>

      </div>

    </div>
  );
}
