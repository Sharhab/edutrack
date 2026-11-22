


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/axios";
import { getTerms, type AcademicTerm } from "../../lib/terms";
import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import type {
  SchoolProfileFormValues,
  SchoolBrandColors,
} from "../../types/settings";

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

type BrandColorKey = keyof SchoolBrandColors;

const DEFAULT_BRAND: SchoolBrandColors = {
  primary: "#06b6d4",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#172033",
};

const BRAND_PRESETS: {
  name: string;
  description: string;
  colors: SchoolBrandColors;
}[] = [
  {
    name: "Al-Azhar Gold",
    description: "Gold, black and warm cream",
    colors: {
      primary: "#B88A24",
      secondary: "#171717",
      accent: "#D9B85B",
      background: "#F8F4E9",
      surface: "#FFFFFF",
      text: "#242018",
    },
  },
  {
    name: "Ocean Blue",
    description: "Professional blue",
    colors: {
      primary: "#2563EB",
      secondary: "#172554",
      accent: "#38BDF8",
      background: "#F1F5F9",
      surface: "#FFFFFF",
      text: "#172033",
    },
  },
  {
    name: "Forest Green",
    description: "Natural green",
    colors: {
      primary: "#15803D",
      secondary: "#14532D",
      accent: "#84CC16",
      background: "#F0FDF4",
      surface: "#FFFFFF",
      text: "#14251A",
    },
  },
  {
    name: "Royal Purple",
    description: "Elegant purple",
    colors: {
      primary: "#7C3AED",
      secondary: "#312E81",
      accent: "#C4B5FD",
      background: "#F5F3FF",
      surface: "#FFFFFF",
      text: "#241B3B",
    },
  },
  {
    name: "Sunset Orange",
    description: "Warm orange",
    colors: {
      primary: "#EA580C",
      secondary: "#7C2D12",
      accent: "#FBBF24",
      background: "#FFF7ED",
      surface: "#FFFFFF",
      text: "#292018",
    },
  },
  {
    name: "Modern Slate",
    description: "Minimal charcoal",
    colors: {
      primary: "#334155",
      secondary: "#0F172A",
      accent: "#06B6D4",
      background: "#F1F5F9",
      surface: "#FFFFFF",
      text: "#111827",
    },
  },
];

const COLOR_FIELDS: {
  key: BrandColorKey;
  label: string;
  description: string;
}[] = [
  {
    key: "primary",
    label: "Primary color",
    description: "Buttons, links and active navigation",
  },
  {
    key: "secondary",
    label: "Secondary color",
    description: "Sidebar, headers and supporting sections",
  },
  {
    key: "accent",
    label: "Accent color",
    description: "Badges, highlights and indicators",
  },
  {
    key: "background",
    label: "Page background",
    description: "Main application background",
  },
  {
    key: "surface",
    label: "Card and panel color",
    description: "Cards, forms and content panels",
  },
  {
    key: "text",
    label: "Text color",
    description: "Main text on light surfaces",
  },
];

function getInitialBrand(
  values: SchoolProfileFormValues
): SchoolBrandColors {
  return {
    ...DEFAULT_BRAND,
    ...(values.brandColors || {}),
    primary:
      values.brandColors?.primary ||
      values.themeColor ||
      DEFAULT_BRAND.primary,
  };
}

function isValidHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

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

  const brandColors = useMemo(
    () => getInitialBrand(values),
    [values.brandColors, values.themeColor]
  );

  const [hexDrafts, setHexDrafts] = useState<
    Record<BrandColorKey, string>
  >(() => getInitialBrand(values));

  useEffect(() => {
    setHexDrafts(brandColors);
  }, [brandColors]);

  function updateBrandColor(
    key: BrandColorKey,
    color: string
  ) {
    const nextColors = {
      ...brandColors,
      [key]: color,
    };

    onChange("brandColors", nextColors);

    if (key === "primary") {
      onChange("themeColor", color);
    }

    setHexDrafts((previous) => ({
      ...previous,
      [key]: color,
    }));
  }

  function applyPreset(preset: SchoolBrandColors) {
    onChange("brandColors", { ...preset });
    onChange("themeColor", preset.primary);
    setHexDrafts({ ...preset });
  }

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

      if (!values.currentSession && sessionList.length > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (!values.logoFile) {
      setPreviewUrl(values.logoUrl || "");
      return;
    }

    const objectUrl = URL.createObjectURL(values.logoFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [values.logoFile, values.logoUrl]);

  useEffect(() => {
    if (!values.principalSignatureFile) {
      setSignaturePreview(values.principalSignature || "");
      return;
    }

    const url = URL.createObjectURL(
      values.principalSignatureFile
    );

    setSignaturePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [
    values.principalSignatureFile,
    values.principalSignature,
  ]);

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
    if (file) onChange("logoFile", file);
  }

  function removeLogo() {
    onChange("logoFile", undefined);
    onChange("logoUrl", "");
  }

  function handleSessionChange(sessionName: string) {
    onChange("currentSession", sessionName);
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
    <div className="mx-auto w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      {/* SCHOOL INFORMATION */}
      <section className="w-full min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            School Information
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Basic information about your school.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            label="School Name"
            name="schoolName"
            value={values.schoolName}
            placeholder="School name"
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

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
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
      </section>

      {/* ACADEMIC DEFAULTS */}
      <section className="w-full min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Academic Defaults
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Select the academic session and its current term.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <SelectField
              label="Current Session"
              name="currentSession"
              value={values.currentSession}
              onChange={handleSessionChange}
              options={sessionOptions}
            />

            {sessionsError && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-300">{sessionsError}</p>
                <button
                  type="button"
                  onClick={() => void loadSessions()}
                  disabled={sessionsLoading}
                  className="text-sm font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
                >
                  {sessionsLoading ? "Loading..." : "Retry loading sessions"}
                </button>
              </div>
            )}

            {!sessionsLoading &&
              !sessionsError &&
              sessions.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No sessions found. Create an academic session first.
                </p>
              )}
          </div>

          <div className="min-w-0">
            <SelectField
              label="Current Term"
              name="currentTerm"
              value={values.currentTerm}
              onChange={(value) => onChange("currentTerm", value)}
              options={termOptions}
            />

            {termsError && (
              <p className="mt-2 text-sm text-red-300">{termsError}</p>
            )}

            {!values.currentSession && (
              <p className="mt-2 text-sm text-slate-400">
                Select a session to load its terms.
              </p>
            )}

            {!termsLoading &&
              !termsError &&
              values.currentSession &&
              terms.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No terms found for this session. Create terms for this
                  session first.
                </p>
              )}
          </div>
        </div>
      </section>

      {/* SCHOOL BRANDING */}
      <section className="w-full min-w-0 space-y-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-semibold text-white">
            School Branding
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Add your school's identity and customize the colors used
            throughout its EduTrack portal.
          </p>
        </div>

        {/* LOGO */}
        <div className="min-w-0">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            School logo
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-5 transition hover:border-cyan-400/50 hover:bg-cyan-500/5"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="School logo preview"
                className="mb-3 h-28 w-28 rounded-2xl bg-white object-contain p-2 shadow-lg"
              />
            ) : (
              <div className="mb-3 flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 text-4xl">
                🏫
              </div>
            )}

            <span className="text-sm font-semibold text-white">
              {previewUrl ? "Change school logo" : "Upload school logo"}
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
              if (file) handleLogoChange(file);
              event.currentTarget.value = "";
            }}
          />

          {previewUrl && (
            <button
              type="button"
              onClick={removeLogo}
              className="mt-3 text-sm text-red-300 hover:text-red-200"
            >
              Remove logo
            </button>
          )}
        </div>

        {/* SIGNATURE */}
        <div className="min-w-0 border-t border-white/10 pt-5">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Principal's signature
          </label>

          <div className="flex min-w-0 flex-wrap items-center gap-4">
            {signaturePreview ? (
              <img
                src={signaturePreview}
                alt="Principal signature"
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
              className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white hover:bg-white/5"
            >
              Upload signature
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
        </div>

        {/* STAMP */}
        <div className="min-w-0 border-t border-white/10 pt-5">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Official school stamp
          </label>

          <div className="flex min-w-0 flex-wrap items-center gap-4">
            {stampPreview ? (
              <img
                src={stampPreview}
                alt="School stamp"
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
              className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white hover:bg-white/5"
            >
              Upload stamp
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
        </div>

        {/* READY-MADE PALETTES */}
        <div className="min-w-0 border-t border-white/10 pt-5">
          <div className="mb-4">
            <h4 className="font-semibold text-white">
              Choose your school colors
            </h4>
            <p className="mt-1 text-sm text-slate-400">
              Tap a ready-made color theme. You can change individual
              colors afterward.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {BRAND_PRESETS.map((preset) => {
              const selected = COLOR_FIELDS.every(
                ({ key }) =>
                  brandColors[key].toLowerCase() ===
                  preset.colors[key].toLowerCase()
              );

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.colors)}
                  disabled={submitting}
                  aria-pressed={selected}
                  className={`min-w-0 rounded-2xl border p-3 text-left transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/30"
                      : "border-white/10 bg-slate-950/40 hover:border-white/25"
                  }`}
                >
                  <div className="mb-3 flex h-12 overflow-hidden rounded-xl">
                    {COLOR_FIELDS.map(({ key }) => (
                      <span
                        key={key}
                        className="min-w-0 flex-1"
                        style={{ backgroundColor: preset.colors[key] }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {preset.name}
                    </span>
                    {selected && (
                      <span className="shrink-0 text-xs font-semibold text-cyan-300">
                        ✓ Selected
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* INDIVIDUAL COLOR PICKERS */}
        <div className="min-w-0 border-t border-white/10 pt-5">
          <h4 className="font-semibold text-white">
            Customize individual colors
          </h4>
          <p className="mt-1 text-sm text-slate-400">
            Tap a color box to open your phone's color picker, or enter
            a HEX color code.
          </p>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {COLOR_FIELDS.map((field) => (
              <div
                key={field.key}
                className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <label
                      htmlFor={`brand-${field.key}`}
                      className="block text-sm font-semibold text-white"
                    >
                      {field.label}
                    </label>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {field.description}
                    </p>
                  </div>

                  <div
                    className="h-10 w-10 shrink-0 rounded-xl border-2 border-white/20 shadow-inner"
                    style={{
                      backgroundColor: brandColors[field.key],
                    }}
                  />
                </div>

                <div className="mt-4 flex min-w-0 items-center gap-3">
                  <label
                    htmlFor={`brand-${field.key}`}
                    className="relative flex h-14 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-slate-900"
                    title={`Choose ${field.label}`}
                  >
                    <span className="pointer-events-none text-xl">🎨</span>
                    <input
                      id={`brand-${field.key}`}
                      type="color"
                      value={brandColors[field.key]}
                      onChange={(event) =>
                        updateBrandColor(
                          field.key,
                          event.target.value
                        )
                      }
                      disabled={submitting}
                      aria-label={`Choose ${field.label}`}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>

                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`hex-${field.key}`}
                      className="mb-1 block text-xs text-slate-400"
                    >
                      HEX value
                    </label>
                    <input
                      id={`hex-${field.key}`}
                      type="text"
                      inputMode="text"
                      autoCapitalize="characters"
                      spellCheck={false}
                      value={hexDrafts[field.key]}
                      maxLength={7}
                      onChange={(event) => {
                        const value = event.target.value.toUpperCase();
                        setHexDrafts((previous) => ({
                          ...previous,
                          [field.key]: value,
                        }));

                        if (isValidHex(value)) {
                          updateBrandColor(field.key, value);
                        }
                      }}
                      onBlur={() => {
                        const draft = hexDrafts[field.key];
                        if (isValidHex(draft)) {
                          updateBrandColor(field.key, draft);
                        } else {
                          setHexDrafts((previous) => ({
                            ...previous,
                            [field.key]: brandColors[field.key],
                          }));
                        }
                      }}
                      disabled={submitting}
                      className="min-h-12 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE BRANDING PREVIEW */}
        <div className="min-w-0 border-t border-white/10 pt-5">
          <div className="mb-4">
            <h4 className="font-semibold text-white">
              Live branding preview
            </h4>
            <p className="mt-1 text-sm text-slate-400">
              Your changes appear here immediately.
            </p>
          </div>

          <div
            className="w-full min-w-0 overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: brandColors.background,
              color: brandColors.text,
              borderColor: brandColors.secondary,
            }}
          >
            <div
              className="flex min-w-0 items-center gap-3 p-4"
              style={{
                backgroundColor: brandColors.secondary,
                color: "#ffffff",
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="School logo"
                  className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-1"
                />
              ) : (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: brandColors.primary }}
                >
                  🏫
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {values.schoolName || "Your School Name"}
                </p>
                <p className="text-xs opacity-70">
                  School portal preview
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs opacity-70">Welcome back</p>
                  <p className="text-lg font-bold">
                    School Dashboard
                  </p>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: brandColors.accent,
                    color: brandColors.secondary,
                  }}
                >
                  Academic portal
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Students", "Teachers"].map((label, index) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl border p-3"
                    style={{
                      backgroundColor: brandColors.surface,
                      borderColor: `${brandColors.secondary}30`,
                    }}
                  >
                    <p className="text-xs opacity-70">{label}</p>
                    <p className="mt-1 text-xl font-bold">
                      {index === 0 ? "250" : "18"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-lg px-4 py-2 text-xs font-semibold"
                  style={{
                    backgroundColor: brandColors.primary,
                    color: "#ffffff",
                  }}
                >
                  Primary action
                </span>

                <span
                  className="rounded-lg border px-4 py-2 text-xs font-semibold"
                  style={{
                    borderColor: brandColors.secondary,
                    color: brandColors.text,
                  }}
                >
                  Secondary action
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Save your school settings to apply the selected branding
            throughout your school portal.
          </p>
        </div>
      </section>

      {/* SAVE */}
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="w-full rounded-2xl px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          style={{ backgroundColor: brandColors.primary }}
        >
          {submitting ? "Saving Changes..." : "Save School Settings"}
        </button>

        <p className="text-sm text-slate-400">
          Your logo and palette will be saved for this school.
        </p>
      </div>
    </div>
  );
}
