
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Save, Trash2, RefreshCw, ClipboardList } from "lucide-react";

import api from "../../../../../lib/axios";
import { getClasses } from "../../../../../lib/classes";
import SectionCard from "../../../../../components/ui/SectionCard";
import PageLoader from "../../../../../components/ui/PageLoader";

type Scope = "school" | "level" | "class";

type Component = {
  key: string;
  label: string;
  maxScore: number;
  enabled: boolean;
  order: number;
};

type ClassOption = {
  _id: string;
  name: string;
  level?: string;
};

type Scheme = {
  _id?: string;
  name: string;
  scope: Scope;
  scopeKey: string;
  level?: string;
  classId?: string | { _id: string };
  totalMax: number;
  version?: number;
  components: Component[];
};

const DEFAULT_COMPONENTS: Component[] = [
  { key: "assignment", label: "Assignment", maxScore: 10, enabled: true, order: 0 },
  { key: "ca1", label: "First CA", maxScore: 10, enabled: true, order: 1 },
  { key: "ca2", label: "Second CA", maxScore: 10, enabled: true, order: 2 },
  { key: "exam", label: "Examination", maxScore: 70, enabled: true, order: 3 },
];

const emptyScheme = (): Scheme => ({
  name: "Results Scheme",
  scope: "school",
  scopeKey: "school",
  level: "",
  classId: "",
  totalMax: 100,
  components: DEFAULT_COMPONENTS.map((item) => ({ ...item })),
});

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

function normalizeClassId(value: Scheme["classId"]) {
  if (typeof value === "string") return value;
  return value?._id || "";
}

