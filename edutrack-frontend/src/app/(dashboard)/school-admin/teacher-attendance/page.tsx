
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Search,
  RefreshCw,
  Settings,
  MapPin,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import api from "../../../../../lib/axios";

type StaffRecord = {
  teacherId: string;
  employeeId: string;
  teacherName: string;
  email: string;
  designation: string;
  status: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  lateMinutes: number;
  totalMinutes: number;
};

type Summary = {
  totalTeachers: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  excused: number;
  notClockedIn: number;
};

type DashboardData = {
  date: string;
  timezone: string;
  isWorkingDay: boolean;
  summary: Summary;
  records: StaffRecord[];
};

const EMPTY_SUMMARY: Summary = {
  totalTeachers: 0,
  present: 0,
  late: 0,
  absent: 0,
  halfDay: 0,
  onLeave: 0,
  excused: 0,
  notClockedIn: 0,
};

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusStyle(status: string) {
  switch (status) {
    case "present":
      return "bg-emerald-500/10 text-emerald-400";
    case "late":
      return "bg-amber-500/10 text-amber-400";
    case "absent":
      return "bg-red-500/10 text-red-400";
    case "half_day":
      return "bg-purple-500/10 text-purple-400";
    case "on_leave":
      return "bg-blue-500/10 text-blue-400";
    case "excused":
      return "bg-cyan-500/10 text-cyan-400";
    default:
      return "bg-slate-500/10 text-slate-400";
  }
}

function statusLabel(status: string) {
  if (status === "not_clocked_in") return "Not clocked in";
  return status.replaceAll("_", " ");
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Unable to load staff attendance."
    );
  }

  return "Unable to load staff attendance.";
}

export default function StaffAttendanceDashboardPage() {
  const [date, setDate] = useState(getToday);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/teacher-attendance/dashboard",
        {
          params: { date },
        }
      );

      setData(response.data?.data || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const summary = data?.summary || EMPTY_SUMMARY;
  const records = data?.records || [];

  const filteredRecords = records.filter((record) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      record.teacherName.toLowerCase().includes(searchValue) ||
      record.employeeId.toLowerCase().includes(searchValue) ||
      record.email.toLowerCase().includes(searchValue) ||
      record.designation.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const cards = [
    {
      label: "Total Staff",
      value: summary.totalTeachers,
      icon: Users,
      color: "text-cyan-400",
      background: "bg-cyan-500/10",
    },
    {
      label: "Present",
      value: summary.present,
      icon: CheckCircle2,
      color: "text-emerald-400",
      background: "bg-emerald-500/10",
    },
    {
      label: "Late",
      value: summary.late,
      icon: AlertTriangle,
      color: "text-amber-400",
      background: "bg-amber-500/10",
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: UserX,
      color: "text-red-400",
      background: "bg-red-500/10",
    },
    {
      label: "Not Clocked In",
      value: summary.notClockedIn,
      icon: Clock,
      color: "text-purple-400",
      background: "bg-purple-500/10",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-cyan-400">
            Staff Management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Staff Attendance
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitor staff arrival, departure and daily attendance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/school-admin/teacher-attendance/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
          >
            <Settings size={16} />
            Attendance Settings
          </Link>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={19} className="shrink-0" />
          {error}
        </div>
      )}

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays size={17} />
            Selected attendance date
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">
            {formatDate(date)}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            School timezone: {data?.timezone || "Africa/Lagos"}
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <label
            htmlFor="attendance-date"
            className="mb-2 block text-xs font-medium text-slate-400"
          >
            Choose date
          </label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 sm:w-52"
          />
        </div>
      </section>

      {data && !data.isWorkingDay && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          This date is not configured as a working day. Attendance
          records may not be expected.
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  {card.label}
                </span>
                <span className={`rounded-lg p-2 ${card.background} ${card.color}`}>
                  <Icon size={17} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold text-white">
                {loading ? "—" : card.value}
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-white">
              Staff attendance records
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {filteredRecords.length} of {records.length} staff records
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="not_clocked_in">Not clocked in</option>
              <option value="half_day">Half day</option>
              <option value="on_leave">On leave</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={30} className="mx-auto text-slate-600" />
            <p className="mt-3 font-medium text-white">
              No matching staff records
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-4">Staff member</th>
                  <th className="px-3 py-4">Employee ID</th>
                  <th className="px-3 py-4">Designation</th>
                  <th className="px-3 py-4">Clock in</th>
                  <th className="px-3 py-4">Clock out</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Duration</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.teacherId}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold text-white">
                        {record.teacherName || "Unnamed staff"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.email || "No email"}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {record.employeeId || "—"}
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {record.designation || "—"}
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {formatTime(record.clockInAt)}
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {formatTime(record.clockOutAt)}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle(record.status)}`}
                      >
                        {statusLabel(record.status)}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {record.totalMinutes
                        ? `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-xs leading-5 text-slate-400">
        <MapPin size={17} className="mt-0.5 shrink-0 text-cyan-400" />
        GPS verification is performed by the backend when staff clock in
        or clock out. This dashboard displays the recorded attendance;
        it does not independently verify staff location.
      </div>
    </main>
  );
}
