"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import SectionCard from "../../../../../components/ui/SectionCard";
import PageLoader from "../../../../../components/ui/PageLoader";
import EmptyState from "../../../../../components/ui/EmptyState";
import FormInput from "../../../../../components/ui/FormInput";

import {
  bulkUpsertResults,
  getClassStudentsForResultEntry,
  getTeacherResultContext,
  publishResults,
} from "../../../../../lib/results";


import {
  getClassTraitAssessments,
  saveStudentTraitAssessment,
  type TraitRating,
  type ClassStudentTraitAssessment,
} from "../../../../../lib/trait-assessments";

import {
  Save,
  Search,
  UploadCloud,
} from "lucide-react";

/* =========================================
   SCORE LIMITS
========================================= */

const SCORE_LIMITS = {
  ca1: 10,
  ca2: 10,
  assignment: 10,
  exam: 70,
} as const;

type ScoreField = keyof typeof SCORE_LIMITS;

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

type StudentTraitDraft = {
  psychomotor: TraitRating[];
  affective: TraitRating[];
  teacherComment: string;
};

function emptyTraitDraft(): StudentTraitDraft {
  return {
    psychomotor: [],
    affective: [],
    teacherComment: "",
  };
}

/* =========================================
   STUDENT TYPE
========================================= */

type StudentRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  admissionNumber?: string;
  gender?: string;
  attendanceStatus?: string;

  ca1: number | null;
  ca2: number | null;
  assignment: number | null;
  exam: number | null;

  total: number;
  grade: string;
  remark: string;
};

/* =========================================
   RESULT CALCULATION
========================================= */

function computeResult(
  row: Partial<StudentRow>
) {
  const ca1 = row.ca1 ?? 0;
  const ca2 = row.ca2 ?? 0;
  const assignment = row.assignment ?? 0;
  const exam = row.exam ?? 0;

  const total =
    ca1 +
    ca2 +
    assignment +
    exam;

  const hasAnyScore =
    row.ca1 !== null &&
    row.ca1 !== undefined ||
    row.ca2 !== null &&
    row.ca2 !== undefined ||
    row.assignment !== null &&
    row.assignment !== undefined ||
    row.exam !== null &&
    row.exam !== undefined;

  /*
   * Completely blank result:
   * no automatic F / Fail.
   */
  if (!hasAnyScore) {
    return {
      total: 0,
      grade: "",
      remark: "",
    };
  }

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

  return {
    total,
    grade,
    remark,
  };
}

/* =========================================
   PAGE
========================================= */

