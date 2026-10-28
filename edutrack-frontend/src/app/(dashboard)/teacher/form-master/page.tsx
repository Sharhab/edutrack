"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, GraduationCap, Users } from "lucide-react";

import api from "../../../../lib/axios";
import {
  getFormMasterOverview,
  getFormMasterClassStudents,
} from "../../../../lib/form-master-portal";

import type {
  FormMasterOverview,
  FormMasterSession,
  FormMasterClass,
  FormMasterStudent,
} from "../../../../lib/form-master-portal";

import PageLoader from "../../../../components/ui/PageLoader";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Unable to load Form Master dashboard."
    );
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function FormMasterDashboardPage() {
  const [sessions, setSessions] = useState<FormMasterSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [dashboard, setDashboard] =
    useState<FormMasterOverview | null>(null);

  const [selectedClass, setSelectedClass] =
    useState<FormMasterClass | null>(null);

  const [students, setStudents] = useState<FormMasterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");

  const loadDashboard = useCallback(async (id?: string) => {
    try {
      setLoading(true);
      setError("");
      setSelectedClass(null);
      setStudents([]);

      const data = await getFormMasterOverview(id);
      setDashboard(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        setLoading(true);

        const response = await api.get("/sessions");
        if (!mounted) return;

        const rows: FormMasterSession[] = response.data.data || [];
        setSessions(rows);

        const current =
          rows.find((session) => session.isCurrent) || rows[0];

        if (current) {
          setSessionId(current._id);
          const data = await getFormMasterOverview(current._id);

          if (mounted) setDashboard(data);
        } else {
          const data = await getFormMasterOverview();
          if (mounted) setDashboard(data);
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSessionChange(id: string) {
    setSessionId(id);
    await loadDashboard(id || undefined);
  }

  async function handleViewStudents(item: FormMasterClass) {
    if (!sessionId) {
      setStudentsError("Select an academic session first.");
      return;
    }

    try {
      setSelectedClass(item);
      setStudents([]);
      setStudentsError("");
      setStudentsLoading(true);

      const rows = await getFormMasterClassStudents(
        item.classId,
        sessionId
      );

      setStudents(rows);
    } catch (err) {
      setStudentsError(getErrorMessage(err));
    } finally {
      setStudentsLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h1 className="text-lg font-semibold text-red-800">
          Unable to load Form Master dashboard
        </h1>
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard(sessionId || undefined)}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const teacherName = [
    dashboard?.teacher.firstName,
    dashboard?.teacher.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-700">
            EduTrack · Teacher Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Form Master Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome{teacherName ? `, ${teacherName}` : ""}. Monitor your
            assigned classes and students.
          </p>
        </div>

        <div className="w-full md:max-w-xs">
          <label
            htmlFor="form-master-session"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Academic session
          </label>

          <select
            id="form-master-session"
            value={sessionId}
            onChange={(event) =>
              void handleSessionChange(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
          >
            <option value="">Current session</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>
                {session.name}
                {session.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Assigned classes</p>
              <p className="text-2xl font-bold text-slate-900">
                {dashboard?.stats.assignedClasses ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Students in assigned classes
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {dashboard?.stats.totalStudents ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            My Assigned Classes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Only classes assigned to you for the selected session appear here.
          </p>
        </div>

        {!dashboard?.session && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No current academic session is configured. Ask your School Admin
            to configure the academic session.
          </div>
        )}

        {dashboard?.session && dashboard.classes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-400" size={32} />
            <h3 className="font-semibold text-slate-800">
              No classes assigned
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Contact your School Admin to be assigned as a Form Master.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard?.classes.map((item) => (
            <article
              key={item.assignmentId}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {[item.level, item.code].filter(Boolean).join(" · ") ||
                      "Class"}
                  </p>
                </div>

                <span className="rounded-lg bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
                  {item.studentCount} students
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleViewStudents(item)}
                className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View students
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedClass && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedClass.name} — Students
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Academic session: {dashboard?.session?.name || "Not selected"}
            </p>
          </div>

          {studentsLoading && (
            <p className="p-5 text-sm text-slate-500">
              Loading students...
            </p>
          )}

          {studentsError && (
            <p role="alert" className="p-5 text-sm text-red-700">
              {studentsError}
            </p>
          )}

          {!studentsLoading && !studentsError && students.length === 0 && (
            <p className="p-5 text-sm text-slate-500">
              No students were found in this class.
            </p>
          )}

          {!studentsLoading && students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Admission number</th>
                    <th className="px-5 py-3">Gender</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {student.fullName}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {student.admissionNumber || "—"}
                      </td>
                      <td className="px-5 py-3 capitalize text-slate-600">
                        {student.gender || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
            }
