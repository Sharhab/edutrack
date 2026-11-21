

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import api from "../../../../lib/axios";
import { useTenant } from "../../../../components/tenant/TenantProvider";

type Scope = "school" | "level" | "class";
type AggregationMethod = "average" | "highest" | "selected";

type AssessmentComponent = {
  key: string;
  label: string;
  maxScore: number;
  enabled: boolean;
  order: number;
  aggregationMethod: AggregationMethod;
};

type ClassOption = {
  _id: string;
  name: string;
  level?: string;
};

type SchemeResponse = {
  scheme?: {
    _id?: string;
    name?: string;
    scope?: Scope;
    scopeKey?: string;
    level?: string;
    classId?: string | { _id?: string };
    totalMax?: number;
    components?: AssessmentComponent[];
    version?: number;
  } | null;
  inherited?: boolean;
};

const DEFAULT_COMPONENTS: AssessmentComponent[] = [
  {
    key: "assignment",
    label: "Assignment",
    maxScore: 10,
    enabled: true,
    order: 0,
    aggregationMethod: "average",
  },
  {
    key: "ca1",
    label: "1st CA",
    maxScore: 10,
    enabled: true,
    order: 1,
    aggregationMethod: "average",
  },
  {
    key: "ca2",
    label: "2nd CA",
    maxScore: 10,
    enabled: true,
    order: 2,
    aggregationMethod: "average",
  },
  {
    key: "exam",
    label: "Exam",
    maxScore: 70,
    enabled: true,
    order: 3,
    aggregationMethod: "average",
  },
];

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function createKey(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "assessment"
  );
}

function cloneDefaults() {
  return DEFAULT_COMPONENTS.map((item) => ({ ...item }));
}

function normalizeComponents(items: AssessmentComponent[]) {
  return [...items]
    .map((item, index) => ({
      key: item.key || `component_${index + 1}`,
      label: item.label || "",
      maxScore: Number(item.maxScore),
      enabled: item.enabled !== false,
      order: index,
      aggregationMethod: item.aggregationMethod || "average",
    }))
    .sort((a, b) => a.order - b.order);
}

