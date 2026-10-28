"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Check, RefreshCw, Search, Users } from "lucide-react";

import api from "../../../../../lib/axios";
import {
  assignFormMaster,
  getFormMasterAssignments,
  reassignFormMaster,
} from "../../../../../lib/form-master-assignments";

import type {
  FormMasterAssignment,
  FormMasterSession,
} from "../../../../../lib/form-master-assignments";

import { getClasses } from "../../../../../lib/classes";
import { getTeachers } from "../../../../../lib/teachers";

import type { ClassItem } from "../../../../../types/class";
import type { Teacher } from "../../../../../types/teacher";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "The request failed.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

function sessionName(value: FormMasterAssignment["sessionId"]) {
  return typeof value === "string" ? value : value.name;
}

function className(value: FormMasterAssignment["classId"]) {
  return typeof value === "string" ? value : value.name;
}

function teacherName(value: FormMasterAssignment["teacherId"]) {
  if (typeof value === "string") return value;

  const user = value.userId;

  return user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Teacher details unavailable";
}

function teacherId(value: FormMasterAssignment["teacherId"]) {
  return typeof value === "string" ? value : value._id;
}

function classId(value: FormMasterAssignment["classId"]) {
  return typeof value === "string" ? value : value._id;
}

export default function FormMasterAssignmentPage() {
  const [sessions, setSessions] = useState<FormMasterSession[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<FormMasterAssignment[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAssignments = useCallback(async (id: string) => {
    const rows = await getFormMasterAssignments(id);
    setAssignments(rows);
  }, []);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [sessionResponse, classRows, teacherRows] =
        await Promise.all([
          api.get("/sessions"),
          getClasses(),
          getTeachers({ search: "" }),
        ]);

      const sessionRows: FormMasterSession[] =
        sessionResponse.data.data || [];

      setSessions(sessionRows);
      setClasses(classRows || []);
      setTeachers(teacherRows || []);

      const current =
        sessionRows.find((session) => session.isCurrent) ||
        sessionRows[0];

      if (current) {
        setSessionId(current._id);
        await loadAssignments(current._id);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadAssignments]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!sessionId) return;

    void loadAssignments(sessionId).catch((err: unknown) => {
      setError(errorMessage(err));
    });
  }, [sessionId, loadAssignments]);

  const activeTeachers = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          teacher.status === "active" &&
          teacher.userId?.isActive === true
      ),
    [teachers]
  );

  const activeClasses = useMemo(
    () => classes.filter((item) => item.isActive !== false),
    [classes]
  );

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) =>
      `${className(assignment.classId)} ${teacherName(
        assignment.teacherId
      )}`
        .toLowerCase()
        .includes(query)
    );
  }, [assignments, search]);

  async function handleAssign() {
    setError("");
    setSuccess("");

    if (!sessionId) {
      setError("Please select an academic session.");
      return;
    }

    if (!selectedClass) {
      setError("Please select a class.");
      return;
    }

    if (!selectedTeacher) {
      setError("Please select a teacher.");
      return;
    }

    const existing = assignments.find(
      (item) => classId(item.classId) === selectedClass
    );

    try {
      setSaving(true);

      if (existing) {
        const confirmed = window.confirm(
          `${className(existing.classId)} already has ${teacherName(
            existing.teacherId
          )} as Form Master. Reassign this class?`
        );

        if (!confirmed) return;

        await reassignFormMaster(existing._id, selectedTeacher);
        setSuccess("Form Master reassigned successfully.");
      } else {
        await assignFormMaster({
          sessionId,
          classId: selectedClass,
          teacherId: selectedTeacher,
        });

        setSuccess("Form Master assigned successfully.");
      }

      setSelectedClass("");
      setSelectedTeacher("");

      await loadAssignments(sessionId);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading Form Master assignments...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
            <Users size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Form Master Assignment
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Assign class teachers for each academic session.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Assign Form Master
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Academic Session *
            <select
              value={sessionId}
              onChange={(event) => {
                setSessionId(event.target.value);
                setError("");
                setSuccess("");
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}
                  {session.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Class *
            <select
              value={selectedClass}
              onChange={(event) => {
                setSelectedClass(event.target.value);
                setError("");
                setSuccess("");
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
            >
              <option value="">Select class</option>
              {activeClasses.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Teacher *
            <select
              value={selectedTeacher}
              onChange={(event) => {
                setSelectedTeacher(event.target.value);
                setError("");
                setSuccess("");
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
            >
              <option value="">Select teacher</option>
              {activeTeachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.userId
                    ? `${teacher.userId.firstName} ${teacher.userId.lastName}`
                    : `${teacher.firstName || ""} ${teacher.lastName || ""}`}
                </option>
              ))}
            </select>

            <span className="mt-1 block text-xs text-slate-500">
              Only active teachers are shown.
            </span>
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleAssign()}
            disabled={saving || !sessionId}
            className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={17} className="mr-2" />
            {saving ? "Saving..." : "Assign Form Master"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedClass("");
              setSelectedTeacher("");
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} className="mr-2" />
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Existing Form Master Assignments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {assignments.length} assignment(s) for the selected session.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by class or teacher..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Class</th>
                <th className="px-5 py-3 font-semibold">
                  Form Master
                </th>
                <th className="px-5 py-3 font-semibold">Session</th>
                <th className="px-5 py-3 font-semibold">Assigned On</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((assignment) => (
                <tr key={assignment._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {className(assignment.classId)}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {teacherName(assignment.teacherId)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {sessionName(assignment.sessionId)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setSelectedClass(classId(assignment.classId));
                        setSelectedTeacher(teacherId(assignment.teacherId));
                        setError("");
                        setSuccess("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      Load to reassign
                    </button>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No Form Master assignments found for this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
          }
