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

  function triggerAutosave() {
    if (autosaveTimer.current) {
      clearTimeout(
        autosaveTimer.current
      );
    }

    autosaveTimer.current =
      setTimeout(() => {
        saveDraft();
      }, 1200);
  }

  async function saveDraft() {
    if (savingLock.current) {
      return;
    }

    if (
      !classId ||
      !subjectId ||
      !sessionId ||
      !termId
    ) {
      return;
    }

    savingLock.current = true;
    setSaving(true);

    try {
      await bulkUpsertResults({
        classId,
        subjectId,
        sessionId,
        termId,
        results:
          studentsRef.current,
      });
    } catch (err) {
      console.error(
        "bulk-upsert failed:",
        err
      );
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }

  /* =========================================
     PUBLISH
  ========================================= */

  async function handlePublish() {
    if (
      !classId ||
      !subjectId ||
      !sessionId ||
      !termId
    ) {
      return;
    }

    try {
      setSaving(true);

      await publishResults({
        classId,
        subjectId,
        sessionId,
        termId,
      });

      setPublished(true);
    } catch (err) {
      console.error(err);
    } finally {
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
                onClick={saveDraft}
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
