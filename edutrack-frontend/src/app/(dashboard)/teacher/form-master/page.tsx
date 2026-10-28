
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  RefreshCw,
  School,
} from "lucide-react";

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
import { useTenant } from "../../../../components/tenant/TenantProvider";

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

type AttendanceStatus = "present" | "absent" | "late";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Unable to complete the request. Please try again."
    );
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function getLocalDate(): string {
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
  const { tenant } = useTenant();
  const brandColor = tenant?.themeColor || "#06b6d4";
  const schoolName = tenant?.schoolName || "EduTrack";

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
        setError("");

        const [sessionResponse, termOptions] = await Promise.all([
          api.get("/sessions"),
          getTerms(),
        ]);

        if (!mounted) return;

        const sessionRows: FormMasterSession[] =
          sessionResponse.data.data || [];

        const termRows: TermOption[] = termOptions.map((term) => ({
          _id: term._id,
          name: term.name,
          isCurrent: term.isCurrent,
        }));

        setSessions(sessionRows);
        setTerms(termRows);

        const currentSession =
          sessionRows.find((item) => item.isCurrent) || sessionRows[0];

        const currentTerm =
          termRows.find((item) => item.isCurrent) || termRows[0];

        const initialSessionId = currentSession?._id || "";
        const initialTermId = currentTerm?._id || "";

        setSessionId(initialSessionId);
        setAttendance((previous) => ({
          ...previous,
          sessionId: initialSessionId,
          termId: initialTermId,
        }));

        const data = await getFormMasterOverview(
          initialSessionId || undefined
        );

        if (mounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSessionChange(id: string) {
    setSessionId(id);
    setSelectedClass(null);
    setStudents([]);
    setStudentsError("");
    setActionMessage("");
    setExistingRecords(false);

    setAttendance((previous) => ({
      ...previous,
      sessionId: id,
      classId: "",
      records: [],
    }));

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
    setStudentsError("");
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

      const savedByStudent = new Map<string, AttendanceStatus>(
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
    status: AttendanceStatus
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

  const classOptions: ClassOption[] = (dashboard?.classes || []).map(
    (item) => ({
      _id: item.classId,
      name: item.name,
    })
  );

  const teacherName = [
    dashboard?.teacher.firstName,
    dashboard?.teacher.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Unable to load Form Master dashboard
          </h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard(sessionId || undefined)}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      {/* School identity and page heading */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={`${schoolName} logo`}
                className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"
              />
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: brandColor }}
                aria-hidden="true"
              >
                <School size={27} />
              </div>
            )}

            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: brandColor }}
              >
                {schoolName}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Form Master Dashboard
              </h1>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Welcome{teacherName ? `, ${teacherName}` : ""}. Manage
                your assigned classes and daily attendance.
              </p>
            </div>
          </div>

          <div className="w-full lg:max-w-xs">
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:ring-2"
              style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
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
        </div>
      </header>

      {/* Overview statistics */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${brandColor}18`,
                color: brandColor,
              }}
            >
              <GraduationCap size={25} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Assigned classes</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {dashboard?.stats.assignedClasses ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Users size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Students in assigned classes
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {dashboard?.stats.totalStudents ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Assigned classes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            My Assigned Classes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Classes assigned to you for the selected academic session.
          </p>
        </div>

        {!dashboard?.session && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No academic session is configured for this selection.
          </div>
        )}

        {dashboard?.session && dashboard.classes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <BookOpen
              className="mx-auto mb-3 text-slate-400"
              size={32}
            />
            <h3 className="font-semibold text-slate-800">
              No classes assigned
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Contact your School Admin to be assigned as a Form Master.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard?.classes.map((item) => {
            const isSelected =
              selectedClass?.assignmentId === item.assignmentId;

            return (
              <article
                key={item.assignmentId}
                className={`rounded-xl border bg-white p-4 transition ${
                  isSelected
                    ? "shadow-sm"
                    : "border-slate-200 hover:shadow-sm"
                }`}
                style={
                  isSelected
                    ? { borderColor: brandColor }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {[item.level, item.code]
                        .filter(Boolean)
                        .join(" · ") || "Class"}
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-lg px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${brandColor}18`,
                      color: brandColor,
                    }}
                  >
                    {item.studentCount} students
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleViewStudents(item)}
                  disabled={
                    studentsLoading || !sessionId || !attendance.termId
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  <CalendarDays size={16} />
                  {isSelected ? "Reload attendance" : "Open attendance"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Daily and historical attendance */}
      {selectedClass && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: brandColor }}
              >
                Attendance register
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {selectedClass.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Select a session, term, and date to enter or edit
                attendance for that day.
              </p>
            </div>

            {existingRecords && (
              <span className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                Existing records loaded
              </span>
            )}
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
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2"
                style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
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
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2"
                style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                <RefreshCw
                  size={16}
                  className={studentsLoading ? "animate-spin" : ""}
                />
                {studentsLoading ? "Loading..." : "Load selected date"}
              </button>
            </div>
          </div>

          {existingRecords && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Attendance records were found for this date. Review the
              existing statuses and save your changes to update them.
            </div>
          )}

          {studentsError && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {studentsError}
            </p>
          )}

          {actionMessage && (
            <p
              role="status"
              className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
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
                existingRecords ? "Update Attendance" : "Save Attendance"
              }
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <Users
                className="mx-auto mb-2 text-slate-400"
                size={28}
              />
              <p className="text-sm font-medium text-slate-700">
                No students loaded
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Choose the academic term and date, then select Load
                selected date to view the register.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
