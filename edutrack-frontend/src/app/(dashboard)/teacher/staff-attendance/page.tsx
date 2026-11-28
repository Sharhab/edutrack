
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Loader2,
} from "lucide-react";

import api from "../../../../lib/axios";

type AttendanceRecord = {
  _id: string;
  date: string;
  status: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  lateMinutes?: number;
  totalMinutes?: number;
};

type LocationData = {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
};

function formatTime(value?: string | null) {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "The request could not be completed."
    );
  }

  return "Something went wrong. Please try again.";
}

export default function StaffAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todayRecord = records.find((record) => record.date === today);
  const hasClockedIn = Boolean(todayRecord?.clockInAt);
  const hasClockedOut = Boolean(todayRecord?.clockOutAt);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/teacher-attendance/my-attendance",
        {
          params: {
            limit: 30,
          },
        }
      );

      const data = response.data?.data;

      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  function getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Your browser does not support GPS."));
        return;
      }

      setGpsStatus("Getting your GPS location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMetres: position.coords.accuracy,
          });
        },
        (gpsError) => {
          const messages: Record<number, string> = {
            1: "Location permission denied. Allow GPS access in your browser.",
            2: "Your location could not be determined. Try again outdoors.",
            3: "GPS request timed out. Please try again.",
          };

          reject(
            new Error(
              messages[gpsError.code] || "Unable to get GPS location."
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }

  async function submitAttendance(action: "clock-in" | "clock-out") {
    setError("");
    setMessage("");

    try {
      setSubmitting(true);

      const location = await getCurrentLocation();

      const response = await api.post(
        `/teacher-attendance/${action}`,
        { location }
      );

      setMessage(
        response.data?.message ||
          (action === "clock-in"
            ? "Clock-in recorded successfully."
            : "Clock-out recorded successfully.")
      );

      setGpsStatus("GPS location submitted successfully.");

      await loadAttendance();
    } catch (err) {
      setError(
        err instanceof Error && !axios.isAxiosError(err)
          ? err.message
          : getErrorMessage(err)
      );
      setGpsStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-emerald-500/10 text-emerald-400";
      case "late":
        return "bg-amber-500/10 text-amber-400";
      case "absent":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-cyan-400">
            Staff Management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            My Staff Attendance
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Record your arrival and departure using your current GPS location.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAttendance()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={19} className="shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={19} className="shrink-0" />
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-3 text-cyan-400">
            <CalendarDays size={22} />
          </div>
          <div>
            <h2 className="font-bold text-white">Today's attendance</h2>
            <p className="text-sm text-slate-400">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Africa/Lagos",
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">Clock-in</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatTime(todayRecord?.clockInAt)}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">Clock-out</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatTime(todayRecord?.clockOutAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {todayRecord ? (
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusColor(todayRecord.status)}`}>
              {todayRecord.status.replaceAll("_", " ")}
            </span>
          ) : (
            <span className="rounded-full bg-slate-500/10 px-3 py-1.5 text-xs text-slate-400">
              Not clocked in
            </span>
          )}

          {typeof todayRecord?.lateMinutes === "number" &&
            todayRecord.lateMinutes > 0 && (
              <span className="text-xs text-amber-400">
                {todayRecord.lateMinutes} minutes late
              </span>
            )}
        </div>

        {gpsStatus && (
          <p className="mt-4 flex items-center gap-2 text-xs text-cyan-300">
            <MapPin size={14} />
            {gpsStatus}
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void submitAttendance("clock-in")}
            disabled={submitting || loading || hasClockedIn}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <LogIn size={19} />
            )}
            {hasClockedIn ? "Already clocked in" : "Clock In"}
          </button>

          <button
            type="button"
            onClick={() => void submitAttendance("clock-out")}
            disabled={submitting || loading || !hasClockedIn || hasClockedOut}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-4 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <LogOut size={19} />
            )}
            {hasClockedOut ? "Already clocked out" : "Clock Out"}
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          GPS permission is required. Your location must be within the
          school's configured attendance radius. Use your school-approved
          device and enable location services.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <Clock className="text-cyan-400" size={21} />
          <h2 className="text-lg font-bold text-white">
            Recent attendance history
          </h2>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">
            Loading attendance history...
          </div>
        ) : records.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No attendance records found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record._id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-white">
                    {formatDate(record.date)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    In: {formatTime(record.clockInAt)} · Out:{" "}
                    {formatTime(record.clockOutAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusColor(record.status)}`}>
                    {record.status.replaceAll("_", " ")}
                  </span>
                  {record.totalMinutes ? (
                    <span className="text-xs text-slate-400">
                      {Math.floor(record.totalMinutes / 60)}h{" "}
                      {record.totalMinutes % 60}m
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
