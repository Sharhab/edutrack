"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/axios";
import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { SchoolProfileFormValues } from "../../types/settings";

type SchoolProfileFormProps = {
  values: SchoolProfileFormValues;
  onChange: (
    field: keyof SchoolProfileFormValues,
    value: any
  ) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

type SessionOption = {
  _id: string;
  name: string;
  isCurrent?: boolean;
};

const presetColors = [
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#0f172a",
];

const termOptions = [
  { label: "Select Term", value: "" },
  { label: "1st Term", value: "1st Term" },
  { label: "2nd Term", value: "2nd Term" },
  { label: "3rd Term", value: "3rd Term" },
];

export default function SchoolProfileForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
}: SchoolProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  // Load sessions once when the form mounts.
  useEffect(() => {
    let mounted = true;

    async function loadSessions() {
      try {
        setSessionsLoading(true);
        setSessionsError("");

        const response = await api.get("/sessions");
        const data = response?.data?.data;

        const sessionList: SessionOption[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.sessions)
          ? data.sessions
          : [];

        if (!mounted) return;

        setSessions(sessionList);

        // Preserve the saved session. If none is saved, use the current
        // session, or the first available session as a fallback.
        if (!values.currentSession && sessionList.length > 0) {
          const selectedSession =
            sessionList.find((session) => session.isCurrent) ??
            sessionList[0];

          onChange("currentSession", selectedSession.name);
        }
      } catch (error: any) {
        if (!mounted) return;

        setSessionsError(
          error?.response?.data?.message ||
            "Could not load academic sessions."
        );
      } finally {
        if (mounted) {
          setSessionsLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      mounted = false;
    };

    // This form loads its initial profile before mounting.
    // We intentionally fetch sessions only once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewUrl = useMemo(() => {
    if (values.logoFile) {
      return URL.createObjectURL(values.logoFile);
    }

    return values.logoUrl || "";
  }, [values.logoFile, values.logoUrl]);

  function handleLogoChange(file?: File) {
    if (!file) return;

    onChange("logoFile", file);
  }

  function removeLogo() {
    onChange("logoFile", undefined);
    onChange("logoUrl", "");
  }

  return (
    <div className="space-y-6">
      {/* BASIC DETAILS */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            School Information
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Basic information about your school
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="School Name"
            name="schoolName"
            value={values.schoolName}
            placeholder="Globstand International School"
            onChange={(value) => onChange("schoolName", value)}
          />

          <FormInput
            label="Principal Name"
            name="principalName"
            value={values.principalName}
            placeholder="Mrs Amina Musa"
            onChange={(value) => onChange("principalName", value)}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            placeholder="school@example.com"
            onChange={(value) => onChange("email", value)}
          />

          <FormInput
            label="Phone"
            name="phone"
            value={values.phone}
            placeholder="080..."
            onChange={(value) => onChange("phone", value)}
          />
        </div>

        <div className="mt-4">
          <FormInput
            label="Address"
            name="address"
            value={values.address}
            placeholder="School address"
            onChange={(value) => onChange("address", value)}
          />
        </div>
      </div>

      {/* ACADEMIC DEFAULTS */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Academic Defaults
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Current academic session and term
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* CURRENT SESSION */}
          <div>
            <SelectField
              label="Current Session"
              name="currentSession"
              value={values.currentSession}
              onChange={(value) =>
                onChange("currentSession", value)
              }
              options={[
                {
                  label: sessionsLoading
                    ? "Loading sessions..."
                    : "Select Session",
                  value: "",
                },
                ...sessions.map((session) => ({
                  label: session.name,
                  value: session.name,
                })),
              ]}
            />

            {sessionsError ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-300">
                  {sessionsError}
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setSessionsLoading(true);
                      setSessionsError("");

                      const response = await api.get("/sessions");
                      const data = response?.data?.data;

                      const sessionList: SessionOption[] =
                        Array.isArray(data)
                          ? data
                          : Array.isArray(data?.sessions)
                          ? data.sessions
                          : [];

                      setSessions(sessionList);

                      if (
                        !values.currentSession &&
                        sessionList.length > 0
                      ) {
                        const selectedSession =
                          sessionList.find(
                            (session) => session.isCurrent
                          ) ?? sessionList[0];

                        onChange(
                          "currentSession",
                          selectedSession.name
                        );
                      }
                    } catch (error: any) {
                      setSessionsError(
                        error?.response?.data?.message ||
                          "Could not load academic sessions."
                      );
                    } finally {
                      setSessionsLoading(false);
                    }
                  }}
                  disabled={sessionsLoading}
                  className="text-sm font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
                >
                  {sessionsLoading ? "Loading..." : "Retry loading sessions"}
                </button>
              </div>
            ) : null}

            {!sessionsLoading &&
            !sessionsError &&
            sessions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                No sessions found. Create a session first.
              </p>
            ) : null}
          </div>

          {/* CURRENT TERM */}
          <SelectField
            label="Current Term"
            name="currentTerm"
            value={values.currentTerm}
            onChange={(value) =>
              onChange("currentTerm", value)
            }
            options={termOptions}
          />
        </div>
      </div>

      {/* BRANDING */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Branding
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Customize your school appearance
          </p>
        </div>

        {/* SCHOOL LOGO */}
        <div className="mb-6">
          <label className="mb-3 block text-sm text-slate-300">
            School Logo
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 transition hover:border-cyan-400/40 hover:bg-cyan-500/5"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="School logo"
                className="mb-4 h-28 w-28 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-white/5 text-4xl">
                🏫
              </div>
            )}

            <p className="text-sm font-medium text-white">
              Click to upload logo
            </p>

            <p className="mt-1 text-xs text-slate-400">
              PNG, JPG or WEBP
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  handleLogoChange(file);
                }

                // Allow choosing the same file again.
                event.currentTarget.value = "";
              }}
            />
          </div>

          {previewUrl ? (
            <button
              type="button"
              onClick={removeLogo}
              className="mt-3 text-sm text-red-300 transition hover:text-red-200"
            >
              Remove Logo
            </button>
          ) : null}
        </div>

        {/* THEME COLORS */}
        <div>
          <label className="mb-3 block text-sm text-slate-300">
            Theme Color
          </label>

          <div className="flex flex-wrap gap-3">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use theme color ${color}`}
                aria-pressed={values.themeColor === color}
                onClick={() => onChange("themeColor", color)}
                className={`h-10 w-10 rounded-2xl border-2 transition ${
                  values.themeColor === color
                    ? "scale-110 border-white"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}

            {/* CUSTOM COLOR */}
            <label className="relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <input
                type="color"
                aria-label="Choose custom theme color"
                value={values.themeColor}
                onChange={(event) =>
                  onChange("themeColor", event.target.value)
                }
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              <span className="text-xs text-white">+</span>
            </label>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-2xl bg-cyan-500 px-6 py-3 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving Changes..." : "Save Profile"}
        </button>

        <p className="text-sm text-slate-400">
          Changes update your school branding instantly.
        </p>
      </div>
    </div>
  );
}
