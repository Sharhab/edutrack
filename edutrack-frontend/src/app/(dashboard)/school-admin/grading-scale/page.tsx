

"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../../../../lib/axios";
import { useTenant } from "../../../../components/tenant/TenantProvider";
import {
  Award,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

type GradeBand = {
  grade: string;
  minScore: number;
  maxScore: number;
  remark: string;
};

type GradingScaleResponse = {
  configured: boolean;
  bands: GradeBand[];
  updatedAt?: string | null;
};

const DEFAULT_BANDS: GradeBand[] = [
  { grade: "F", minScore: 0, maxScore: 40, remark: "Fail" },
  { grade: "E", minScore: 40, maxScore: 45, remark: "Pass" },
  { grade: "D", minScore: 45, maxScore: 50, remark: "Fair" },
  { grade: "C", minScore: 50, maxScore: 60, remark: "Good" },
  { grade: "B", minScore: 60, maxScore: 70, remark: "Very Good" },
  { grade: "A", minScore: 70, maxScore: 100, remark: "Excellent" },
];

function isValidScale(bands: GradeBand[]) {
  if (!Array.isArray(bands) || bands.length === 0) return false;

  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  const labels = new Set<string>();

  for (const band of sorted) {
    if (
      !band.grade?.trim() ||
      !band.remark?.trim() ||
      !Number.isFinite(band.minScore) ||
      !Number.isFinite(band.maxScore) ||
      band.minScore < 0 ||
      band.maxScore > 100 ||
      band.minScore >= band.maxScore
    ) {
      return false;
    }

    const label = band.grade.trim().toLowerCase();
    if (labels.has(label)) return false;
    labels.add(label);
  }

  if (sorted[0].minScore !== 0) return false;
  if (sorted[sorted.length - 1].maxScore !== 100) return false;

  return sorted.every(
    (band, index) =>
      index === 0 || band.minScore === sorted[index - 1].maxScore
  );
}

function validateBands(bands: GradeBand[]) {
  if (!bands.length) return "Add at least one grade band.";

  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  const labels = new Set<string>();

  for (const band of sorted) {
    if (!band.grade.trim() || !band.remark.trim()) {
      return "Complete the grade label and remark for every row.";
    }

    const label = band.grade.trim().toLowerCase();
    if (labels.has(label)) return `Grade "${band.grade}" is duplicated.`;
    labels.add(label);

    if (
      !Number.isFinite(band.minScore) ||
      !Number.isFinite(band.maxScore) ||
      band.minScore < 0 ||
      band.maxScore > 100 ||
      band.minScore >= band.maxScore
    ) {
      return `Enter a valid score range for grade ${band.grade}.`;
    }
  }

  if (sorted[0].minScore !== 0) {
    return "The first score range must start at 0.";
  }

  if (sorted[sorted.length - 1].maxScore !== 100) {
    return "The last score range must end at 100.";
  }

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minScore !== sorted[i - 1].maxScore) {
      return "Score ranges must connect without gaps or overlaps.";
    }
  }

  return null;
}