export default function ResultsSchemePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [scheme, setScheme] = useState<Scheme>(emptyScheme());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const enabledTotal = useMemo(
    () =>
      scheme.components.reduce(
        (sum, component) =>
          sum + (component.enabled ? Number(component.maxScore || 0) : 0),
        0
      ),
    [scheme.components]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [classData, schemeResponse] = await Promise.all([
        getClasses(),
        api.get("/result-scheme/all"),
      ]);

      setClasses((classData || []) as ClassOption[]);
      setSchemes(schemeResponse.data?.data || []);
    } catch (err) {
      setError(errorMessage(err, "Could not load classes and assessment schemes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateScheme<K extends keyof Scheme>(field: K, value: Scheme[K]) {
    setScheme((previous) => ({ ...previous, [field]: value }));
    setMessage("");
    setError("");
  }

  function chooseScope(scope: Scope) {
    setScheme({
      ...emptyScheme(),
      scope,
      scopeKey: scope === "school" ? "school" : "",
    });
    setMessage("");
    setError("");
  }

  function updateComponent(
    index: number,
    field: keyof Component,
    value: string | number | boolean
  ) {
    setScheme((previous) => ({
      ...previous,
      components: previous.components.map((component, i) =>
        i === index ? { ...component, [field]: value } : component
      ),
    }));
    setMessage("");
    setError("");
  }

  function addComponent() {
    if (scheme.components.length >= 12) {
      setError("A scheme can contain at most 12 components.");
      return;
    }

    const baseKey = `assessment_${scheme.components.length + 1}`;

    setScheme((previous) => ({
      ...previous,
      components: [
        ...previous.components,
        {
          key: baseKey,
          label: "",
          maxScore: 10,
          enabled: true,
          order: previous.components.length,
        },
      ],
    }));
  }

  function removeComponent(index: number) {
    setScheme((previous) => ({
      ...previous,
      components: previous.components
        .filter((_, i) => i !== index)
        .map((component, order) => ({ ...component, order })),
    }));
  }

  function loadExistingScheme() {
    const selected = schemes.find((item) => {
      if (item.scope !== scheme.scope) return false;

      if (scheme.scope === "school") return true;

      if (scheme.scope === "level") {
        return (
          (item.level || item.scopeKey).toLowerCase() ===
          scheme.level?.trim().toLowerCase()
        );
      }

      return normalizeClassId(item.classId) === String(scheme.classId);
    });

    if (!selected) {
      setError("No saved scheme exists for this selection. You can create one below.");
      setMessage("");
      return;
    }

    setScheme({
      ...selected,
      classId: normalizeClassId(selected.classId),
      level: selected.level || "",
      components: selected.components.map((component, order) => ({
        ...component,
        enabled: component.enabled !== false,
        order: component.order ?? order,
      })),
    });

    setError("");
    setMessage("Saved scheme loaded. Review it before making changes.");
  }

  async function save() {
    setError("");
    setMessage("");

    if (!scheme.name.trim()) {
      setError("Enter a scheme name.");
      return;
    }

    if (scheme.components.length < 1 || scheme.components.length > 12) {
      setError("Add between 1 and 12 assessment components.");
      return;
    }

    if (!scheme.components.some((component) => component.enabled)) {
      setError("Enable at least one assessment component.");
      return;
    }

    if (Math.abs(enabledTotal - 100) > 0.001) {
      setError(`Enabled components must total 100. Your current total is ${enabledTotal}.`);
      return;
    }

    const seenKeys = new Set<string>();

    for (const component of scheme.components) {
      if (!/^[a-z][a-z0-9_]*$/.test(component.key.trim().toLowerCase())) {
        setError(`Invalid component key "${component.key}". Use lowercase letters, numbers, and underscores.`);
        return;
      }

      if (seenKeys.has(component.key.trim().toLowerCase())) {
        setError(`Duplicate component key: ${component.key}.`);
        return;
      }

      seenKeys.add(component.key.trim().toLowerCase());

      if (!component.label.trim()) {
        setError("Every component needs a display name.");
        return;
      }

      if (
        !Number.isFinite(Number(component.maxScore)) ||
        Number(component.maxScore) <= 0 ||
        Number(component.maxScore) > 100
      ) {
        setError(`Enter a valid maximum score for ${component.label}.`);
        return;
      }
    }

    if (scheme.scope === "level" && !scheme.level?.trim()) {
      setError("Enter the academic level for this scheme.");
      return;
    }

    if (scheme.scope === "class" && !scheme.classId) {
      setError("Select a class for this scheme.");
      return;
    }

    const payload = {
      name: scheme.name.trim(),
      scope: scheme.scope,
      totalMax: 100,
      ...(scheme.scope === "level"
        ? { level: scheme.level?.trim() }
        : {}),
      ...(scheme.scope === "class"
        ? { classId: normalizeClassId(scheme.classId) }
        : {}),
      components: scheme.components.map((component, order) => ({
        key: component.key.trim().toLowerCase(),
        label: component.label.trim(),
        maxScore: Number(component.maxScore),
        enabled: component.enabled,
        order,
      })),
    };

    setSaving(true);

    try {
      await api.put("/result-scheme", payload);
      setMessage("Results scheme saved successfully.");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Failed to save results scheme."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            Academic settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Results Scheme
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Configure the assessment components teachers use when entering results.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <SectionCard title="Scheme scope">
        <div className="grid gap-4 md:grid-cols-3">
          {([
            ["school", "School default", "Applies when no more specific scheme exists."],
            ["level", "Academic level", "Overrides the school default for a level."],
            ["class", "Specific class", "Overrides both the level and school defaults."],
          ] as const).map(([value, title, description]) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseScope(value)}
              className={`rounded-xl border p-4 text-left transition ${
                scheme.scope === value
                  ? "border-cyan-600 bg-cyan-50 ring-1 ring-cyan-600"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="font-semibold text-slate-900">{title}</span>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Scheme name</span>
            <input
              value={scheme.name}
              onChange={(e) => updateScheme("name", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600"
              placeholder="e.g. Standard Assessment"
            />
          </label>

          {scheme.scope === "level" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Academic level</span>
              <input
                value={scheme.level || ""}
                onChange={(e) => updateScheme("level", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600"
                placeholder="e.g. Primary, JSS, Senior Secondary"
              />
            </label>
          )}

          {scheme.scope === "class" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Class</span>
              <select
                value={normalizeClassId(scheme.classId)}
                onChange={(e) => updateScheme("classId", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-cyan-600"
              >
                <option value="">Select a class</option>
                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}{item.level ? ` — ${item.level}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={loadExistingScheme}
          className="mt-4 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          Load saved scheme for this scope
        </button>
      </SectionCard>

      <SectionCard title="Assessment components">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-600">
            Enable the components teachers should enter. Their maximum marks must total 100.
          </p>
          <button
            type="button"
            onClick={addComponent}
            disabled={scheme.components.length >= 12}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-700 px-4 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-50 disabled:opacity-50"
          >
            <Plus size={16} />
            Add component
          </button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Enabled maximum</p>
            <p className="mt-1 text-2xl font-bold">{enabledTotal}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Required total</p>
            <p className="mt-1 text-2xl font-bold">100</p>
          </div>
          <div className={`rounded-xl p-4 ${Math.abs(enabledTotal - 100) < 0.001 ? "bg-emerald-50" : "bg-amber-50"}`}>
            <p className="text-sm text-slate-600">Validation</p>
            <p className="mt-1 font-bold">
              {Math.abs(enabledTotal - 100) < 0.001 ? "Total is valid" : "Adjust component marks"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {scheme.components.map((component, index) => (
            <div
              key={`${component.key}-${index}`}
              className="grid items-end gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[auto_1fr_1fr_130px_auto]"
            >
              <label className="flex items-center gap-2 pb-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={component.enabled}
                  onChange={(e) => updateComponent(index, "enabled", e.target.checked)}
                  className="h-4 w-4 accent-cyan-700"
                />
                Enabled
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Display label</span>
                <input
                  value={component.label}
                  onChange={(e) => updateComponent(index, "label", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="e.g. Practical"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Unique key</span>
                <input
                  value={component.key}
                  onChange={(e) => updateComponent(index, "key", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="e.g. practical"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Maximum mark</span>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.5"
                  value={component.maxScore}
                  onChange={(e) => updateComponent(index, "maxScore", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <button
                type="button"
                onClick={() => removeComponent(index)}
                disabled={scheme.components.length <= 1}
                aria-label={`Remove ${component.label || "assessment component"}`}
                className="flex h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            Scheme version: {scheme.version ?? "New scheme"}
          </p>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || Math.abs(enabledTotal - 100) > 0.001}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Saving…" : "Save results scheme"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Saved schemes">
        {schemes.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
            <ClipboardList size={20} />
            No schemes have been saved yet.
          </div>
        ) : (
          <div className="space-y-2">
            {schemes.map((item) => (
              <div key={item._id || `${item.scope}-${item.scopeKey}`} className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.scope === "school"
                      ? "School default"
                      : item.scope === "level"
                        ? `Level: ${item.level || item.scopeKey}`
                        : `Class: ${classes.find((c) => c._id === normalizeClassId(item.classId))?.name || normalizeClassId(item.classId)}`}
                    {" · "}Version {item.version ?? 1}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScheme({
                      ...item,
                      classId: normalizeClassId(item.classId),
                      components: item.components.map((component, order) => ({
                        ...component,
                        enabled: component.enabled !== false,
                        order: component.order ?? order,
                      })),
                    });
                    setError("");
                    setMessage("Scheme loaded for editing.");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Edit scheme
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