export default function ResultEntryPage() {
  const [loading, setLoading] =
    useState(true);

  const [studentsLoading, setStudentsLoading] =
    useState(false);

  const [context, setContext] =
    useState<any>(null);

  const [classId, setClassId] =
    useState("");

  const [subjectId, setSubjectId] =
    useState("");

  const [sessionId, setSessionId] =
    useState("");

  const [termId, setTermId] =
    useState("");

  const [students, setStudents] =
    useState<StudentRow[]>([]);

  const studentsRef =
    useRef<StudentRow[]>([]);

  const [search, setSearch] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [published, setPublished] =
    useState(false);

  const [pageError, setPageError] =
    useState("");
  const [traitAssessments, setTraitAssessments] =
  useState<Record<string, StudentTraitDraft>>({});

const [traitsLoading, setTraitsLoading] =
  useState(false);

const [savingTraitStudent, setSavingTraitStudent] =
  useState<string | null>(null);

const [traitError, setTraitError] =
  useState("");

const [traitMessage, setTraitMessage] =
  useState("");
  const autosaveTimer =
    useRef<NodeJS.Timeout | null>(null);

  const savingLock =
    useRef(false);

  /* =========================================
     KEEP LATEST STUDENT DATA
  ========================================= */

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  /* =========================================
     LOAD TEACHER CONTEXT
  ========================================= */

  useEffect(() => {
    async function loadContext() {
      try {
        setLoading(true);
        setPageError("");

        const data =
          await getTeacherResultContext();

        setContext(data);

        setClassId(
          data?.classes?.[0]?._id || ""
        );

        setSubjectId(
          data?.subjects?.[0]?._id || ""
        );

        setSessionId(
          data?.sessions?.[0]?._id || ""
        );

        setTermId(
          data?.terms?.[0]?._id || ""
        );
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setPageError(
            err.response?.data?.message ||
              "Failed to load teacher context."
          );
        } else {
          setPageError(
            "Failed to load teacher context."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, []);
  

  /* =========================================
     LOAD STUDENTS
  ========================================= */

  useEffect(() => {
    if (!classId) return;

    async function loadStudents() {
      try {
        setStudentsLoading(true);

        const response =
          await getClassStudentsForResultEntry(
            classId
          );

        const studentList =
          response?.students || [];

        const mapped: StudentRow[] =
          studentList.map(
            (student: any) => ({
              studentId: student._id,

              firstName:
                student.firstName || "",

              lastName:
                student.lastName || "",

              fullName:
                student.fullName ||
                `${student.firstName || ""} ${
                  student.lastName || ""
                }`.trim(),

              admissionNumber:
                student.admissionNumber || "",

              gender:
                student.gender || "",

              attendanceStatus:
                student.attendanceStatus ||
                "present",

              /*
               * IMPORTANT:
               * Empty scores are NULL,
               * not zero.
               */
              ca1: null,
              ca2: null,
              assignment: null,
              exam: null,

              total: 0,
              grade: "",
              remark: "",
            })
          );

        setStudents(mapped);
      } finally {
        setStudentsLoading(false);
      }
    }

    loadStudents();
  }, [classId]);

  /* =========================================
   LOAD PSYCHOMOTOR & AFFECTIVE ASSESSMENTS
========================================= */

useEffect(() => {
  if (!classId || !sessionId || !termId) {
    setTraitAssessments({});
    return;
  }

  let cancelled = false;

  async function loadTraitAssessments() {
    try {
      setTraitsLoading(true);
      setTraitError("");
      setTraitMessage("");

      const records = await getClassTraitAssessments({
        classId,
        sessionId,
        termId,
      });

      if (cancelled) return;

      const mapped: Record<string, StudentTraitDraft> = {};

      records.forEach(
        (record: ClassStudentTraitAssessment) => {
          if (!record.student?._id) return;

          mapped[record.student._id] = {
            psychomotor:
              record.assessment?.psychomotor ?? [],
            affective:
              record.assessment?.affective ?? [],
            teacherComment:
              record.assessment?.teacherComment ?? "",
          };
        }
      );

      setTraitAssessments(mapped);
    } catch (err) {
      if (cancelled) return;

      setTraitError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Unable to load trait assessments."
          : "Unable to load trait assessments."
      );
    } finally {
      if (!cancelled) {
        setTraitsLoading(false);
      }
    }
  }

  loadTraitAssessments();

  return () => {
    cancelled = true;
  };
}, [classId, sessionId, termId]);

  /* =========================================
   UPDATE TRAIT RATINGS
========================================= */

function updateTrait(
  studentId: string,
  group: "psychomotor" | "affective",
  traitKey: string,
  traitName: string,
  rating: number | null
) {
  setTraitAssessments((previous) => {
    const current =
      previous[studentId] ?? emptyTraitDraft();

    const updatedGroup = current[group].filter(
      (trait) => trait.traitKey !== traitKey
    );

    if (rating !== null) {
      updatedGroup.push({
        traitKey,
        traitName,
        rating,
      });
    }

    return {
      ...previous,
      [studentId]: {
        ...current,
        [group]: updatedGroup,
      },
    };
  });

  setTraitError("");
  setTraitMessage("");
}

function updateTraitComment(
  studentId: string,
  teacherComment: string
) {
  setTraitAssessments((previous) => ({
    ...previous,
    [studentId]: {
      ...(previous[studentId] ?? emptyTraitDraft()),
      teacherComment,
    },
  }));

  setTraitError("");
  setTraitMessage("");
}

/* =========================================
   SAVE ONE STUDENT'S TRAITS
========================================= */

async function saveTraits(studentId: string) {
  if (!classId || !sessionId || !termId) {
    setTraitError(
      "Select a class, session, and term first."
    );
    return;
  }

  const draft =
    traitAssessments[studentId] ?? emptyTraitDraft();

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

    setTraitMessage(
      "Trait assessment saved successfully."
    );
  } catch (err) {
    setTraitError(
      axios.isAxiosError(err)
        ? err.response?.data?.message ||
            "Failed to save trait assessment."
        : "Failed to save trait assessment."
    );
  } finally {
    setSavingTraitStudent(null);
  }
}

  /* =========================================
     FILTER STUDENTS
  ========================================= */

  const filteredStudents =
    useMemo(() => {
      if (!search.trim()) {
        return students;
      }

      const q =
        search.toLowerCase();

      return students.filter(
        (student) =>
          student.fullName
            .toLowerCase()
            .includes(q) ||
          (
            student.admissionNumber || ""
          )
            .toLowerCase()
            .includes(q)
      );
    }, [students, search]);

  /* =========================================
     UPDATE SCORE
  ========================================= */

  function updateScore(
    studentId: string,
    field: ScoreField,
    value: number | null
  ) {
    const max =
      SCORE_LIMITS[field];

    let safeValue =
      value;

    if (
      safeValue !== null &&
      Number.isFinite(safeValue)
    ) {
      safeValue = Math.min(
        Math.max(safeValue, 0),
        max
      );
    }

    setStudents((prev) =>
      prev.map((student) => {
        if (
          student.studentId !==
          studentId
        ) {
          return student;
        }

        const updated = {
          ...student,
          [field]: safeValue,
        };

        const computed =
          computeResult(updated);

        return {
          ...updated,
          total: computed.total,
          grade: computed.grade,
          remark: computed.remark,
        };
      })
    );

    triggerAutosave();
  }

  /* =========================================
     AUTOSAVE
  ========================================= */
 /* =========================================
   AUTOSAVE AND MANUAL SAVE
========================================= */

function clearScoreInputs() {
  if (autosaveTimer.current) {
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = null;
  }

  const cleared = studentsRef.current.map((student) => ({
    ...student,
    ca1: null,
    ca2: null,
    assignment: null,
    exam: null,
    total: 0,
    grade: "",
    remark: "",
  }));

  // Update the ref immediately to prevent stale scores
  // from being used by another save.
  studentsRef.current = cleared;
  setStudents(cleared);
  setPublished(false);
}

function triggerAutosave() {
  if (autosaveTimer.current) {
    clearTimeout(autosaveTimer.current);
  }

  autosaveTimer.current = setTimeout(() => {
    void saveDraft(false);
  }, 1200);
}

async function saveDraft(clearAfterSave = false) {
  if (savingLock.current) {
    return;
  }

  if (!classId || !subjectId || !sessionId || !termId) {
    setPageError(
      "Select a class, subject, session, and term first."
    );
    return;
  }

  // Save a snapshot so the request uses the scores
  // present when the save began.
  const resultsToSave = studentsRef.current.map(
    (student) => ({ ...student })
  );

  savingLock.current = true;
  setSaving(true);
  setPageError("");

  try {
    await bulkUpsertResults({
      classId,
      subjectId,
      sessionId,
      termId,
      results: resultsToSave,
    });

    if (clearAfterSave) {
      clearScoreInputs();
    }
  } catch (err) {
    setPageError(
      axios.isAxiosError(err)
        ? err.response?.data?.message ||
            "Failed to save results."
        : "Failed to save results."
    );

    console.error("bulk-upsert failed:", err);
  } finally {
    savingLock.current = false;
    setSaving(false);
  }
}
    /* =========================================
     PUBLISH
  ========================================= */

 /* =========================================
   PUBLISH
========================================= */

async function handlePublish() {
  if (!classId || !subjectId || !sessionId || !termId) {
    setPageError(
      "Select a class, subject, session, and term first."
    );
    return;
  }

  if (savingLock.current) {
    return;
  }

  if (autosaveTimer.current) {
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = null;
  }

  savingLock.current = true;
  setSaving(true);
  setPageError("");

  try {
    await bulkUpsertResults({
      classId,
      subjectId,
      sessionId,
      termId,
      results: studentsRef.current.map(
        (student) => ({ ...student })
      ),
    });

    await publishResults({
      classId,
      subjectId,
      sessionId,
      termId,
    });

    clearScoreInputs();
    setPublished(true);
  } catch (err) {
    setPageError(
      axios.isAxiosError(err)
        ? err.response?.data?.message ||
            "Failed to publish results."
        : "Failed to publish results."
    );

    console.error("Publish results failed:", err);
  } finally {
    savingLock.current = false;
    setSaving(false);
  }
}

  /* =========================================
     STATES
  ========================================= */

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load result system"
        description={pageError}
      />
    );
  }

  if (!context) {
    return (
      <EmptyState
        title="No teacher context"
        description="Teacher is not assigned to any subject or class."
      />
    );
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-6">

      {/* =====================================
          HEADER / CONTEXT
      ===================================== */}

      <SectionCard
        title="Result Entry Engine"
        subtitle="Live grading • autosave • smart publishing"
      >
        <div className="grid gap-4 md:grid-cols-4">

          {/* CLASS */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Class
            </label>

            <select
              value={classId}
              onChange={(e) =>
                setClassId(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">
                Select Class
              </option>

              {context?.classes?.map(
                (item: any) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SUBJECT */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Subject
            </label>

            <select
              value={subjectId}
              onChange={(e) =>
                setSubjectId(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">
                Select Subject
              </option>

              {context?.subjects?.map(
                (item: any) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SESSION */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Session
            </label>

            <select
              value={sessionId}
              onChange={(e) =>
                setSessionId(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">
                Select Session
              </option>

              {context?.sessions?.map(
                (item: any) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* TERM */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Term
            </label>

            <select
              value={termId}
              onChange={(e) =>
                setTermId(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">
                Select Term
              </option>

              {context?.terms?.map(
                (item: any) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* STATUS */}
        <div className="mt-5 flex flex-wrap gap-3">

          <div className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
            Students:
            <span className="ml-2 font-bold text-white">
              {students.length}
            </span>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm ${
              saving
                ? "bg-yellow-500/20 text-yellow-300"
                : "bg-green-500/20 text-green-300"
            }`}
          >
            {saving
              ? "Saving..."
              : "Saved"}
          </div>

          {published && (
            <div className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
              Results Published ✔
            </div>
          )}
        </div>
      </SectionCard>

      {/* =====================================
          SCORE STRUCTURE
      ===================================== */}

      <SectionCard
        title="Assessment Structure"
        subtitle="Maximum scores for this result entry"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

          {[
            ["CA1", 10],
            ["CA2", 10],
            ["Assignment", 10],
            ["Exam", 70],
            ["Total", 100],
          ].map(
            ([label, score]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {label}
                </div>

                <div className="mt-1 text-xl font-bold text-white">
                  {score}
                </div>
              </div>
            )
          )}
        </div>
      </SectionCard>

      {/* =====================================
          STUDENTS
      ===================================== */}

      <SectionCard
        title="Student Results"
        subtitle="Enter scores for all students in selected class"
      >

        {/* SEARCH */}
        <div className="mb-5 max-w-md">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-11 text-slate-400"
            />

            <div className="[&_input]:pl-11">
              <FormInput
                label="Search Students"
                name="search"
                value={search}
                placeholder="Search by name or admission number..."
                onChange={setSearch}
              />
            </div>
          </div>
          {/* =====================================
    PSYCHOMOTOR & AFFECTIVE TRAITS
===================================== */}

<SectionCard
  title="Psychomotor & Affective Traits"
  subtitle="Assess each student for the selected academic period"
>
  {!classId || !sessionId || !termId ? (
    <EmptyState
      title="Select the academic period"
      description="Choose a class, session, and term to assess students."
    />
  ) : traitsLoading ? (
    <PageLoader />
  ) : students.length === 0 ? (
    <EmptyState
      title="No students available"
      description="Load the class students before entering trait assessments."
    />
  ) : (
    <div className="space-y-4">
      {traitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {traitError}
        </div>
      )}

      {traitMessage && (
        <div
          role="status"
          className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300"
        >
          {traitMessage}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
        Ratings: 5 = Excellent, 4 = Very Good, 3 = Good,
        2 = Fair, 1 = Needs Improvement.
      </div>

      {students.map((student) => {
        const draft =
          traitAssessments[student.studentId] ??
          emptyTraitDraft();

        function renderTraitGroup(
          title: string,
          group: "psychomotor" | "affective",
          traits: readonly { key: string; name: string }[]
        ) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">
                {title}
              </h4>

              <div className="grid gap-3 md:grid-cols-2">
                {traits.map((trait) => {
                  const selected = draft[group].find(
                    (item) => item.traitKey === trait.key
                  );

                  return (
                    <div
                      key={trait.key}
                      className="rounded-xl border border-white/10 bg-slate-950/50 p-3"
                    >
                      <label
                        htmlFor={`${student.studentId}-${trait.key}`}
                        className="mb-2 block text-sm text-slate-300"
                      >
                        {trait.name}
                      </label>

                      <select
                        id={`${student.studentId}-${trait.key}`}
                        value={selected?.rating ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;

                          updateTrait(
                            student.studentId,
                            group,
                            trait.key,
                            trait.name,
                            value === "" ? null : Number(value)
                          );
                        }}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500"
                      >
                        <option value="">
                          Select rating
                        </option>

                        {TRAIT_RATINGS.map((rating) => (
                          <option
                            key={rating.value}
                            value={rating.value}
                          >
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
        }

        return (
          <details
            key={student.studentId}
            className="group rounded-2xl border border-white/10 bg-slate-950/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
              <div>
                <div className="font-semibold text-white">
                  {student.fullName}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {student.admissionNumber || "No admission number"}
                </div>
              </div>

              <span className="text-sm text-cyan-300">
                Assess traits
              </span>
            </summary>

            <div className="space-y-6 border-t border-white/10 p-4">
              {renderTraitGroup(
                "Psychomotor Traits",
                "psychomotor",
                PSYCHOMOTOR_TRAITS
              )}

              {renderTraitGroup(
                "Affective Traits",
                "affective",
                AFFECTIVE_TRAITS
              )}

              <div>
                <label
                  htmlFor={`${student.studentId}-teacher-comment`}
                  className="mb-2 block text-sm text-slate-300"
                >
                  Teacher's Comment
                </label>

                <textarea
                  id={`${student.studentId}-teacher-comment`}
                  value={draft.teacherComment}
                  onChange={(event) =>
                    updateTraitComment(
                      student.studentId,
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter an optional comment about the student's conduct and development..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    void saveTraits(student.studentId)
                  }
                  disabled={
                    savingTraitStudent === student.studentId
                  }
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save
                    size={16}
                    className="mr-2 inline"
                  />

                  {savingTraitStudent === student.studentId
                    ? "Saving Assessment..."
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

        {/* TABLE */}
        {studentsLoading ? (
          <PageLoader />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No students available in selected class."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-3xl border border-white/10">

              <table className="min-w-full">

                <thead className="bg-slate-900">
                  <tr className="text-left text-sm text-slate-300">

                    <th className="p-4">
                      Student
                    </th>

                    <th className="p-4">
                      Admission No
                    </th>

                    <th className="p-4">
                      CA1
                      <span className="ml-1 text-xs text-slate-500">
                        /10
                      </span>
                    </th>

                    <th className="p-4">
                      CA2
                      <span className="ml-1 text-xs text-slate-500">
                        /10
                      </span>
                    </th>

                    <th className="p-4">
                      Assignment
                      <span className="ml-1 text-xs text-slate-500">
                        /10
                      </span>
                    </th>

                    <th className="p-4">
                      Exam
                      <span className="ml-1 text-xs text-slate-500">
                        /70
                      </span>
                    </th>

                    <th className="p-4">
                      Total
                      <span className="ml-1 text-xs text-slate-500">
                        /100
                      </span>
                    </th>

                    <th className="p-4">
                      Grade
                    </th>

                    <th className="p-4">
                      Remark
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student.studentId}
                        className="border-t border-white/5 hover:bg-white/[0.03]"
                      >

                        <td className="p-4">
                          <div className="font-semibold text-white">
                            {student.fullName}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {student.gender} •{" "}
                            {student.attendanceStatus}
                          </div>
                        </td>

                        <td className="p-4 text-slate-300">
                          {student.admissionNumber}
                        </td>

                        {(
                          [
                            "ca1",
                            "ca2",
                            "assignment",
                            "exam",
                          ] as const
                        ).map((field) => {

                          const max =
                            SCORE_LIMITS[
                              field
                            ];

                          const value =
                            student[field];

                          return (
                            <td
                              key={field}
                              className="p-4"
                            >
                              <input
                                type="number"
                                min={0}
                                max={max}
                                step="0.5"
                                value={
                                  value ?? ""
                                }
                                placeholder="—"
                                onChange={(e) => {
                                  const raw =
                                    e.target.value;

                                  const parsed =
                                    raw === ""
                                      ? null
                                      : Number(
                                          raw
                                        );

                                  updateScore(
                                    student.studentId,
                                    field,
                                    parsed
                                  );
                                }}
                                className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                              />

                              <div className="mt-1 text-center text-[10px] text-slate-500">
                                max {max}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-4 font-bold text-cyan-300">
                          {student.grade ||
                          student.remark ||
                          student.ca1 !== null ||
                          student.ca2 !== null ||
                          student.assignment !== null ||
                          student.exam !== null
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
                    )
                  )}
                </tbody>

              </table>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() => void saveDraft(true)}
                disabled={saving}
                className="rounded-2xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
              >
                <Save
                  size={16}
                  className="mr-2 inline"
                />

                Save Draft
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
              >
                <UploadCloud
                  size={16}
                  className="mr-2 inline"
                />

                Publish Results
              </button>

            </div>
          </>
        )}

      </SectionCard>
    </div>
  );
}
