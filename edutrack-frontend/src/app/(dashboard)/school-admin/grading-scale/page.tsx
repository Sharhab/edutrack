
"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../../../../lib/axios";

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

function validateBands(bands: GradeBand[]): string | null {
  if (bands.length === 0) {
    return "Add at least one grade band.";
  }

  const sorted = [...bands].sort(
    (a, b) => a.minScore - b.minScore
  );

  const grades = new Set<string>();

  for (const band of sorted) {
    const grade = band.grade.trim().toLowerCase();

    if (!grade || !band.remark.trim()) {
      return "Every grade needs a label and a remark.";
    }

    if (grades.has(grade)) {
      return `The grade "${band.grade}" is duplicated.`;
    }

    grades.add(grade);

    if (
      !Number.isFinite(band.minScore) ||
      !Number.isFinite(band.maxScore) ||
      band.minScore < 0 ||
      band.maxScore > 100 ||
      band.minScore >= band.maxScore
    ) {
      return `Check the score range for grade ${band.grade}.`;
    }
  }

  if (sorted[0].minScore !== 0) {
    return "The lowest range must start at 0.";
  }

  if (sorted[sorted.length - 1].maxScore !== 100) {
    return "The highest range must end at 100.";
  }

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minScore !== sorted[i - 1].maxScore) {
      return "Ranges must connect exactly without gaps or overlaps.";
    }
  }

  return null;
}

export default function GradingScalePage() {
  const [bands, setBands] = useState<GradeBand[]>(DEFAULT_BANDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadScale = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/grading-scale");
      const data: GradingScaleResponse =
        response.data?.data ?? response.data;

      if (data.configured && data.bands?.length) {
        setBands(
          [...data.bands].sort(
            (a, b) => a.minScore - b.minScore
          )
        );
        setConfigured(true);
      } else {
        setBands(DEFAULT_BANDS);
        setConfigured(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not load the grading scale. Check your connection and backend route."
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
            [field]: value === "" ? 0 : Number(value),
          };
        }

        return { ...band, [field]: value };
      })
    );

    setError("");
    setSuccess("");
  }

  function addBand() {
    setBands((current) => [
      ...current,
      {
        grade: "",
        minScore: 0,
        maxScore: 0,
        remark: "",
      },
    ]);
    setSuccess("");
    setError("");
  }

  function removeBand(index: number) {
    setBands((current) =>
      current.filter((_, i) => i !== index)
    );
    setSuccess("");
    setError("");
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
      const payload = {
        bands: [...bands].sort(
          (a, b) => a.minScore - b.minScore
        ),
      };

      const response = await api.put("/grading-scale", payload);
      const data: GradingScaleResponse =
        response.data?.data ?? response.data;

      if (data.bands?.length) {
        setBands(
          [...data.bands].sort(
            (a, b) => a.minScore - b.minScore
          )
        );
      }

      setConfigured(true);
      setSuccess("Grading scale saved successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not save the grading scale. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-700">
              School settings
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Grading Scale
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Set the grades, score ranges, and remarks your school
              uses for student results. Each school manages its own scale.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              configured
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {configured ? "Saved scale" : "Default preview"}
          </span>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {success}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Grade bands
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Scores run from 0 to 100. Each band includes its
              minimum and maximum boundary.
            </p>
          </div>

          <button
            type="button"
            onClick={addBand}
            disabled={loading || saving}
            className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50 disabled:opacity-50"
          >
            + Add grade
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading grading scale...
          </div>
        ) : (
          <>
            <div className="space-y-4 p-4 sm:hidden">
              {bands.map((band, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Grade {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBand(index)}
                      disabled={saving}
                      className="text-sm font-medium text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  <label className="block text-sm text-gray-600">
                    Grade label
                    <input
                      value={band.grade}
                      onChange={(e) =>
                        updateBand(index, "grade", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-base text-gray-900"
                      placeholder="e.g. A"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm text-gray-600">
                      Minimum
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={band.minScore}
                        onChange={(e) =>
                          updateBand(index, "minScore", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-base text-gray-900"
                      />
                    </label>

                    <label className="block text-sm text-gray-600">
                      Maximum
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={band.maxScore}
                        onChange={(e) =>
                          updateBand(index, "maxScore", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-base text-gray-900"
                      />
                    </label>
                  </div>

                  <label className="block text-sm text-gray-600">
                    Remark
                    <input
                      value={band.remark}
                      onChange={(e) =>
                        updateBand(index, "remark", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-base text-gray-900"
                      placeholder="e.g. Excellent"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Grade</th>
                    <th className="px-5 py-3 font-semibold">Minimum</th>
                    <th className="px-5 py-3 font-semibold">Maximum</th>
                    <th className="px-5 py-3 font-semibold">Remark</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {bands.map((band, index) => (
                    <tr key={index}>
                      <td className="px-5 py-3">
                        <input
                          value={band.grade}
                          onChange={(e) =>
                            updateBand(index, "grade", e.target.value)
                          }
                          className="w-24 rounded-lg border px-3 py-2 text-gray-900"
                          aria-label={`Grade label ${index + 1}`}
                        />
                      </td>

                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={band.minScore}
                          onChange={(e) =>
                            updateBand(index, "minScore", e.target.value)
                          }
                          className="w-24 rounded-lg border px-3 py-2 text-gray-900"
                          aria-label={`Minimum score ${index + 1}`}
                        />
                      </td>

                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={band.maxScore}
                          onChange={(e) =>
                            updateBand(index, "maxScore", e.target.value)
                          }
                          className="w-24 rounded-lg border px-3 py-2 text-gray-900"
                          aria-label={`Maximum score ${index + 1}`}
                        />
                      </td>

                      <td className="px-5 py-3">
                        <input
                          value={band.remark}
                          onChange={(e) =>
                            updateBand(index, "remark", e.target.value)
                          }
                          className="w-full min-w-36 rounded-lg border px-3 py-2 text-gray-900"
                          aria-label={`Remark ${index + 1}`}
                        />
                      </td>

                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => removeBand(index)}
                          disabled={saving}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-xs leading-5 text-gray-500">
            Range boundaries must connect exactly. For example, a band
            from 40 to 50 is followed by a band starting at 50.
          </p>

          <button
            type="button"
            onClick={saveScale}
            disabled={loading || saving}
            className="rounded-lg bg-cyan-700 px-5 py-2.5 font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save grading scale"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Before you continue</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Saving this page stores your school’s grading configuration.
          Existing result calculations and cumulative report grades are
          not yet connected to these settings. We will connect them in
          the next step after verifying the API and page.
        </p>
      </section>
    </main>
  );
}
