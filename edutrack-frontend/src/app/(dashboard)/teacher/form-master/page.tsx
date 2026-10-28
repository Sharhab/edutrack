
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

import {
  getAttendanceRecords,
  createAttendance,
} from "../../../../lib/attendance";
import { getTerms } from "../../../../lib/options";

import AttendanceForm from "../../../../components/attendance/AttendanceForm";
import PageLoader from "../../../../components/ui/PageLoader";

import type {
  AttendanceFormValues,
  AttendanceRecord,
} from "../../../../types/attendance";
import type { ClassOption } from "../../../../types/options";

type TermOption = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Unable to complete the request."
    );
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createEmptyAttendance(): AttendanceFormValues {
  return {
    classId: "",
    sessionId: "",
    termId: "",
    date: getLocalDate(),
    records: [],
  };
}

export default function FormMasterDashboardPage() {
  const [sessions, setSessions] = useState<FormMasterSession[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [dashboard, setDashboard] =
    useState<FormMasterOverview | null>(null);

  const [selectedClass, setSelectedClass] =
    useState<FormMasterClass | null>(null);
  const [students, setStudents] = useState<FormMasterStudent[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceFormValues>(createEmptyAttendance);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [existingRecords, setExistingRecords] = useState(false);

  const loadDashboard = useCallback(async (id?: string) => {
    try {
      setLoading(true);
      setError("");
      setSelectedClass(null);
      setStudents([]);
      setAttendance(createEmptyAttendance());
      setExistingRecords(false);

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

        const [sessionResponse, termOptions] = await Promise.all([
          api.get("/sessions"),
          getTerms(),
        ]);

        if (!mounted) return;

        const sessionRows: FormMasterSession[] =
          sessionResponse.data.data || [];

        setSessions(sessionRows);
        setTerms(termOptions);

        const currentSession =
          sessionRows.find((item) => item.isCurrent) ||
          sessionRows[0];

        const currentTerm =
          termOptions.find((item) => item.isCurrent) ||
          termOptions[0];

        const initialSessionId = currentSession?._id || "";

        setSessionId(initialSessionId);
        setAttendance((previous) => ({
          ...previous,
          sessionId: initialSessionId,
          termId: currentTerm?._id || "",
        }));

        const data = await getFormMasterOverview(
          initialSessionId || undefined
        );

        if (mounted) setDashboard(data);
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
    setAttendance((previous) => ({
      ...previous,
      sessionId: id,
      classId: "",
      records: [],
    }));

    setSelectedClass(null);
    setStudents([]);
    setExistingRecords(false);
    setActionMessage("");

    await loadDashboard(id || undefined);
  }

  function updateAttendanceField<K extends keyof AttendanceFormValues>(
    field: K,
    value: AttendanceFormValues[K]
  ) {
    setAttendance((previous) => ({
      ...previous,
      [field]: value,
    }));

    setActionMessage("");
  }

  async function loadClassAttendance(
    item: FormMasterClass,
    date: string,
    selectedSessionId: string,
    termId: string
  ) {
    if (!selectedSessionId || !termId || !date) {
      setStudentsError(
        "Select an academic session, term, and date first."
      );
      return;
    }

    try {
      setSelectedClass(item);
      setStudents([]);
      setStudentsError("");
      setActionMessage("");
      setStudentsLoading(true);
      setExistingRecords(false);

      const [classStudents, attendanceResponse] = await Promise.all([
        getFormMasterClassStudents(item.classId, selectedSessionId),
        getAttendanceRecords({
          classId: item.classId,
          date,
          sessionId: selectedSessionId,
          termId,
        }),
      ]);

      const savedRecords: AttendanceRecord[] =
        attendanceResponse.records || [];

      const savedByStudent = new Map(
        savedRecords.map((record) => [
          String(record.studentId),
          record.status,
        ])
      );

      setStudents(classStudents);
      setExistingRecords(savedRecords.length > 0);

      setAttendance({
        classId: item.classId,
        sessionId: selectedSessionId,
        termId,
        date,
        records: classStudents.map((student) => ({
          studentId: student._id,
          studentName: student.fullName,
          // Existing statuses are restored. New entries default to
          // present, so review each student's status before saving.
          status: savedByStudent.get(student._id) || "present",
        })),
      });
    } catch (err) {
      setStudentsError(getErrorMessage(err));
      setStudents([]);
      setAttendance((previous) => ({
        ...previous,
        classId: item.classId,
        records: [],
      }));
    } finally {
      setStudentsLoading(false);
    }
  }

  async function handleViewStudents(item: FormMasterClass) {
    await loadClassAttendance(
      item,
      attendance.date || getLocalDate(),
      sessionId,
      attendance.termId
    );
  }

  async function handleReloadSelectedDate() {
    if (!selectedClass) {
      setStudentsError("Select an assigned class first.");
      return;
    }

    await loadClassAttendance(
      selectedClass,
      attendance.date,
      attendance.sessionId,
      attendance.termId
    );
  }

  function handleStudentStatusChange(
    studentId: string,
    status: "present" | "absent" | "late"
  ) {
    setAttendance((previous) => ({
      ...previous,
      records: previous.records.map((record) =>
        record.studentId === studentId
          ? { ...record, status }
          : record
      ),
    }));

    setActionMessage("");
  }

  async function handleSubmitAttendance() {
    if (!selectedClass) {
      setActionMessage("Select an assigned class first.");
      return;
    }

    if (
      !attendance.classId ||
      !attendance.sessionId ||
      !attendance.termId ||
      !attendance.date
    ) {
      setActionMessage(
        "Select a class, session, term, and attendance date."
      );
      return;
    }

    if (attendance.records.length === 0) {
      setActionMessage("There are no students to save attendance for.");
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage("");

      await createAttendance(attendance);

      setExistingRecords(true);
      setActionMessage(
        "Attendance saved successfully for the selected date."
      );

      // Reload the selected date to verify the saved records.
      await loadClassAttendance(
        selectedClass,
        attendance.date,
        attendance.sessionId,
        attendance.termId
      );
    } catch (err) {
      setActionMessage(getErrorMessage(err));
    } finally {
      setSubmitting(false);
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

  const classOptions: ClassOption[] = (dashboard?.classes || []).map(
    (item) => ({
      _id: item.classId,
      name: item.name,
    })
  );

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
            Welcome{teacherName ? `, ${teacherName}` : ""}. Manage your
            assigned classes and daily attendance.
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
            <option value="">Select session</option>
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
            No academic session is configured for this selection.
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
                disabled={!sessionId || !attendance.termId}
                className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open attendance
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedClass && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedClass.name} — Attendance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select the academic period and date, then load the attendance
              records for that day.
            </p>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="form-master-term"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Academic term
              </label>
              <select
                id="form-master-term"
                value={attendance.termId}
                onChange={(event) =>
                  updateAttendanceField("termId", event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
              >
                <option value="">Select term</option>
                {terms.map((term) => (
                  <option key={term._id} value={term._id}>
                    {term.name}
                    {term.isCurrent ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="form-master-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Attendance date
              </label>
              <input
                id="form-master-date"
                type="date"
                value={attendance.date}
                onChange={(event) =>
                  updateAttendanceField("date", event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void handleReloadSelectedDate()}
                disabled={
                  studentsLoading ||
                  !attendance.date ||
                  !attendance.termId ||
                  !attendance.sessionId
                }
                className="w-full rounded-lg bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {studentsLoading ? "Loading..." : "Load selected date"}
              </button>
            </div>
          </div>

          {existingRecords && (
            <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Existing attendance was found for this date. Review and update
              the statuses before saving.
            </p>
          )}

          {studentsError && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {studentsError}
            </p>
          )}

          {actionMessage && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
            >
              {actionMessage}
            </p>
          )}

          {studentsLoading ? (
            <PageLoader />
          ) : students.length > 0 ? (
            <AttendanceForm
              values={attendance}
              classes={classOptions}
              sessions={sessions}
              terms={terms}
              onChange={updateAttendanceField}
              onStudentStatusChange={handleStudentStatusChange}
              onSubmit={() => void handleSubmitAttendance()}
              submitting={submitting}
              submitLabel={
                existingRecords
                  ? "Update Attendance"
                  : "Save Attendance"
              }
            />
          ) : (
            <p className="text-sm text-slate-500">
              No students loaded. Select a date and choose Load selected date.
            </p>
          )}
        </section>
      )}
    </div>
  );
                           }
      
