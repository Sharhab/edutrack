
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Save, Search, UploadCloud, RefreshCw } from "lucide-react";

import SectionCard from "../../../../../components/ui/SectionCard";
import PageLoader from "../../../../../components/ui/PageLoader";
import EmptyState from "../../../../../components/ui/EmptyState";
import FormInput from "../../../../../components/ui/FormInput";

import {
  bulkUpsertResults,
  getClassAssessmentScheme,
  getClassStudentsForResultEntry,
  getResults,
  getTeacherResultContext,
  publishResults,
  type AssessmentComponent,
  type AssessmentScheme,
} from "../../../../../lib/results";

import {
  getClassTraitAssessments,
  saveStudentTraitAssessment,
  type TraitRating,
  type ClassStudentTraitAssessment,
} from "../../../../../lib/trait-assessments";

/* =========================================
   TYPES
========================================= */

type StudentTraitDraft = {
  psychomotor: TraitRating[];
  affective: TraitRating[];
  teacherComment: string;
};

type StudentRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  admissionNumber?: string;
  gender?: string;
  attendanceStatus?: string;

  scores: Record<string, number | null>;

  // Backward compatibility with older result records.
  ca1: number | null;
  ca2: number | null;
  assignment: number | null;
  exam: number | null;

  total: number;
  grade: string;
  remark: string;
  status?: string;
};

const LEGACY_COMPONENTS: AssessmentComponent[] = [
  { key: "ca1", label: "CA 1", maxScore: 10 },
  { key: "ca2", label: "CA 2", maxScore: 10 },
  { key: "assignment", label: "Assignment", maxScore: 10 },
  { key: "exam", label: "Exam", maxScore: 70 },
];

const PSYCHOMOTOR_TRAITS = [
  { key: "handwriting", name: "Handwriting" },
  { key: "creativity", name: "Drawing and creativity" },
  { key: "coordination", name: "Hand-eye coordination" },
  { key: "practicalSkills", name: "Practical skills" },
  { key: "sports", name: "Sports and physical activities" },
] as const;

const AFFECTIVE_TRAITS = [
  { key: "punctuality", name: "Punctuality" },
  { key: "honesty", name: "Honesty" },
  { key: "cooperation", name: "Cooperation" },
  { key: "respect", name: "Respect for others" },
  { key: "responsibility", name: "Responsibility" },
  { key: "selfControl", name: "Self-control" },
  { key: "initiative", name: "Initiative" },
] as const;

const TRAIT_RATINGS = [
  { value: 5, label: "5 - Excellent" },
  { value: 4, label: "4 - Very Good" },
  { value: 3, label: "3 - Good" },
  { value: 2, label: "2 - Fair" },
  { value: 1, label: "1 - Needs Improvement" },
];

function emptyTraitDraft(): StudentTraitDraft {
  return {
    psychomotor: [],
    affective: [],
    teacherComment: "",
  };
}

