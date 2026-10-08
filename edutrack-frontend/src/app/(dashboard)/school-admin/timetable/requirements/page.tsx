"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import api from "../../../../../lib/axios";

type Session = {
  _id: string;
  name: string;
};

type Term = {
  _id: string;
  name: string;
  sessionId?: string | { _id: string };
};

type ClassOption = {
  _id: string;
  name: string;
  code?: string;
  level?: string;
  isActive?: boolean;
};

type SubjectOption = {
  _id: string;
  name: string;
  code?: string;
  category?: string;
  isCore?: boolean;
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
  employeeId?: string;
  email?: string;
};

type Requirement = {
  _id: string;
  sessionId?: string | Session;
  termId?: string | Term;
  classId?: string | ClassOption;
  subjectId?: string | SubjectOption;
  teacherId?:
    | string
    | {
        _id: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        email?: string;
      };
  periodsPerWeek: number;
  allowDoublePeriod: boolean;
  maxConsecutivePeriods: number;
  isActive: boolean;
};

type RequirementRow = {
  classId: string;
  subjectId: string;
  teacherId: string;
  periodsPerWeek: number;
  allowDoublePeriod: boolean;
  maxConsecutivePeriods: number;
  isActive: boolean;
};

const emptyRow: RequirementRow = {
  classId: "",
  subjectId: "",
  teacherId: "",
  periodsPerWeek: 4,
  allowDoublePeriod: false,
  maxConsecutivePeriods: 1,
  isActive: true,
};

