
"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import {
  MapPin,
  LocateFixed,
  Save,
  RefreshCw,
  Clock,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../../../../../lib/axios";

const AttendanceLocationMap = dynamic(
  () =>
    import(
      "../../../../../components/teacher-attendance/AttendanceLocationMap"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
        Loading school location map...
      </div>
    ),
  }
);

const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

type AttendanceSettings = {
  location: {
    latitude: number | null;
    longitude: number | null;
    label: string;
  };
  geofenceRadiusMetres: number;
  reportingTime: string;
  closingTime: string;
  lateGraceMinutes: number;
  clockInEnabled: boolean;
  clockOutRequired: boolean;
  timezone: string;
  workingDays: string[];
  configured?: boolean;
};

const DEFAULT_SETTINGS: AttendanceSettings = {
  location: {
    latitude: null,
    longitude: null,
    label: "",
  },
  geofenceRadiusMetres: 100,
  reportingTime: "08:00",
  closingTime: "15:00",
  lateGraceMinutes: 15,
  clockInEnabled: true,
  clockOutRequired: true,
  timezone: "Africa/Lagos",
  workingDays: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ],
};

export default function TeacherAttendanceSettingsPage() {
  const [settings, setSettings] =
    useState<AttendanceSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/settings/teacher-attendance"
      );

      const data = response.data?.data;

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
        location: {
          ...DEFAULT_SETTINGS.location,
          ...(data?.location || {}),
        },
        workingDays:
          data?.workingDays || DEFAULT_SETTINGS.workingDays,
      });
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Unable to load attendance settings."
          : "Unable to load attendance settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateSetting<K extends keyof AttendanceSettings>(
    field: K,
    value: AttendanceSettings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateLocation(
    field: keyof AttendanceSettings["location"],
    value: string | number | null
  ) {
    setSettings((previous) => ({
      ...previous,
      location: {
        ...previous.location,
        [field]: value,
      },
    }));
  }

  function toggleWorkingDay(day: string) {
    setSettings((previous) => {
      const exists = previous.workingDays.includes(day);

      return {
        ...previous,
        workingDays: exists
          ? previous.workingDays.filter(
              (item) => item !== day
            )
          : [...previous.workingDays, day],
      };
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS location.");
      return;
    }

    setLocating(true);
    setError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(
          "latitude",
          Number(position.coords.latitude.toFixed(7))
        );

        updateLocation(
          "longitude",
          Number(position.coords.longitude.toFixed(7))
        );

        setLocating(false);
        setMessage(
          "Current GPS coordinates captured. Confirm they are your school's location."
        );
      },
      (gpsError) => {
        const descriptions: Record<number, string> = {
          1: "Location permission was denied. Allow location access in your browser.",
          2: "Your current location could not be determined.",
          3: "GPS request timed out. Please try again.",
        };

        setError(
          descriptions[gpsError.code] ||
            "Unable to get your current location."
        );

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleSave() {
    setError("");
    setMessage("");

    const { latitude, longitude } = settings.location;

    if (latitude === null || longitude === null) {
      setError(
        "Select your school location on the map or enter both GPS coordinates."
      );
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Enter valid latitude and longitude coordinates.");
      return;
    }

    if (settings.workingDays.length === 0) {
      setError("Select at least one working day.");
      return;
    }

    if (settings.closingTime <= settings.reportingTime) {
      setError(
        "Closing time must be later than reporting time."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        location: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          label: settings.location.label.trim(),
        },
        geofenceRadiusMetres: Number(
          settings.geofenceRadiusMetres
        ),
        reportingTime: settings.reportingTime,
        closingTime: settings.closingTime,
        lateGraceMinutes: Number(
          settings.lateGraceMinutes
        ),
        clockInEnabled: settings.clockInEnabled,
        clockOutRequired: settings.clockOutRequired,
        timezone: settings.timezone.trim(),
        workingDays: settings.workingDays,
      };

      const response = await api.put(
        "/settings/teacher-attendance",
        payload
      );

      const saved = response.data?.data;

      setSettings((previous) => ({
        ...previous,
        ...saved,
        location: {
          ...previous.location,
          ...(saved?.location || {}),
        },
      }));

      setMessage(
        response.data?.message ||
          "Staff attendance settings saved successfully."
      );
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Failed to save attendance settings."
          : "Failed to save attendance settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-slate-400">
        Loading staff attendance settings...
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck size={19} />
            <span className="text-sm font-semibold">
              Staff Management
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Staff Attendance Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Configure your school's GPS attendance location,
            working hours, late arrival rules and attendance days.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          {message}
        </div>
      )}

      {/* SCHOOL LOCATION */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-3 text-cyan-400">
            <MapPin size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              School GPS Location
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose the official school location. Staff will
              need to be within the permitted radius to clock in.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              School location name
            </label>

            <input
              value={settings.location.label}
              onChange={(event) =>
                updateLocation("label", event.target.value)
              }
              placeholder="e.g. Main School Campus"
              maxLength={250}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <LocateFixed size={18} />
              {locating
                ? "Getting GPS location..."
                : "Use my current GPS location"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Latitude
            </label>

            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={settings.location.latitude ?? ""}
              onChange={(event) =>
                updateLocation(
                  "latitude",
                  event.target.value === ""
                    ? null
                    : Number(event.target.value)
                )
              }
              placeholder="e.g. 9.0820"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Longitude
            </label>

            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={settings.location.longitude ?? ""}
              onChange={(event) =>
                updateLocation(
                  "longitude",
                  event.target.value === ""
                    ? null
                    : Number(event.target.value)
                )
              }
              placeholder="e.g. 8.6753"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white">
                Select location on map
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Click anywhere on the map or drag the marker to
                position your school.
              </p>
            </div>

            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Interactive map
            </span>
          </div>

          <AttendanceLocationMap
            latitude={settings.location.latitude}
            longitude={settings.location.longitude}
            radius={settings.geofenceRadiusMetres}
            onLocationChange={(latitude, longitude) => {
              updateLocation("latitude", latitude);
              updateLocation("longitude", longitude);
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Permitted attendance distance
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="range"
              min="25"
              max="1000"
              step="25"
              value={settings.geofenceRadiusMetres}
              onChange={(event) =>
                updateSetting(
                  "geofenceRadiusMetres",
                  Number(event.target.value)
                )
              }
              className="w-full accent-cyan-500"
            />

            <div className="min-w-28 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-center">
              <span className="text-lg font-bold text-cyan-300">
                {settings.geofenceRadiusMetres}
              </span>
              <span className="ml-1 text-xs text-slate-400">
                metres
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Staff must be within this distance from the registered
            school location to clock in.
          </p>
        </div>
      </section>

      {/* WORKING HOURS */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
            <Clock size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Working Hours
            </h2>
            <p className="text-sm text-slate-400">
              Define the school attendance schedule.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Reporting time
            </label>
            <input
              type="time"
              value={settings.reportingTime}
              onChange={(event) =>
                updateSetting("reportingTime", event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Closing time
            </label>
            <input
              type="time"
              value={settings.closingTime}
              onChange={(event) =>
                updateSetting("closingTime", event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Late grace period (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={settings.lateGraceMinutes}
              onChange={(event) =>
                updateSetting(
                  "lateGraceMinutes",
                  Number(event.target.value)
                )
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <CalendarDays size={17} />
            School working days
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WEEKDAYS.map((day) => {
              const checked =
                settings.workingDays.includes(day.value);

              return (
                <label
                  key={day.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${
                    checked
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                      : "border-white/10 bg-slate-950 text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleWorkingDay(day.value)
                    }
                    className="accent-cyan-500"
                  />
                  {day.label}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            School timezone
          </label>
          <input
            value={settings.timezone}
            onChange={(event) =>
              updateSetting("timezone", event.target.value)
            }
            placeholder="Africa/Lagos"
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white sm:max-w-md"
          />
          <p className="mt-2 text-xs text-slate-500">
            Nigeria schools should normally use Africa/Lagos.
          </p>
        </div>
      </section>

      {/* ATTENDANCE CONTROLS */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-white">
            Attendance Controls
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Enable or disable staff attendance requirements.
          </p>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950 p-4">
          <div>
            <p className="font-semibold text-white">
              Enable staff clock-in
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Allow teachers and staff to record attendance.
            </p>
          </div>

          <input
            type="checkbox"
            checked={settings.clockInEnabled}
            onChange={(event) =>
              updateSetting("clockInEnabled", event.target.checked)
            }
            className="h-5 w-5 accent-cyan-500"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950 p-4">
          <div>
            <p className="font-semibold text-white">
              Require clock-out
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Require staff to record when they leave school.
            </p>
          </div>

          <input
            type="checkbox"
            checked={settings.clockOutRequired}
            onChange={(event) =>
              updateSetting(
                "clockOutRequired",
                event.target.checked
              )
            }
            className="h-5 w-5 accent-cyan-500"
          />
        </label>
      </section>

      {/* SAVE */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-white">
            Save attendance configuration
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Changes apply to your school's staff attendance system.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </main>
  );
}