function emptyStudentScores(
  components: AssessmentComponent[]
): Record<string, number | null> {
  return Object.fromEntries(
    components.map((component) => [component.key, null])
  );
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/* =========================================
   SCORE CALCULATION
========================================= */

function calculateStudentResult(
  scores: Record<string, number | null>,
  components: AssessmentComponent[]
) {
  let total = 0;
  let hasAnyScore = false;

  for (const component of components) {
    const value = scores[component.key];

    if (value === null || value === undefined) continue;

    total += value;
    hasAnyScore = true;
  }

  if (!hasAnyScore) {
    return { total: 0, grade: "", remark: "" };
  }

  // Preview only. The backend remains authoritative for saved grades.
  let grade = "F";
  let remark = "Fail";

  if (total >= 70) {
    grade = "A";
    remark = "Excellent";
  } else if (total >= 60) {
    grade = "B";
    remark = "Very Good";
  } else if (total >= 50) {
    grade = "C";
    remark = "Good";
  } else if (total >= 45) {
    grade = "D";
    remark = "Fair";
  } else if (total >= 40) {
    grade = "E";
    remark = "Pass";
  }

  return { total, grade, remark };
}

function normalizeScoresForScheme(
  existingScores: Record<string, unknown>,
  components: AssessmentComponent[]
): Record<string, number | null> {
  const next = emptyStudentScores(components);

  for (const component of components) {
    next[component.key] = toNumberOrNull(
      existingScores[component.key]
    );
  }

  return next;
}

function getLegacyFields(
  scores: Record<string, number | null>
) {
  return {
    ca1: scores.ca1 ?? null,
    ca2: scores.ca2 ?? null,
    assignment: scores.assignment ?? null,
    exam: scores.exam ?? null,
  };
}

/* =========================================
   PAGE
========================================= */

export default function ResultEntryPage() {
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [schemeLoading, setSchemeLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

  const [context, setContext] = useState<any>(null);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [assessmentScheme, setAssessmentScheme] =
    useState<AssessmentScheme | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const studentsRef = useRef<StudentRow[]>([]);

  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const [traitAssessments, setTraitAssessments] =
    useState<Record<string, StudentTraitDraft>>({});
  const [traitsLoading, setTraitsLoading] = useState(false);
  const [savingTraitStudent, setSavingTraitStudent] =
    useState<string | null>(null);
  const [traitError, setTraitError] = useState("");
  const [traitMessage, setTraitMessage] = useState("");

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingLock = useRef(false);

  const components = useMemo(
    () =>
      assessmentScheme?.components?.filter(
        (component) => component.enabled !== false
      ) ?? LEGACY_COMPONENTS,
    [assessmentScheme]
  );

  const totalMax = useMemo(
    () => components.reduce((sum, component) => sum + component.maxScore, 0),
    [components]
  );

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  const cancelAutosave = useCallback(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
  }, []);

  useEffect(() => cancelAutosave, [cancelAutosave]);

  /* =========================================
     LOAD TEACHER CONTEXT
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        setLoading(true);
        setPageError("");

        const data = await getTeacherResultContext();

        if (cancelled) return;

        setContext(data);
        setClassId(data?.classes?.[0]?._id || "");
        setSubjectId(data?.subjects?.[0]?._id || "");
        setSessionId(data?.sessions?.[0]?._id || "");
        setTermId(data?.terms?.[0]?._id || "");
      } catch (error) {
        if (!cancelled) {
          setPageError(
            axios.isAxiosError(error)
              ? error.response?.data?.message ||
                  "Failed to load teacher context."
              : "Failed to load teacher context."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================
     LOAD SCHEME FOR SELECTED CLASS
  ========================================= */

  useEffect(() => {
    if (!classId) {
      setAssessmentScheme(null);
      return;
    }

    let cancelled = false;

    async function loadScheme() {
      try {
        setSchemeLoading(true);
        setPageError("");

        const scheme = await getClassAssessmentScheme(classId);

        if (cancelled) return;

        setAssessmentScheme(scheme);

        if (
          scheme?.components?.length &&
          Math.abs(
            scheme.components
              .filter((component) => component.enabled !== false)
              .reduce((sum, component) => sum + component.maxScore, 0) -
              100
          ) > 0.001
        ) {
          setPageError(
            "The configured assessment components do not total 100. Please ask your school administrator to correct the scheme."
          );
        }
      } catch (error) {
        if (cancelled) return;

        setPageError(
          axios.isAxiosError(error)
            ? error.response?.data?.message ||
                "Failed to load the assessment scheme."
            : "Failed to load the assessment scheme."
        );
      } finally {
        if (!cancelled) setSchemeLoading(false);
      }
    }

    void loadScheme();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  /* =========================================
     LOAD STUDENTS AND EXISTING RESULTS
  ========================================= */

  useEffect(() => {
    if (!classId || !subjectId || !sessionId || !termId) {
      setStudents([]);
      return;
    }

    let cancelled = false;

    async function loadStudentsAndResults() {
      try {
        setStudentsLoading(true);
        setPageError("");
        setPageMessage("");

        const [studentResponse, existingResults] = await Promise.all([
          getClassStudentsForResultEntry(classId),
          getResults({ classId, subjectId, sessionId, termId }),
        ]);

        if (cancelled) return;

        const studentList = studentResponse?.students || [];
        const resultList = Array.isArray(existingResults)
          ? existingResults
          : [];

        const byStudent = new Map<string, any>();

        for (const result of resultList) {
          const id =
            typeof result.studentId === "object"
              ? result.studentId?._id
              : result.studentId;

          if (id) byStudent.set(String(id), result);
        }

        const mapped: StudentRow[] = studentList.map((student: any) => {
          const studentId = String(student._id);
          const result = byStudent.get(studentId);

          const savedScores =
            result?.scores && typeof result.scores === "object"
              ? result.scores
              : {
                  ca1: result?.ca1,
                  ca2: result?.ca2,
                  assignment: result?.assignment,
                  exam: result?.exam,
                };

          const scores = normalizeScoresForScheme(
            savedScores,
            components
          );

          const computed = calculateStudentResult(scores, components);

          return {
            studentId,
            firstName: student.firstName || "",
            lastName: student.lastName || "",
            fullName:
              student.fullName ||
              `${student.firstName || ""} ${student.lastName || ""}`.trim(),
            admissionNumber: student.admissionNumber || "",
            gender: student.gender || "",
            attendanceStatus: student.attendanceStatus || "present",

            scores,
            ...getLegacyFields(scores),

            total: result?.total ?? computed.total,
            grade: result?.grade ?? computed.grade,
            remark: result?.remark ?? computed.remark,
            status: result?.status || "draft",
          };
        });

        setStudents(mapped);
        setPublished(
          mapped.some((student) => student.status === "published")
        );
      } catch (error) {
        if (!cancelled) {
          setPageError(
            axios.isAxiosError(error)
              ? error.response?.data?.message ||
                  "Failed to load students and saved results."
              : "Failed to load students and saved results."
          );
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }

    void loadStudentsAndResults();

    return () => {
      cancelled = true;
    };
  }, [classId, subjectId, sessionId, termId, components]);

  /* =========================================
     LOAD TRAIT ASSESSMENTS
  ========================================= */

  useEffect(() => {
    if (!classId || !sessionId || !termId) {
      setTraitAssessments({});
      return;
    }

    let cancelled = false;

    async function loadTraits() {
      try {
        setTraitsLoading(true);
        setTraitError("");

        const records = await getClassTraitAssessments({
          classId,
          sessionId,
          termId,
        });

        if (cancelled) return;

        const mapped: Record<string, StudentTraitDraft> = {};

        records.forEach((record: ClassStudentTraitAssessment) => {
          if (!record.student?._id) return;

          mapped[record.student._id] = {
            psychomotor: record.assessment?.psychomotor ?? [],
            affective: record.assessment?.affective ?? [],
            teacherComment: record.assessment?.teacherComment ?? "",
          };
        });

        setTraitAssessments(mapped);
      } catch (error) {
        if (!cancelled) {
          setTraitError(
            axios.isAxiosError(error)
              ? error.response?.data?.message ||
                  "Unable to load trait assessments."
              : "Unable to load trait assessments."
          );
        }
      } finally {
        if (!cancelled) setTraitsLoading(false);
      }
    }

    void loadTraits();

    return () => {
      cancelled = true;
    };
  }, [classId, sessionId, termId]);

  /* =========================================
     SCORE UPDATES
  ========================================= */

  function updateScore(
    studentId: string,
    component: AssessmentComponent,
    rawValue: string
  ) {
    const value = rawValue === "" ? null : Number(rawValue);

    if (
      value !== null &&
      (!Number.isFinite(value) ||
        value < 0 ||
        value > component.maxScore)
    ) {
      setPageError(
        `${component.label} must be between 0 and ${component.maxScore}.`
      );
      return;
    }

    setPageError("");
    setPageMessage("");

    setStudents((previous) =>
      previous.map((student) => {
        if (student.studentId !== studentId) return student;

        const scores = {
          ...student.scores,
          [component.key]: value,
        };

        const computed = calculateStudentResult(scores, components);

        return {
          ...student,
          scores,
          ...getLegacyFields(scores),
          ...computed,
        };
      })
    );

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      void saveDraft(false);
    }, 1200);
  }

  /* =========================================
     SAVE RESULTS
  ========================================= */

  async function saveDraft(showMessage = true) {
    if (savingLock.current) return;

    if (!classId || !subjectId || !sessionId || !termId) {
      setPageError("Select a class, subject, session, and term first.");
      return;
    }

    const snapshot = studentsRef.current.map((student) => ({ ...student }));

    savingLock.current = true;
    setSaving(true);
    setPageError("");

    try {
      await bulkUpsertResults({
        classId,
        subjectId,
        sessionId,
        termId,
        results: snapshot.map((student) => ({
          studentId: student.studentId,
          scores: student.scores,
          // Preserve legacy clients and integrations.
          ca1: student.ca1,
          ca2: student.ca2,
          assignment: student.assignment,
          exam: student.exam,
        })),
      });

      if (showMessage) {
        setPageMessage("Results saved successfully.");
      }
    } catch (error) {
      setPageError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to save results."
          : "Failed to save results."
      );
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (savingLock.current) return;

    if (!classId || !subjectId || !sessionId || !termId) {
      setPageError("Select a class, subject, session, and term first.");
      return;
    }

    if (
      !window.confirm(
        "Save and publish results for the selected class, subject, session, and term?"
      )
    ) {
      return;
    }

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    savingLock.current = true;
    setSaving(true);
    setPageError("");
    setPageMessage("");

    try {
      const snapshot = studentsRef.current.map((student) => ({ ...student }));

      await bulkUpsertResults({
        classId,
        subjectId,
        sessionId,
        termId,
        results: snapshot.map((student) => ({
          studentId: student.studentId,
          scores: student.scores,
          ca1: student.ca1,
          ca2: student.ca2,
          assignment: student.assignment,
          exam: student.exam,
        })),
      });

      await publishResults({
        classId,
        subjectId,
        sessionId,
        termId,
      });

      setPublished(true);
      setPageMessage("Publish request completed.");
    } catch (error) {
      setPageError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to publish results."
          : "Failed to publish results."
      );
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }

  /* =========================================
     TRAIT ASSESSMENTS
  ========================================= */

  function updateTrait(
    studentId: string,
    group: "psychomotor" | "affective",
    traitKey: string,
    traitName: string,
    rating: number | null
  ) {
    setTraitAssessments((previous) => {
      const current = previous[studentId] ?? emptyTraitDraft();
      const updated = current[group].filter(
        (trait) => trait.traitKey !== traitKey
      );

      if (rating !== null) updated.push({ traitKey, traitName, rating });

      return {
        ...previous,
        [studentId]: { ...current, [group]: updated },
      };
    });

    setTraitError("");
    setTraitMessage("");
  }

  function updateTraitComment(studentId: string, teacherComment: string) {
    setTraitAssessments((previous) => ({
      ...previous,
      [studentId]: {
        ...(previous[studentId] ?? emptyTraitDraft()),
        teacherComment,
      },
    }));
  }

  async function saveTraits(studentId: string) {
    if (!classId || !sessionId || !termId) {
      setTraitError("Select a class, session, and term first.");
      return;
    }

    const draft = traitAssessments[studentId] ?? emptyTraitDraft();

    try {
      setSavingTraitStudent(studentId);
      setTraitError("");
      setTraitMessage("");

      await saveStudentTraitAssessment(studentId, {
        classId,
        sessionId,
        termId,
        psychomotor: draft.psychomotor,
        affective: draft.affective,
        teacherComment: draft.teacherComment,
      });

      setTraitMessage("Trait assessment saved successfully.");
    } catch (error) {
      setTraitError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
              "Failed to save trait assessment."
          : "Failed to save trait assessment."
      );
    } finally {
      setSavingTraitStudent(null);
    }
  }

  /* =========================================
     FILTER
  ========================================= */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(query) ||
        (student.admissionNumber || "").toLowerCase().includes(query)
    );
  }, [students, search]);

  /* =========================================
     LOADING / EMPTY STATES
  ========================================= */

  if (loading) return <PageLoader />;

  if (!context) {
    return (
      <EmptyState
        title="No teacher context"
        description="The teacher is not assigned to any class or subject."
      />
    );
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-6">
      <SectionCard
        title="Result Entry Engine"
        subtitle="Dynamic assessments, live totals, autosave and publishing"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-400">Class</label>
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            >
              <option value="">Select class</option>
              {context?.classes?.map((item: any) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">Subject</label>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            >
              <option value="">Select subject</option>
              {context?.subjects?.map((item: any) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">Session</label>
            <select
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            >
              <option value="">Select session</option>
              {context?.sessions?.map((item: any) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">Term</label>
            <select
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            >
              <option value="">Select term</option>
              {context?.terms?.map((item: any) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
            Students: <strong className="text-white">{students.length}</strong>
          </span>

          <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
            {saving ? "Saving…" : "Ready"}
          </span>

          {published && (
            <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
              Publish request completed
            </span>
          )}

          {schemeLoading && (
            <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-sm text-yellow-200">
              Loading assessment scheme…
            </span>
          )}
        </div>
      </SectionCard>

      {pageError && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {pageError}
        </div>
      )}

      {pageMessage && (
        <div role="status" className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
          {pageMessage}
        </div>
      )}

      <SectionCard
        title="Assessment Structure"
        subtitle={assessmentScheme?.name || "School default assessment scheme"}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {components.map((component) => (
            <div key={component.key} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {component.label}
              </div>
              <div className="mt-1 text-xl font-bold text-white">
                {component.maxScore}
              </div>
              <div className="text-xs text-slate-500">maximum marks</div>
            </div>
          ))}

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <div className="text-xs uppercase tracking-wide text-cyan-200">Total</div>
            <div className="mt-1 text-xl font-bold text-white">{totalMax}</div>
            <div className="text-xs text-cyan-100/70">maximum marks</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Student Results"
        subtitle="Enter marks for each configured assessment component"
      >
        <div className="mb-5 max-w-md">
          <FormInput
            label="Search students"
            name="search"
            value={search}
            placeholder="Search name or admission number…"
            onChange={setSearch}
          />
        </div>

        {studentsLoading || schemeLoading ? (
          <PageLoader />
        ) : !classId || !subjectId || !sessionId || !termId ? (
          <EmptyState
            title="Select the academic period"
            description="Choose a class, subject, session and term to load students."
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No students match your search or the selected class has no students."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-3xl border border-white/10">
              <table className="min-w-full">
                <thead className="bg-slate-900">
                  <tr className="text-left text-sm text-slate-300">
                    <th className="p-4">Student</th>
                    <th className="p-4">Admission No.</th>
                    {components.map((component) => (
                      <th key={component.key} className="p-4">
                        {component.label}
                        <span className="ml-1 text-xs text-slate-500">
                          /{component.maxScore}
                        </span>
                      </th>
                    ))}
                    <th className="p-4">Total / {totalMax}</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Remark</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="p-4">
                        <div className="font-semibold text-white">{student.fullName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {student.gender || "—"} · {student.attendanceStatus || "—"}
                        </div>
                      </td>

                      <td className="p-4 text-slate-300">
                        {student.admissionNumber || "—"}
                      </td>

                      {components.map((component) => {
                        const value = student.scores[component.key];

                        return (
                          <td key={component.key} className="p-4">
                            <input
                              type="number"
                              min={0}
                              max={component.maxScore}
                              step="0.5"
                              value={value ?? ""}
                              placeholder="—"
                              aria-label={`${student.fullName} ${component.label}`}
                              onChange={(event) =>
                                updateScore(
                                  student.studentId,
                                  component,
                                  event.target.value
                                )
                              }
                              className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </td>
                        );
                      })}

                      <td className="p-4 font-bold text-cyan-300">
                        {Object.values(student.scores).some((score) => score !== null)
                          ? student.total
                          : "—"}
                      </td>
                      <td className="p-4 font-bold text-yellow-300">
                        {student.grade || "—"}
                      </td>
                      <td className="p-4 text-slate-300">
                        {student.remark || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void saveDraft(true)}
                disabled={saving}
                className="rounded-2xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
              >
                <Save size={16} className="mr-2 inline" />
                {saving ? "Saving…" : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={saving || students.length === 0}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
              >
                <UploadCloud size={16} className="mr-2 inline" />
                Publish Results
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                disabled={saving}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
              >
                <RefreshCw size={16} className="mr-2 inline" />
                Reload
              </button>
            </div>
          </>
        )}
      </SectionCard>

      {/* =========================================
          PSYCHOMOTOR AND AFFECTIVE TRAITS
      ========================================= */}

      <SectionCard
        title="Psychomotor & Affective Traits"
        subtitle="Assess each student for the selected academic period"
      >
        {traitsLoading ? (
          <PageLoader />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students available"
            description="Load students before entering trait assessments."
          />
        ) : (
          <div className="space-y-4">
            {traitError && (
              <div role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                {traitError}
              </div>
            )}
            {traitMessage && (
              <div role="status" className="rounded-xl bg-green-500/10 p-3 text-sm text-green-300">
                {traitMessage}
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
              Ratings: 5 = Excellent, 4 = Very Good, 3 = Good, 2 = Fair, 1 = Needs Improvement.
            </div>

            {students.map((student) => {
              const draft =
                traitAssessments[student.studentId] ?? emptyTraitDraft();

              const renderTraitGroup = (
                title: string,
                group: "psychomotor" | "affective",
                traits: readonly { key: string; name: string }[]
              ) => (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">{title}</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {traits.map((trait) => {
                      const selected = draft[group].find(
                        (item) => item.traitKey === trait.key
                      );

                      return (
                        <div key={trait.key} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                          <label className="mb-2 block text-sm text-slate-300">
                            {trait.name}
                          </label>
                          <select
                            value={selected?.rating ?? ""}
                            onChange={(event) => {
                              const raw = event.target.value;
                              updateTrait(
                                student.studentId,
                                group,
                                trait.key,
                                trait.name,
                                raw === "" ? null : Number(raw)
                              );
                            }}
                            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                          >
                            <option value="">Select rating</option>
                            {TRAIT_RATINGS.map((rating) => (
                              <option key={rating.value} value={rating.value}>
                                {rating.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

              return (
                <details key={student.studentId} className="group rounded-2xl border border-white/10 bg-slate-950/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                    <div>
                      <div className="font-semibold text-white">{student.fullName}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {student.admissionNumber || "No admission number"}
                      </div>
                    </div>
                    <span className="text-sm text-cyan-300">Assess traits</span>
                  </summary>

                  <div className="space-y-6 border-t border-white/10 p-4">
                    {renderTraitGroup("Psychomotor Traits", "psychomotor", PSYCHOMOTOR_TRAITS)}
                    {renderTraitGroup("Affective Traits", "affective", AFFECTIVE_TRAITS)}

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Teacher's Comment
                      </label>
                      <textarea
                        value={draft.teacherComment}
                        onChange={(event) =>
                          updateTraitComment(student.studentId, event.target.value)
                        }
                        rows={3}
                        placeholder="Enter an optional comment…"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void saveTraits(student.studentId)}
                        disabled={savingTraitStudent === student.studentId}
                        className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
                      >
                        <Save size={16} className="mr-2 inline" />
                        {savingTraitStudent === student.studentId
                          ? "Saving assessment…"
                          : "Save Trait Assessment"}
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