export default function GradingScalePage() {
  const { tenant } = useTenant();
  const brandColor = tenant?.themeColor || "#06b6d4";

  const [bands, setBands] = useState<GradeBand[]>(DEFAULT_BANDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadScale = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setNeedsReview(false);

    try {
      const response = await api.get("/grading-scale");
      const data: GradingScaleResponse =
        response.data?.data ?? response.data;

      if (data.configured && Array.isArray(data.bands) && data.bands.length) {
        if (isValidScale(data.bands)) {
          setBands(
            [...data.bands].sort((a, b) => a.minScore - b.minScore)
          );
          setConfigured(true);
        } else {
          // Do not render a large collection of empty or broken rows.
          // Preserve the existing server data until the administrator saves.
          setBands(DEFAULT_BANDS.map((band) => ({ ...band })));
          setConfigured(false);
          setNeedsReview(true);
        }
      } else {
        setBands(DEFAULT_BANDS.map((band) => ({ ...band })));
        setConfigured(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "We couldn't load your grading scale. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScale();
  }, [loadScale]);

  function updateBand(
    index: number,
    field: keyof GradeBand,
    value: string
  ) {
    setBands((current) =>
      current.map((band, i) => {
        if (i !== index) return band;

        if (field === "minScore" || field === "maxScore") {
          return {
            ...band,
            [field]: value === "" ? Number.NaN : Number(value),
          };
        }

        return { ...band, [field]: value };
      })
    );

    setError("");
    setSuccess("");
  }

  function addBand() {
    if (bands.length >= 12) {
      setError("You can configure up to 12 grade bands.");
      return;
    }

    setBands((current) => [
      ...current,
      {
        grade: "",
        minScore: 0,
        maxScore: 0,
        remark: "",
      },
    ]);

    setError("");
    setSuccess("");
  }

  function removeBand(index: number) {
    setBands((current) => current.filter((_, i) => i !== index));
    setError("");
    setSuccess("");
  }

  async function saveScale() {
    const validationError = validateBands(bands);

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put("/grading-scale", {
        bands: [...bands].sort((a, b) => a.minScore - b.minScore),
      });

      const data: GradingScaleResponse =
        response.data?.data ?? response.data;

      if (data.bands?.length) {
        setBands(
          [...data.bands].sort((a, b) => a.minScore - b.minScore)
        );
      }

      setConfigured(true);
      setNeedsReview(false);
      setSuccess("Your school's grading scale has been saved.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "We couldn't save your grading scale. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm sm:p-8"
        style={{ backgroundColor: brandColor }}
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={`${tenant.schoolName || "School"} logo`}
                className="h-14 w-14 rounded-xl border border-white/30 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
                <Award size={30} />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-white/80">
                {tenant?.schoolName || "EduTrack"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Grading Scale
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
                Set the grades and performance remarks used by your school.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                configured ? "bg-green-300" : "bg-amber-300"
              }`}
            />
            {configured ? "Scale saved" : "Not yet saved"}
          </span>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {needsReview && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Your saved grading scale appears incomplete. A recommended
          six-grade setup is shown below. Review it and save to replace
          the incomplete configuration.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Grade bands
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure each grade from 0 to 100.
            </p>
          </div>

          <button
            type="button"
            onClick={addBand}
            disabled={loading || saving || bands.length >= 12}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            <Plus size={17} />
            Add grade
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading grading scale...
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-4 py-4">Minimum score</th>
                    <th className="px-4 py-4">Maximum score</th>
                    <th className="px-4 py-4">Performance remark</th>
                    <th className="px-4 py-4 text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bands.map((band, index) => (
                    <tr key={index} className="hover:bg-gray-50/70">
                      <td className="px-6 py-3">
                        <input
                          aria-label={`Grade label ${index + 1}`}
                          value={band.grade}
                          onChange={(e) =>
                            updateBand(index, "grade", e.target.value)
                          }
                          placeholder="e.g. A"
                          className="w-24 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2"
                          style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Minimum score ${index + 1}`}
                          type="number"
                          min={0}
                          max={100}
                          value={Number.isNaN(band.minScore) ? "" : band.minScore}
                          onChange={(e) =>
                            updateBand(index, "minScore", e.target.value)
                          }
                          className="w-28 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Maximum score ${index + 1}`}
                          type="number"
                          min={0}
                          max={100}
                          value={Number.isNaN(band.maxScore) ? "" : band.maxScore}
                          onChange={(e) =>
                            updateBand(index, "maxScore", e.target.value)
                          }
                          className="w-28 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Remark ${index + 1}`}
                          value={band.remark}
                          onChange={(e) =>
                            updateBand(index, "remark", e.target.value)
                          }
                          placeholder="e.g. Excellent"
                          className="w-full min-w-40 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeBand(index)}
                          disabled={saving}
                          aria-label={`Remove grade ${index + 1}`}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 md:hidden">
              {bands.map((band, index) => (
                <article
                  key={index}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="rounded-lg px-3 py-1.5 text-sm font-bold"
                      style={{
                        backgroundColor: `${brandColor}18`,
                        color: brandColor,
                      }}
                    >
                      Grade {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBand(index)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Grade label
                      <input
                        value={band.grade}
                        onChange={(e) =>
                          updateBand(index, "grade", e.target.value)
                        }
                        placeholder="e.g. A"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900 outline-none focus:ring-2"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Minimum score
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={Number.isNaN(band.minScore) ? "" : band.minScore}
                          onChange={(e) =>
                            updateBand(index, "minScore", e.target.value)
                          }
                          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900 outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Maximum score
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={Number.isNaN(band.maxScore) ? "" : band.maxScore}
                          onChange={(e) =>
                            updateBand(index, "maxScore", e.target.value)
                          }
                          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900 outline-none focus:ring-2"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-medium text-gray-700">
                      Performance remark
                      <input
                        value={band.remark}
                        onChange={(e) =>
                          updateBand(index, "remark", e.target.value)
                        }
                        placeholder="e.g. Excellent"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900 outline-none focus:ring-2"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="border-t border-gray-100 bg-gray-50/80 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-gray-500">
              {bands.length} grade band{bands.length === 1 ? "" : "s"} ·
              Score ranges must cover 0–100 without gaps or overlaps.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setBands(DEFAULT_BANDS.map((band) => ({ ...band })));
                  setError("");
                  setSuccess("");
                }}
                disabled={loading || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Use defaults
              </button>

              <button
                type="button"
                onClick={saveScale}
                disabled={loading || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving..." : "Save grading scale"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
