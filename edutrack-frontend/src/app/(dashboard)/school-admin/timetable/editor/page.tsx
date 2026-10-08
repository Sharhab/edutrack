"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Trash2,
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

type SubjectOption = {
  _id: string;
  name: string;
  code?: string;
};

type TeacherOption = {
  _id: string;
  userId?:
    | string
    | {
        _id: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        email?: string;
      };
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
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

type TimetableEntry = {
  _id: string;
  classId: string | ClassOption;
  subjectId: string | SubjectOption;
  teacherId:
    | string
    | {
        _id: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        email?: string;
      };
  day: string;
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
  isDoublePeriod?: boolean;
  isActive?: boolean;
};

type FormState = {
  classId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  periodId: string;
  isDoublePeriod: boolean;
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

const emptyForm: FormState = {
  classId: "",
  subjectId: "",
  teacherId: "",
  day: "Monday",
  periodId: "",
  isDoublePeriod: false,
};

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

function getTeacherUserId(
  teacher: TeacherOption
): string {
  if (typeof teacher.userId === "string") {
    return teacher.userId;
  }

  if (teacher.userId?._id) {
    return teacher.userId._id;
  }

  return "";
}

function getTeacherName(
  teacher: TeacherOption
): string {
  if (
    typeof teacher.userId === "object" &&
    teacher.userId
  ) {
    const name = [
      teacher.userId.firstName,
      teacher.userId.middleName,
      teacher.userId.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    if (name) return name;

    if (teacher.userId.email) {
      return teacher.userId.email;
    }
  }

  const name = [
    teacher.firstName,
    teacher.middleName,
    teacher.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    name ||
    teacher.employeeId ||
    teacher.email ||
    "Teacher"
  );
}

function getClassName(value: any): string {
  if (!value) return "Unknown class";

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.code || "Unknown class";
}

function getSubjectName(value: any): string {
  if (!value) return "Unknown subject";

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.code || "Unknown subject";
}

function getTeacherDisplayName(value: any): string {
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

export default function TimetableEditorPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>(
    []
  );
  const [subjects, setSubjects] = useState<
    SubjectOption[]
  >([]);
  const [teachers, setTeachers] = useState<
    TeacherOption[]
  >([]);

  const [setting, setSetting] =
    useState<TimetableSetting | null>(null);

  const [entries, setEntries] = useState<
    TimetableEntry[]
  >([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [loading, setLoading] = useState(false);
  const [loadingTimetable, setLoadingTimetable] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
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

  const availableTeachers = useMemo(() => {
    return teachers.filter((teacher) =>
      getTeacherUserId(teacher)
    );
  }, [teachers]);

  const activePeriods = useMemo(() => {
    return (
      setting?.periods?.filter(
        (period) =>
          period.isActive && !period.isBreak
      ) || []
    );
  }, [setting]);

  const availableDays = useMemo(() => {
    return setting?.days || [];
  }, [setting]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [
        sessionsResponse,
        classesResponse,
        subjectsResponse,
        teachersResponse,
      ] = await Promise.all([
        api.get("/sessions"),
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/teachers"),
      ]);

      const sessionList = extractArray<Session>(
        sessionsResponse,
        ["sessions"]
      );

      setSessions(sessionList);

      setClasses(
        extractArray<ClassOption>(
          classesResponse,
          ["classes"]
        )
      );

      setSubjects(
        extractArray<SubjectOption>(
          subjectsResponse,
          ["subjects"]
        )
      );

      setTeachers(
        extractArray<TeacherOption>(
          teachersResponse,
          ["teachers"]
        )
      );

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
          "Failed to load timetable editor data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTerms(
    selectedSessionId: string
  ) {
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

      if (
        settingData?.days?.length &&
        !settingData.days.includes(form.day)
      ) {
        setForm((current) => ({
          ...current,
          day: settingData.days[0],
        }));
      }

      if (
        settingData?.periods?.length &&
        !settingData.periods.some(
          (period: TimetablePeriod) =>
            period._id === form.periodId
        )
      ) {
        const firstPeriod =
          settingData.periods.find(
            (period: TimetablePeriod) =>
              period.isActive && !period.isBreak
          );

        setForm((current) => ({
          ...current,
          periodId: firstPeriod?._id || "",
        }));
      }
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

  function updateForm(
    field: keyof FormState,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!sessionId) {
      setError("Please select a session.");
      return false;
    }

    if (!termId) {
      setError("Please select a term.");
      return false;
    }

    if (!form.classId) {
      setError("Please select a class.");
      return false;
    }

    if (!form.subjectId) {
      setError("Please select a subject.");
      return false;
    }

    if (!form.teacherId) {
      setError("Please select a teacher.");
      return false;
    }

    if (!form.day) {
      setError("Please select a day.");
      return false;
    }

    if (!form.periodId) {
      setError("Please select a period.");
      return false;
    }

    return true;
  }

  async function addEntry() {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/timetables", {
        sessionId,
        termId,
        classId: form.classId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        day: form.day,
        periodId: form.periodId,
        isDoublePeriod: form.isDoublePeriod,
        source: "manual",
      });

      setSuccess(
        "Timetable entry added successfully."
      );

      setForm((current) => ({
        ...current,
        classId: "",
        subjectId: "",
        teacherId: "",
        isDoublePeriod: false,
      }));

      await loadTimetable();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to add timetable entry."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this timetable entry?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/timetables/${id}`);

      setSuccess(
        "Timetable entry deleted successfully."
      );

      await loadTimetable();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete timetable entry."
      );
    }
  }

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
              Timetable Editor
            </h1>

            <p className="mt-1 text-sm text-white/60">
              Manually add and remove timetable entries.
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
            Academic Context
          </h2>
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
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Add Timetable Entry
          </h2>

          <p className="mt-1 text-sm text-white/50">
            The system will reject entries that create a
            class or teacher conflict.
          </p>
        </div>

        {!setting ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
            Select a session and term with configured
            timetable settings.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Class
                </label>

                <select
                  className="input"
                  value={form.classId}
                  onChange={(event) =>
                    updateForm(
                      "classId",
                      event.target.value
                    )
                  }
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
                      {item.level
                        ? ` - ${item.level}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Subject
                </label>

                <select
                  className="input"
                  value={form.subjectId}
                  onChange={(event) =>
                    updateForm(
                      "subjectId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select subject
                  </option>

                  {subjects.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.name}
                      {item.code
                        ? ` (${item.code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Teacher
                </label>

                <select
                  className="input"
                  value={form.teacherId}
                  onChange={(event) =>
                    updateForm(
                      "teacherId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select teacher
                  </option>

                  {availableTeachers.map((teacher) => {
                    const userId =
                      getTeacherUserId(teacher);

                    return (
                      <option
                        key={userId}
                        value={userId}
                      >
                        {getTeacherName(teacher)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Day
                </label>

                <select
                  className="input"
                  value={form.day}
                  onChange={(event) =>
                    updateForm(
                      "day",
                      event.target.value
                    )
                  }
                >
                  {availableDays.map((day) => (
                    <option
                      key={day}
                      value={day}
                    >
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Period
                </label>

                <select
                  className="input"
                  value={form.periodId}
                  onChange={(event) =>
                    updateForm(
                      "periodId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select period
                  </option>

                  {activePeriods.map((period) => (
                    <option
                      key={period._id}
                      value={period._id}
                    >
                      {period.name} ({period.startTime} -{" "}
                      {period.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.isDoublePeriod}
                    onChange={(event) =>
                      updateForm(
                        "isDoublePeriod",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                  />

                  <span className="text-sm text-white/70">
                    Double period
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={addEntry}
                disabled={
                  saving ||
                  !sessionId ||
                  !termId
                }
                className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={17} />
                )}

                {saving
                  ? "Adding..."
                  : "Add Entry"}
              </button>
            </div>
          </>
        )}
      </div>

      {setting && (
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="text-lg font-semibold">
                Current Timetable
              </h2>

              <p className="text-sm text-white/50">
                {entries.length} active timetable entries
              </p>
            </div>

            <button
              type="button"
              onClick={loadTimetable}
              disabled={loadingTimetable}
              className="btn-secondary inline-flex items-center gap-2"
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="sticky left-0 z-10 w-40 border-r border-white/10 px-4 py-4 text-left text-sm font-medium text-white/60">
                    Period
                  </th>

                  {availableDays.map((day) => (
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

                    {availableDays.map((day) => {
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
                          <div className="min-h-[110px] rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
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

                                <p className="mt-1 text-xs text-white/50">
                                  {getTeacherDisplayName(
                                    entry.teacherId
                                  )}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteEntry(
                                    entry._id
                                  )
                                }
                                className="shrink-0 rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                                title="Delete entry"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                              <span>
                                {entry.startTime} -{" "}
                                {entry.endTime}
                              </span>

                              {entry.isDoublePeriod && (
                                <span className="rounded-full bg-purple-500/10 px-2 py-1 text-purple-300">
                                  Double
                                </span>
                              )}
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
        </div>
      )}
    </div>
  );
}