export default function ResultSchemePage() {
  const { tenant } = useTenant();
  const brandColor = tenant?.themeColor || "#06b6d4";

  const [scope, setScope] = useState<Scope>("school");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const [schemeName, setSchemeName] = useState("Standard Results Scheme");
  const [components, setComponents] =
    useState<AssessmentComponent[]>(cloneDefaults());

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingScheme, setLoadingScheme] = useState(false);
  const [saving, setSaving] = useState(false);

  const [configured, setConfigured] = useState(false);
  const [inherited, setInherited] = useState(false);
  const [version, setVersion] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const levels = useMemo(() => {
    return Array.from(
      new Set(
        classes
          .map((item) => String(item.level || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const enabledTotal = useMemo(
    () =>
      components
        .filter((item) => item.enabled)
        .reduce(
          (sum, item) => sum + (Number(item.maxScore) || 0),
          0
        ),
    [components]
  );

  const enabledCount = components.filter(
    (item) => item.enabled
  ).length;

  const totalIsValid =
    enabledCount > 0 &&
    Math.abs(enabledTotal - 100) < 0.001;

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);

    try {
      const response = await api.get("/classes");

      const raw = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const options: ClassOption[] = raw
        .filter((item: any) => item?._id && item?.name)
        .map((item: any) => ({
          _id: String(item._id),
          name: String(item.name),
          level: String(item.level || ""),
        }));

      setClasses(options);
    } catch (err: any) {
      setError(
        getErrorMessage(err, "Could not load school classes.")
      );
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const loadScheme = useCallback(async () => {
    if (scope === "class" && !selectedClassId) return;
    if (scope === "level" && !selectedLevel) return;

    setLoadingScheme(true);
    setError("");
    setSuccess("");

    const params: Record<string, string> = {};

    if (scope === "class") {
      params.classId = selectedClassId;
    }

    if (scope === "level") {
      params.level = selectedLevel;
    }

    try {
      const response = await api.get("/result-scheme", {
        params,
      });

      const result: SchemeResponse =
        response.data?.data ?? {};

      const scheme = result.scheme;

      if (scheme) {
        setSchemeName(
          scheme.name || "Standard Results Scheme"
        );

        setComponents(
          normalizeComponents(
            Array.isArray(scheme.components)
              ? scheme.components
              : cloneDefaults()
          )
        );

        setConfigured(true);
        setInherited(Boolean(result.inherited));
        setVersion(
          Number.isFinite(Number(scheme.version))
            ? Number(scheme.version)
            : null
        );
      } else {
        setSchemeName("Standard Results Scheme");
        setComponents(cloneDefaults());
        setConfigured(false);
        setInherited(false);
        setVersion(null);
      }
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Could not load the assessment scheme."
        )
      );
    } finally {
      setLoadingScheme(false);
    }
  }, [scope, selectedClassId, selectedLevel]);

  useEffect(() => {
    if (scope === "class" && !selectedClassId) {
      setComponents(cloneDefaults());
      setConfigured(false);
      setInherited(false);
      setVersion(null);
      return;
    }

    if (scope === "level" && !selectedLevel) {
      setComponents(cloneDefaults());
      setConfigured(false);
      setInherited(false);
      setVersion(null);
      return;
    }

    void loadScheme();
  }, [
    scope,
    selectedClassId,
    selectedLevel,
    loadScheme,
  ]);

  function changeScope(nextScope: Scope) {
    setScope(nextScope);
    setError("");
    setSuccess("");
  }

  function updateComponent(
    index: number,
    field: keyof AssessmentComponent,
    value: string | number | boolean
  ) {
    setComponents((current) =>
      current.map((item, i) => {
        if (i !== index) return item;

        return {
          ...item,
          [field]: value,
        };
      })
    );

    setError("");
    setSuccess("");
  }

  function addComponent() {
    if (components.length >= 12) {
      setError("You can add a maximum of 12 components.");
      return;
    }

    const nextNumber = components.length + 1;
    const label = `Assessment ${nextNumber}`;

    let key = createKey(label);
    let suffix = 1;

    while (components.some((item) => item.key === key)) {
      suffix += 1;
      key = `${createKey(label)}_${suffix}`;
    }

    setComponents((current) => [
      ...current,
      {
        key,
        label,
        maxScore: 10,
        enabled: true,
        order: current.length,
        aggregationMethod: "average",
      },
    ]);

    setError("");
    setSuccess("");
  }

  function removeComponent(index: number) {
    if (components.length <= 1) {
      setError("At least one component is required.");
      return;
    }

    setComponents((current) =>
      current
        .filter((_, i) => i !== index)
        .map((item, order) => ({ ...item, order }))
    );

    setError("");
    setSuccess("");
  }

  function validateScheme() {
    if (!schemeName.trim()) {
      return "Enter a name for this assessment scheme.";
    }

    if (components.length === 0) {
      return "Add at least one assessment component.";
    }

    if (components.length > 12) {
      return "You can configure up to 12 components.";
    }

    const keys = new Set<string>();

    for (const item of components) {
      if (!item.label.trim()) {
        return "Every component needs a label.";
      }

      if (!/^[a-z][a-z0-9_]*$/.test(item.key)) {
        return `Invalid component key "${item.key}". Use lowercase letters, numbers, and underscores.`;
      }

      if (keys.has(item.key)) {
        return `Duplicate component key "${item.key}".`;
      }

      keys.add(item.key);

      if (
        !Number.isFinite(Number(item.maxScore)) ||
        Number(item.maxScore) <= 0 ||
        Number(item.maxScore) > 100
      ) {
        return `Enter a valid maximum score for ${item.label}.`;
      }
    }

    if (!enabledCount) {
      return "Enable at least one assessment component.";
    }

    if (!totalIsValid) {
      return `Enabled components must total exactly 100. Your current total is ${enabledTotal.toFixed(2)}.`;
    }

    if (scope === "class" && !selectedClassId) {
      return "Select a class for this scheme.";
    }

    if (scope === "level" && !selectedLevel) {
      return "Select an academic level for this scheme.";
    }

    return "";
  }

  async function saveScheme() {
    const validationError = validateScheme();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload: Record<string, any> = {
      scope,
      name: schemeName.trim(),
      totalMax: 100,
      components: components.map((item, index) => ({
        key: item.key.trim().toLowerCase(),
        label: item.label.trim(),
        maxScore: Number(item.maxScore),
        enabled: item.enabled,
        order: index,
        aggregationMethod: item.aggregationMethod,
      })),
    };

    if (scope === "class") {
      payload.classId = selectedClassId;
    }

    if (scope === "level") {
      payload.level = selectedLevel;
    }

    try {
      const response = await api.put(
        "/result-scheme",
        payload
      );

      const saved = response.data?.data;

      if (saved?.components) {
        setComponents(
          normalizeComponents(saved.components)
        );
      }

      setSchemeName(saved?.name || schemeName);
      setConfigured(true);
      setInherited(false);
      setVersion(
        Number.isFinite(Number(saved?.version))
          ? Number(saved.version)
          : null
      );

      setSuccess(
        "Assessment scheme saved successfully. CBT exams can now use its enabled components."
      );
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Could not save the assessment scheme."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setSchemeName("Standard Results Scheme");
    setComponents(cloneDefaults());
    setError("");
    setSuccess("");
  }

  const scopeDescription =
    scope === "school"
      ? "This scheme is used by classes without their own class or level scheme."
      : scope === "level"
        ? "This scheme is inherited by classes at the selected academic level unless a class-specific scheme exists."
        : "This scheme applies only to the selected class and overrides inherited schemes.";

  const canLoadScheme =
    scope === "school" ||
    (scope === "class" && Boolean(selectedClassId)) ||
    (scope === "level" && Boolean(selectedLevel));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
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
                <BookOpen size={30} />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-white/80">
                {tenant?.schoolName || "EduTrack"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Results Assessment Scheme
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
                Configure the assessment components used for student
                results and CBT marks integration.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                configured ? "bg-green-300" : "bg-amber-300"
              }`}
            />
            {configured ? "Scheme saved" : "Draft configuration"}
          </span>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="break-words">{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Scope */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Scheme scope
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Choose where this assessment configuration should apply.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {([
            {
              value: "school",
              title: "School default",
              description: "Default for the whole school.",
            },
            {
              value: "level",
              title: "Academic level",
              description: "For Nursery, Primary, JSS, or SS.",
            },
            {
              value: "class",
              title: "Individual class",
              description: "For one specific class only.",
            },
          ] as const).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => changeScope(item.value)}
              className={`rounded-xl border p-4 text-left transition ${
                scope === item.value
                  ? "border-cyan-400/50 bg-cyan-500/10"
                  : "border-white/10 bg-slate-900/50 hover:bg-white/[0.05]"
              }`}
            >
              <p className="font-semibold text-white">
                {item.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        {scope === "level" && (
          <div className="max-w-xl space-y-2">
            <label
              htmlFor="scheme-level"
              className="block text-sm font-medium text-slate-300"
            >
              Academic level
            </label>

            <select
              id="scheme-level"
              value={selectedLevel}
              onChange={(event) =>
                setSelectedLevel(event.target.value)
              }
              disabled={loadingClasses || saving}
              className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="">Select academic level</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {!loadingClasses && levels.length === 0 && (
              <p className="text-xs text-amber-300">
                No academic levels were found in your school classes.
                Add a level to your classes first.
              </p>
            )}
          </div>
        )}

        {scope === "class" && (
          <div className="max-w-xl space-y-2">
            <label
              htmlFor="scheme-class"
              className="block text-sm font-medium text-slate-300"
            >
              Class
            </label>

            <select
              id="scheme-class"
              value={selectedClassId}
              onChange={(event) =>
                setSelectedClassId(event.target.value)
              }
              disabled={loadingClasses || saving}
              className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                  {item.level ? ` (${item.level})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-sm leading-6 text-slate-300">
            {scopeDescription}
          </p>
        </div>
      </section>

      {/* Scheme editor */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Assessment components
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Enabled components must add up to 100 marks.
            </p>
          </div>

          <button
            type="button"
            onClick={addComponent}
            disabled={
              saving ||
              loadingScheme ||
              components.length >= 12
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
          >
            <Plus size={17} />
            Add component
          </button>
        </div>

        {loadingScheme ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
            <LoaderCircle size={20} className="animate-spin" />
            Loading assessment scheme...
          </div>
        ) : !canLoadScheme ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Select the scheme scope and its target to configure components.
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <label
                htmlFor="scheme-name"
                className="block text-sm font-medium text-slate-300"
              >
                Scheme name
              </label>

              <input
                id="scheme-name"
                value={schemeName}
                onChange={(event) =>
                  setSchemeName(event.target.value)
                }
                maxLength={100}
                disabled={saving}
                className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
                placeholder="e.g. Standard Results Scheme"
              />
            </div>

            {inherited && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                This class or level is currently inheriting another
                scheme. Saving here will create a more specific scheme
                that takes priority.
              </div>
            )}

            {components.map((item, index) => (
              <article
                key={`${item.key}-${index}`}
                className="space-y-4 rounded-xl border border-white/10 bg-slate-900/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-bold text-cyan-300">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        {item.label || "New component"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Key: {item.key}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeComponent(index)}
                    disabled={saving || components.length <= 1}
                    aria-label={`Remove ${item.label}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-300 transition hover:bg-red-500/10 disabled:opacity-30"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor={`component-label-${index}`}
                      className="block text-xs font-medium text-slate-400"
                    >
                      Component label
                    </label>

                    <input
                      id={`component-label-${index}`}
                      value={item.label}
                      onChange={(event) =>
                        updateComponent(
                          index,
                          "label",
                          event.target.value
                        )
                      }
                      maxLength={60}
                      disabled={saving}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
                      placeholder="e.g. Practical"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor={`component-key-${index}`}
                      className="block text-xs font-medium text-slate-400"
                    >
                      Component key
                    </label>

                    <input
                      id={`component-key-${index}`}
                      value={item.key}
                      onChange={(event) =>
                        updateComponent(
                          index,
                          "key",
                          event.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "_")
                        )
                      }
                      disabled={saving}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor={`component-score-${index}`}
                      className="block text-xs font-medium text-slate-400"
                    >
                      Maximum score
                    </label>

                    <input
                      id={`component-score-${index}`}
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={item.maxScore}
                      onChange={(event) =>
                        updateComponent(
                          index,
                          "maxScore",
                          event.target.value === ""
                            ? 0
                            : Number(event.target.value)
                        )
                      }
                      disabled={saving}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor={`component-aggregation-${index}`}
                      className="block text-xs font-medium text-slate-400"
                    >
                      Multiple CBT exams
                    </label>

                    <select
                      id={`component-aggregation-${index}`}
                      value={item.aggregationMethod}
                      onChange={(event) =>
                        updateComponent(
                          index,
                          "aggregationMethod",
                          event.target.value as AggregationMethod
                        )
                      }
                      disabled={saving}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
                    >
                      <option value="average">
                        Average scores
                      </option>
                      <option value="highest">
                        Highest score
                      </option>
                      <option value="selected">
                        Teacher selects score
                      </option>
                    </select>
                  </div>
                </div>

                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) =>
                      updateComponent(
                        index,
                        "enabled",
                        event.target.checked
                      )
                    }
                    disabled={saving}
                    className="h-4 w-4 accent-cyan-400"
                  />

                  <span className="text-sm text-slate-300">
                    Include this component in the final result
                  </span>

                  <span
                    className={`ml-auto text-xs font-semibold ${
                      item.enabled
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }`}
                  >
                    {item.enabled ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </article>
            ))}

            {/* Total */}
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Enabled assessment total
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Disabled components are excluded.
                  </p>
                </div>

                <p
                  className={`text-2xl font-bold tabular-nums ${
                    totalIsValid
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }`}
                >
                  {enabledTotal.toFixed(2)} / 100
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(enabledTotal, 100)}%`,
                    backgroundColor: totalIsValid
                      ? "#34d399"
                      : brandColor,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {totalIsValid
                  ? "Your assessment components total 100 marks."
                  : `Adjust the enabled component scores by ${Math.abs(100 - enabledTotal).toFixed(2)} marks to reach 100.`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={resetToDefaults}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Load default components
              </button>

              <button
                type="button"
                onClick={() => void saveScheme()}
                disabled={
                  saving ||
                  loadingScheme ||
                  !totalIsValid ||
                  !canLoadScheme
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving scheme..." : "Save assessment scheme"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">
          How this works with CBT
        </h2>

        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
          <li>
            • When creating a CBT exam, choose one enabled assessment
            component.
          </li>
          <li>
            • CBT marks are converted to that component's maximum score.
          </li>
          <li>
            • Multiple CBT exams use the aggregation method configured
            for that component.
          </li>
          <li>
            • Teacher-entered scores in other components are preserved
            during synchronization.
          </li>
        </ul>
      </section>
    </main>
  );
}
