
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/axios";
import { getTerms, type AcademicTerm } from "../../lib/terms";
import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import type { SchoolProfileFormValues } from "../../types/settings";

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
  startDate?: string | null;
  endDate?: string | null;
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

export default function SchoolProfileForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
}: SchoolProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
 const signatureInputRef = useRef<HTMLInputElement | null>(null);
const stampInputRef = useRef<HTMLInputElement | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
const [stampPreview, setStampPreview] = useState("");
  // Load academic sessions.
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

      setSessions(sessionList);

      // Use the saved session if available. Otherwise use the current one.
      if (
        !values.currentSession &&
        sessionList.length > 0
      ) {
        const selectedSession =
          sessionList.find((session) => session.isCurrent) ??
          sessionList[0];

        onChange("currentSession", selectedSession.name);
      }
    } catch (error: any) {
      setSessionsError(
        error?.response?.data?.message ||
          "Could not load academic sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();

    // Load sessions when the form mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load terms for the selected session only.
  useEffect(() => {
    let cancelled = false;

    async function loadTerms() {
      const selectedSession = sessions.find(
        (session) => session.name === values.currentSession
      );

      if (!selectedSession) {
        setTerms([]);
        setTermsError("");
        setTermsLoading(false);

        if (values.currentTerm) {
          onChange("currentTerm", "");
        }

        return;
      }

      try {
        setTermsLoading(true);
        setTermsError("");

        const result = await getTerms(selectedSession._id);

        if (cancelled) return;

        setTerms(result);

        // Keep the saved term if it exists in this session.
        const savedTermExists = result.some(
          (term) => term.name === values.currentTerm
        );

        if (!savedTermExists) {
          const currentTerm = result.find((term) => term.isCurrent);

          onChange("currentTerm", currentTerm?.name || "");
        }
      } catch (error: any) {
        if (cancelled) return;

        setTerms([]);
        setTermsError(
          error?.response?.data?.message ||
            "Could not load terms for this session."
        );
      } finally {
        if (!cancelled) {
          setTermsLoading(false);
        }
      }
    }

    void loadTerms();

    return () => {
      cancelled = true;
    };
  }, [sessions, values.currentSession]);

  // Create and clean up a local logo preview URL.
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

  useEffect(() => {
  if (!values.principalSignatureFile) {
    setSignaturePreview(values.principalSignature || "");
    return;
  }

  const url = URL.createObjectURL(values.principalSignatureFile);
  setSignaturePreview(url);

  return () => URL.revokeObjectURL(url);
}, [values.principalSignatureFile, values.principalSignature]);

useEffect(() => {
  if (!values.schoolStampFile) {
    setStampPreview(values.schoolStamp || "");
    return;
  }

  const url = URL.createObjectURL(values.schoolStampFile);
  setStampPreview(url);

  return () => URL.revokeObjectURL(url);
}, [values.schoolStampFile, values.schoolStamp]);

  function handleLogoChange(file?: File) {
    if (!file) return;

    onChange("logoFile", file);
  }

  function removeLogo() {
    onChange("logoFile", undefined);
    onChange("logoUrl", "");
  }

  function handleSessionChange(sessionName: string) {
    onChange("currentSession", sessionName);

    // Clear the previous session's term while the new terms load.
    onChange("currentTerm", "");
  }

  const sessionOptions = useMemo(
    () => [
      {
        label: sessionsLoading ? "Loading sessions..." : "Select Session",
        value: "",
      },
      ...sessions.map((session) => ({
        label: session.name,
        value: session.name,
      })),
    ],
    [sessions, sessionsLoading]
  );

  const termOptions = useMemo(
    () => [
      {
        label: termsLoading ? "Loading terms..." : "Select Term",
        value: "",
      },
      ...terms.map((term) => ({
        label: term.name,
        value: term.name,
      })),
    ],
    [terms, termsLoading]
  );

  return (
    <div className="space-y-6">
      {/* SCHOOL INFORMATION */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
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
            placeholder="Principal name"
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
        <div className="mt-4">
  <FormInput
    label="School Motto"
    name="motto"
    value={values.motto || ""}
    placeholder="Enter your school's motto"
    onChange={(value) => onChange("motto", value)}
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
            Select the academic session and its current term.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* CURRENT SESSION */}
          <div>
            <SelectField
              label="Current Session"
              name="currentSession"
              value={values.currentSession}
              onChange={handleSessionChange}
              options={sessionOptions}
            />

            {sessionsError ? (
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
                  {sessionsLoading ? "Loading..." : "Retry loading sessions"}
                </button>
              </div>
            ) : null}

            {!sessionsLoading &&
            !sessionsError &&
            sessions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                No sessions found. Create an academic session first.
              </p>
            ) : null}
          </div>

          {/* CURRENT TERM */}
          <div>
            <SelectField
              label="Current Term"
              name="currentTerm"
              value={values.currentTerm}
              onChange={(value) => onChange("currentTerm", value)}
              options={termOptions}
            />

            {termsError ? (
              <p className="mt-2 text-sm text-red-300">
                {termsError}
              </p>
            ) : null}

            {!values.currentSession ? (
              <p className="mt-2 text-sm text-slate-400">
                Select a session to load its terms.
              </p>
            ) : null}

            {!termsLoading &&
            !termsError &&
            values.currentSession &&
            terms.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                No terms found for this session. Create terms for this
                session first.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* BRANDING */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
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
              const file = event.target.files?.[0];

              if (file) {
                handleLogoChange(file);
              }

              // Allow selecting the same file again.
              event.currentTarget.value = "";
            }}
          />

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

        
{/* PRINCIPAL SIGNATURE */}
<div className="mb-6">
  <label className="mb-3 block text-sm text-slate-300">
    Principal's Signature
  </label>

  <div className="flex flex-wrap items-center gap-4">
    {signaturePreview ? (
      <img
        src={signaturePreview}
        alt="Principal signature preview"
        className="h-20 w-40 rounded-xl border border-white/10 bg-white p-2 object-contain"
      />
    ) : (
      <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-slate-500">
        No signature
      </div>
    )}

    <button
      type="button"
      onClick={() => signatureInputRef.current?.click()}
      className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
    >
      Upload Signature
    </button>
  </div>

  <input
    ref={signatureInputRef}
    type="file"
    accept="image/png,image/jpeg,image/webp"
    hidden
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) onChange("principalSignatureFile", file);
      event.currentTarget.value = "";
    }}
  />

  <p className="mt-2 text-xs text-slate-400">
    Upload a clear image of the principal's signature.
  </p>
</div>

{/* SCHOOL STAMP */}
<div className="mb-6">
  <label className="mb-3 block text-sm text-slate-300">
    Official School Stamp
  </label>

  <div className="flex flex-wrap items-center gap-4">
    {stampPreview ? (
      <img
        src={stampPreview}
        alt="School stamp preview"
        className="h-24 w-24 rounded-xl border border-white/10 bg-white p-2 object-contain"
      />
    ) : (
      <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-white/20 text-center text-xs text-slate-500">
        No stamp
      </div>
    )}

    <button
      type="button"
      onClick={() => stampInputRef.current?.click()}
      className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
    >
      Upload Stamp
    </button>
  </div>

  <input
    ref={stampInputRef}
    type="file"
    accept="image/png,image/jpeg,image/webp"
    hidden
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) onChange("schoolStampFile", file);
      event.currentTarget.value = "";
    }}
  />

  <p className="mt-2 text-xs text-slate-400">
    Upload your school's official stamp image.
  </p>
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
          Save your school information and academic defaults.
        </p>
      </div>
    </div>
  );
}