function extractArray<T>(response: any, keys: string[] = []): T[] {
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

function getTeacherUserId(teacher: TeacherOption): string {
  if (!teacher) return "";

  if (typeof teacher.userId === "string") {
    return teacher.userId;
  }

  if (teacher.userId?._id) {
    return teacher.userId._id;
  }

  return "";
}

function getTeacherName(teacher: TeacherOption): string {
  if (!teacher) return "Teacher";

  if (typeof teacher.userId === "object" && teacher.userId) {
    const name = [
      teacher.userId.firstName,
      teacher.userId.middleName,
      teacher.userId.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    if (name) return name;

    if (teacher.userId.email) return teacher.userId.email;
  }

  const name = [
    teacher.firstName,
    teacher.middleName,
    teacher.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  if (name) return name;

  if (teacher.employeeId) return teacher.employeeId;

  if (teacher.email) return teacher.email;

  return "Teacher";
}

function getClassName(value: any): string {
  if (!value) return "Unknown class";

  if (typeof value === "string") return value;

  return value.name || value.code || "Unknown class";
}

function getSubjectName(value: any): string {
  if (!value) return "Unknown subject";

  if (typeof value === "string") return value;

  return value.name || value.code || "Unknown subject";
}

function getRequirementTeacherName(value: any): string {
  if (!value) return "Unknown teacher";

  if (typeof value === "string") return value;

  const name = [
    value.firstName,
    value.middleName,
    value.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || value.email || "Unknown teacher";
}

export default function TimetableRequirementsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [rows, setRows] = useState<RequirementRow[]>([
    { ...emptyRow },
  ]);

  const [requirements, setRequirements] = useState<Requirement[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Teachers that have a valid User ID.
   * The backend expects teacherId to be the User ID.
   */
  const availableTeachers = useMemo(() => {
    return teachers.filter((teacher) => getTeacherUserId(teacher));
  }, [teachers]);

  /*
   * IMPORTANT:
   * Classes are NOT filtered by session or term.
   *
   * A class belongs to the school and can be reused across
   * different sessions and terms.
   *
   * We only remove explicitly inactive classes.
   */
  const availableClasses = useMemo(() => {
    return classes.filter((item) => item.isActive !== false);
  }, [classes]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      setRequirements([]);
      return;
    }

    loadTerms(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !termId) {
      setRequirements([]);
      return;
    }

    loadRequirements();
  }, [sessionId, termId]);

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

      const sessionList = extractArray<Session>(sessionsResponse, [
        "sessions",
      ]);

      const classList = extractArray<ClassOption>(classesResponse, [
        "classes",
      ]);

      const subjectList = extractArray<SubjectOption>(subjectsResponse, [
        "subjects",
      ]);

      const teacherList = extractArray<TeacherOption>(teachersResponse, [
        "teachers",
      ]);

      setSessions(sessionList);

      /*
       * Keep ALL classes returned by the school classes endpoint.
       * Do not filter by selected session or term.
       */
      setClasses(classList);

      setSubjects(subjectList);
      setTeachers(teacherList);

      const currentSession =
        sessionList.find((session: any) => session.isCurrent) ||
        sessionList[0];

      if (currentSession?._id) {
        setSessionId(currentSession._id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load timetable requirement data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTerms(selectedSessionId: string) {
    try {
      setError("");

      const response = await api.get("/terms", {
        params: {
          sessionId: selectedSessionId,
        },
      });

      const termList = extractArray<Term>(response, ["terms"]);

      setTerms(termList);

      const currentTerm =
        termList.find((term: any) => term.isCurrent) || termList[0];

      setTermId(currentTerm?._id || "");
    } catch (err: any) {
      setTerms([]);
      setTermId("");

      setError(
        err?.response?.data?.message || "Failed to load terms."
      );
    }
  }

  async function loadRequirements() {
    if (!sessionId || !termId) return;

    try {
      setLoadingRequirements(true);
      setError("");

      const response = await api.get("/timetable-requirements", {
        params: {
          sessionId,
          termId,
        },
      });

      const requirementList = extractArray<Requirement>(response, [
        "requirements",
      ]);

      setRequirements(requirementList);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load timetable requirements."
      );
    } finally {
      setLoadingRequirements(false);
    }
  }

  function updateRow(
    index: number,
    field: keyof RequirementRow,
    value: string | number | boolean
  ) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        ...emptyRow,
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((currentRows) => {
      if (currentRows.length === 1) {
        return currentRows;
      }

      return currentRows.filter(
        (_, rowIndex) => rowIndex !== index
      );
    });
  }

  function validateRows() {
    if (!sessionId) {
      setError("Please select a session.");
      return false;
    }

    if (!termId) {
      setError("Please select a term.");
      return false;
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      if (!row.classId) {
        setError(`Please select a class for row ${index + 1}.`);
        return false;
      }

      if (!row.subjectId) {
        setError(`Please select a subject for row ${index + 1}.`);
        return false;
      }

      if (!row.teacherId) {
        setError(`Please select a teacher for row ${index + 1}.`);
        return false;
      }

      if (
        !Number.isInteger(row.periodsPerWeek) ||
        row.periodsPerWeek < 1 ||
        row.periodsPerWeek > 20
      ) {
        setError(
          `Periods per week for row ${index + 1} must be between 1 and 20.`
        );
        return false;
      }

      if (
        !Number.isInteger(row.maxConsecutivePeriods) ||
        row.maxConsecutivePeriods < 1 ||
        row.maxConsecutivePeriods > 4
      ) {
        setError(
          `Maximum consecutive periods for row ${
            index + 1
          } must be between 1 and 4.`
        );
        return false;
      }
    }

    return true;
  }

  async function saveRequirements() {
    if (!validateRows()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        requirements: rows.map((row) => ({
          sessionId,
          termId,
          classId: row.classId,
          subjectId: row.subjectId,
          teacherId: row.teacherId,
          periodsPerWeek: Number(row.periodsPerWeek),
          allowDoublePeriod: Boolean(row.allowDoublePeriod),
          maxConsecutivePeriods: Number(
            row.maxConsecutivePeriods
          ),
          isActive: Boolean(row.isActive),
        })),
      };

      const response = await api.post(
        "/timetable-requirements/bulk",
        payload
      );

      const result = response?.data?.data || response?.data;

      setSuccess(
        `Requirements saved successfully. ${
          result?.created ?? rows.length
        } requirement(s) created.`
      );

      setRows([{ ...emptyRow }]);

      await loadRequirements();
    } catch (err: any) {
      const responseData = err?.response?.data;

      if (Array.isArray(responseData?.errors)) {
        setError(
          responseData.errors
            .map((item: any) => item.message || String(item))
            .join(" ")
        );
      } else {
        setError(
          responseData?.message ||
            "Failed to save timetable requirements."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteRequirement(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this timetable requirement?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/timetable-requirements/${id}`);

      setSuccess("Timetable requirement deleted successfully.");

      await loadRequirements();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete timetable requirement."
      );
    }
  }

  function getSelectedTeacherId(teacher: TeacherOption) {
    return getTeacherUserId(teacher);
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold">
          Teaching Requirements
        </h1>

        <p className="mt-1 text-sm text-white/60">
          Define how many periods each subject needs per week for
          each class and teacher.
        </p>
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
              <option value="">Select session</option>

              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
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
              <option value="">Select term</option>

              {terms.map((term) => (
                <option key={term._id} value={term._id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Add Teaching Requirements
            </h2>

            <p className="text-sm text-white/50">
              Add one or more subject requirements for the
              selected session and term.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">
                  Subject
                </th>
                <th className="px-4 py-3 font-medium">
                  Teacher
                </th>
                <th className="px-4 py-3 font-medium">
                  Periods / Week
                </th>
                <th className="px-4 py-3 font-medium">
                  Double Period
                </th>
                <th className="px-4 py-3 font-medium">
                  Max Consecutive
                </th>
                <th className="px-4 py-3 font-medium">
                  Active
                </th>
                <th className="px-4 py-3 font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-white/10"
                >
                  <td className="px-4 py-3">
                    <select
                      className="input min-w-[190px]"
                      value={row.classId}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "classId",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select class</option>

                      {availableClasses.map((item) => (
                        <option
                          key={item._id}
                          value={item._id}
                        >
                          {item.name}
                          {item.level
                            ? ` - ${item.level}`
                            : ""}
                          {item.code
                            ? ` (${item.code})`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {availableClasses.length === 0 && (
                      <p className="mt-1 text-xs text-amber-300">
                        No active classes are available.
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <select
                      className="input min-w-[190px]"
                      value={row.subjectId}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "subjectId",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select subject</option>

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
                  </td>

                  <td className="px-4 py-3">
                    <select
                      className="input min-w-[210px]"
                      value={row.teacherId}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "teacherId",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select teacher</option>

                      {availableTeachers.map((teacher) => {
                        const userId =
                          getSelectedTeacherId(teacher);

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

                    {teachers.length > 0 &&
                      availableTeachers.length === 0 && (
                        <p className="mt-1 text-xs text-amber-300">
                          Teacher user IDs are not available
                          from the teacher response.
                        </p>
                      )}
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input w-28"
                      value={row.periodsPerWeek}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "periodsPerWeek",
                          Number(event.target.value)
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.allowDoublePeriod}
                        onChange={(event) =>
                          updateRow(
                            index,
                            "allowDoublePeriod",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-white/20 bg-white/10"
                      />

                      <span className="text-white/70">
                        Allow
                      </span>
                    </label>
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      max={4}
                      className="input w-28"
                      value={row.maxConsecutivePeriods}
                      onChange={(event) =>
                        updateRow(
                          index,
                          "maxConsecutivePeriods",
                          Number(event.target.value)
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(event) =>
                          updateRow(
                            index,
                            "isActive",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-white/20 bg-white/10"
                      />

                      <span className="text-white/70">
                        Active
                      </span>
                    </label>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Remove row"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-white/10 p-5">
          <button
            type="button"
            onClick={saveRequirements}
            disabled={saving || !sessionId || !termId}
            className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />

            {saving ? "Saving..." : "Save Requirements"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Existing Requirements
            </h2>

            <p className="text-sm text-white/50">
              Requirements already configured for the selected
              session and term.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequirements}
            disabled={
              loadingRequirements || !sessionId || !termId
            }
            className="btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loadingRequirements ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>

        {loadingRequirements ? (
          <div className="p-8 text-center text-sm text-white/50">
            Loading requirements...
          </div>
        ) : requirements.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50">
            No timetable requirements have been configured for
            this session and term.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-white/5 text-left text-white/60">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Class
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Subject
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Teacher
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Periods / Week
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Double
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Max Consecutive
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {requirements.map((requirement) => (
                  <tr
                    key={requirement._id}
                    className="border-t border-white/10"
                  >
                    <td className="px-4 py-3">
                      {getClassName(requirement.classId)}
                    </td>

                    <td className="px-4 py-3">
                      {getSubjectName(requirement.subjectId)}
                    </td>

                    <td className="px-4 py-3">
                      {getRequirementTeacherName(
                        requirement.teacherId
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {requirement.periodsPerWeek}
                    </td>

                    <td className="px-4 py-3">
                      {requirement.allowDoublePeriod
                        ? "Yes"
                        : "No"}
                    </td>

                    <td className="px-4 py-3">
                      {requirement.maxConsecutivePeriods}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          requirement.isActive
                            ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                            : "rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/50"
                        }
                      >
                        {requirement.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          deleteRequirement(requirement._id)
                        }
                        className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                        title="Delete requirement"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
