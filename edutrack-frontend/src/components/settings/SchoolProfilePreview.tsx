"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
};

type TermOption = {
  _id: string;
  name: string;
  sessionId:
    | string
    | {
        _id: string;
        name?: string;
      };
  startDate?: string | null;
  endDate?: string | null;
  order?: number;
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

function extractArray<T>(response: any): T[] {
  const data = response?.data?.data ?? response?.data;

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (Array.isArray(data?.sessions)) {
    return data.sessions as T[];
  }

  if (Array.isArray(data?.terms)) {
    return data.terms as T[];
  }

  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
}

export default function SchoolProfileForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
}: SchoolProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [termsLoading, setTermsLoading] = useState(false);

  const [sessionsError, setSessionsError] = useState("");
  const [termsError, setTermsError] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");

  /*
   * Load terms belonging to a particular session.
   *
   * The backend endpoint should support:
   * GET /terms?sessionId=<session ID>
   */
  const loadTermsForSession = useCallback(
    async (sessionId: string, savedTerm = "") => {
      if (!sessionId) {
        setTerms([]);
        setTermsError("");
        return;
      }

      try {
        setTermsLoading(true);
        setTermsError("");

        const response = await api.get("/terms", {
          params: { sessionId },
        });

        const termList = extractArray<TermOption>(response);

        setTerms(termList);

        // Keep the saved term if it belongs to this session.
        const matchingTerm = termList.find(
          (term) => term.name === savedTerm
        );

        if (savedTerm && !matchingTerm) {
          onChange("currentTerm", "");
        }
      } catch (error: any) {
        setTerms([]);
        setTermsError(
          error?.response?.data?.message ||
            "Could not load terms for this session."
        );
      } finally {
        setTermsLoading(false);
      }
    },
    [onChange]
  );

  /*
   * Load sessions when the form mounts.
   * Preserve the saved session whenever it still exists.
   */
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError("");

      const response = await api.get("/sessions");
      const sessionList = extractArray<SessionOption>(response);

      setSessions(sessionList);

      const selectedSession =
        sessionList.find(
          (session) => session.name === values.currentSession
        ) ??
        sessionList.find((session) => session.isCurrent) ??
        sessionList[0];

      if (!selectedSession) {
        setTerms([]);
        setTermsError("");
        return;
      }

      if (!values.currentSession) {
        onChange("currentSession", selectedSession.name);
      }

      await loadTermsForSession(
        selectedSession._id,
        values.currentTerm
      );
    } catch (error: any) {
      setSessionsError(
        error?.response?.data?.message ||
          "Could not load academic sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [
    loadTermsForSession,
    onChange,
    values.currentSession,
    values.currentTerm,
  ]);

  useEffect(() => {
    void loadSessions();

    // Load the initial session list once when the form mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Update the logo preview and release temporary object URLs
   * when the selected file changes or the component unmounts.
   */
  useEffect(() => {
    if (!values.logoFile) {
      setPreviewUrl(values.logoUrl || "");
      return;
    }

    const objectUrl = URL.createObjectURL(values.logoFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [values.logoFile, values.logoUrl]);

  async function handleSessionChange(sessionName: string) {
    onChange("currentSession", sessionName);
    onChange("currentTerm", "");

    const selectedSession = sessions.find(
      (session) => session.name === sessionName
    );

    if (!selectedSession) {
      setTerms([]);
      setTermsError("");
      return;
    }

    await loadTermsForSession(selectedSession._id);
  }

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
      {/* SCHOOL INFORMATION */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            School Information
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Basic information about your school.
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
      </section>

      {/* ACADEMIC DEFAULTS */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Academic Defaults
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Choose the session and term for your school.
            Terms are loaded from the selected session.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* CURRENT SESSION */}
          <div>
            <SelectField
              label="Current Session"
              name="currentSession"
              value={values.currentSession}
              onChange={(value) => {
                void handleSessionChange(value);
              }}
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

            {sessionsError && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-300">
                  {sessionsError}
                </p>

                <button
                  type="button"
                  onClick={() => void loadSessions()}
                  disabled={sessionsLoading}
                  className="text-sm font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
                >
                  {sessionsLoading
                    ? "Loading..."
                    : "Retry loading sessions"}
                </button>
              </div>
            )}

            {!sessionsLoading &&
              !sessionsError &&
              sessions.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No sessions found. Create a session from Academic Periods.
                </p>
              )}

            {(() => {
              const selected = sessions.find(
                (session) => session.name === values.currentSession
              );

              if (!selected || (!selected.startDate && !selected.endDate)) {
                return null;
              }

              return (
                <p className="mt-2 text-xs text-slate-400">
                  {formatDate(selected.startDate) || "Start date not set"}
                  {" – "}
                  {formatDate(selected.endDate) || "End date not set"}
                </p>
              );
            })()}
          </div>

          {/* CURRENT TERM */}
          <div>
            <SelectField
              label="Current Term"
              name="currentTerm"
              value={values.currentTerm}
              onChange={(value) => onChange("currentTerm", value)}
              options={[
                {
                  label: termsLoading
                    ? "Loading terms..."
                    : !values.currentSession
                    ? "Select a session first"
                    : "Select Term",
                  value: "",
                },
                ...terms.map((term) => ({
                  label: term.name,
                  value: term.name,
                })),
              ]}
            />

            {termsError && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-300">
                  {termsError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const session = sessions.find(
                      (item) => item.name === values.currentSession
                    );

                    if (session) {
                      void loadTermsForSession(
                        session._id,
                        values.currentTerm
                      );
                    }
                  }}
                  disabled={termsLoading}
                  className="text-sm font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
                >
                  {termsLoading ? "Loading..." : "Retry loading terms"}
                </button>
              </div>
            )}

            {!termsLoading &&
              !termsError &&
              values.currentSession &&
              terms.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No terms found for this session. Create terms from Academic Periods.
                </p>
              )}

            {(() => {
              const selected = terms.find(
                (term) => term.name === values.currentTerm
              );

              if (!selected || (!selected.startDate && !selected.endDate)) {
                return null;
              }

              return (
                <p className="mt-2 text-xs text-slate-400">
                  {formatDate(selected.startDate) || "Start date not set"}
                  {" – "}
                  {formatDate(selected.endDate) || "End date not set"}
                </p>
              );
            })()}
          </div>
        </div>
      </section>

      {/* BRANDING */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Branding
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Customize your school's appearance.
          </p>
        </div>

        {/* SCHOOL LOGO */}
        <div className="mb-6">
          <label className="mb-3 block text-sm text-slate-300">
            School Logo
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 transition hover:border-cyan-400/40 hover:bg-cyan-500/5"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="School logo preview"
                className="mb-4 h-28 w-28 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-white/5 text-4xl">
                🏫
              </div>
            )}

            <span className="text-sm font-medium text-white">
              Click to upload logo
            </span>

            <span className="mt-1 text-xs text-slate-400">
              PNG, JPG or WEBP
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file) {
                handleLogoChange(file);
              }

              // Allow selecting the same file again.
              event.currentTarget.value = "";
            }}
          />

          {previewUrl && (
            <button
              type="button"
              onClick={removeLogo}
              className="mt-3 text-sm text-red-300 transition hover:text-red-200"
            >
              Remove Logo
            </button>
          )}
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

            <label className="relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <input
                type="color"
                aria-label="Choose custom theme color"
                value={values.themeColor || "#06b6d4"}
                onChange={(event) =>
                  onChange("themeColor", event.target.value)
                }
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              <span className="text-xs text-white">+</span>
            </label>
          </div>
        </div>
      </section>

      {/* SAVE */}
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
          Save your school information and selected academic defaults.
        </p>
      </div>
    </div>
  );
}

