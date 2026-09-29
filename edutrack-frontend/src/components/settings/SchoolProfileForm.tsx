 "use client";

import { useMemo, useRef } from "react";
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
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const previewUrl = useMemo(() => {
    if (values.logoFile) {
      return URL.createObjectURL(
        values.logoFile
      );
    }

    return values.logoUrl || "";
  }, [
    values.logoFile,
    values.logoUrl,
  ]);

  function handleLogoChange(
    file?: File
  ) {
    if (!file) return;

    onChange("logoFile", file);
  }

  function removeLogo() {
    onChange("logoFile", undefined);
    onChange("logoUrl", "");
  }

  return (
    <div className="space-y-6">
      {/* =========================
          BASIC DETAILS
      ========================= */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            School Information
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Basic information about
            your school
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="School Name"
            name="schoolName"
            value={values.schoolName}
            placeholder="Globstand International School"
            onChange={(value) =>
              onChange(
                "schoolName",
                value
              )
            }
          />

          <FormInput
            label="Principal Name"
            name="principalName"
            value={values.principalName}
            placeholder="Mrs Amina Musa"
            onChange={(value) =>
              onChange(
                "principalName",
                value
              )
            }
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            placeholder="school@example.com"
            onChange={(value) =>
              onChange("email", value)
            }
          />

          <FormInput
            label="Phone"
            name="phone"
            value={values.phone}
            placeholder="080..."
            onChange={(value) =>
              onChange("phone", value)
            }
          />
        </div>

        <div className="mt-4">
          <FormInput
            label="Address"
            name="address"
            value={values.address}
            placeholder="School address"
            onChange={(value) =>
              onChange(
                "address",
                value
              )
            }
          />
        </div>
      </div>

      {/* =========================
          SESSION SETTINGS
      ========================= */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Academic Defaults
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Current academic session
            and term
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Current Session"
            name="currentSession"
            value={values.currentSession}
            onChange={(value) => onChange(
              "currentSession",
              value
            )} options={[]}          />

          <SelectField
            label="Current Term"
            name="currentTerm"
            value={values.currentTerm}
            onChange={(value) =>
              onChange(
                "currentTerm",
                value
              )
            }
            options={[
              {
                label:
                  "Select Term",
                value: "",
              },
              {
                label: "1st Term",
                value: "1st Term",
              },
              {
                label: "2nd Term",
                value: "2nd Term",
              },
              {
                label: "3rd Term",
                value: "3rd Term",
              },
            ]}
          />
        </div>
      </div>

      {/* =========================
          BRANDING
      ========================= */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Branding
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Customize your school
            appearance
          </p>
        </div>

        {/* LOGO */}
        <div className="mb-6">
          <label className="mb-3 block text-sm text-slate-300">
            School Logo
          </label>

          <div
            onClick={() =>
              fileInputRef.current?.click()
            }
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
              accept="image/*"
              hidden
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                handleLogoChange(
                  file
                );
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
            {presetColors.map(
              (color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    onChange(
                      "themeColor",
                      color
                    )
                  }
                  className={`h-10 w-10 rounded-2xl border-2 transition ${
                    values.themeColor ===
                    color
                      ? "scale-110 border-white"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor:
                      color,
                  }}
                />
              )
            )}

            {/* CUSTOM COLOR */}
            <label className="relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <input
                type="color"
                value={
                  values.themeColor
                }
                onChange={(e) =>
                  onChange(
                    "themeColor",
                    e.target.value
                  )
                }
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              <span className="text-xs text-white">
                +
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* =========================
          SAVE BUTTON
      ========================= */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-2xl bg-cyan-500 px-6 py-3 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting
            ? "Saving Changes..."
            : "Save Profile"}
        </button>

        <p className="text-sm text-slate-400">
          Changes update your school
          branding instantly.
        </p>
      </div>
    </div>
  );
}