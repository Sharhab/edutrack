"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import SectionCard from "../../../../../components/ui/SectionCard";
import PageLoader from "../../../../../components/ui/PageLoader";
import EmptyState from "../../../../../components/ui/EmptyState";
import FormInput from "../../../../../components/ui/FormInput";
import { bulkUpsertResults } from "../../../../../lib/results";
import {
  autosaveResults,
  getClassStudentsForResultEntry,
  getTeacherResultContext,
  publishResults,
} from "../../../../../lib/results";

import {
  Save,
  Search,
  UploadCloud,
} from "lucide-react";

type StudentRow = {
  studentId: string;

  firstName: string;
  lastName: string;
  fullName: string;

  admissionNumber?: string;
  gender?: string;
  attendanceStatus?: string;

  ca1: number;
  ca2: number;
  assignment: number;
  exam: number;

  total: number;
  grade: string;
  remark: string;
};

function computeResult(
  row: Partial<StudentRow>
) {
  const total =
    Number(row.ca1 || 0) +
    Number(row.ca2 || 0) +
    Number(row.assignment || 0) +
    Number(row.exam || 0);

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

export default function ResultEntryPage() {
  const [loading, setLoading] =
    useState(true);

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(false);

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

        console.log(
          "RESULT CONTEXT",
          data
        );

        setContext(data);

        const defaultClass =
          data?.classes?.[0]?._id || "";

        const defaultSubject =
          data?.subjects?.[0]?._id || "";

        const defaultSession =
          data?.sessions?.[0]?._id || "";

        const defaultTerm =
          data?.terms?.[0]?._id || "";

        setClassId(defaultClass);
        setSubjectId(defaultSubject);
        setSessionId(defaultSession);
        setTermId(defaultTerm);
      } catch (err: unknown) {
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

        console.log(
          "CLASS STUDENTS",
          response
        );

        const studentList =
          response?.students || [];

        const mapped: StudentRow[] =
          studentList.map(
            (student: any) => ({
              studentId:
                student._id,

              firstName:
                student.firstName ||
                "",

              lastName:
                student.lastName ||
                "",

              fullName:
                student.fullName ||
                `${student.firstName || ""} ${
                  student.lastName || ""
                }`.trim(),

              admissionNumber:
                student.admissionNumber ||
                "",

              gender:
                student.gender ||
                "",

              attendanceStatus:
                student.attendanceStatus ||
                "present",

              ca1: 0,
              ca2: 0,
              assignment: 0,
              exam: 0,

              total: 0,
              grade: "F",
              remark: "Fail",
            })
          );

        setStudents(mapped);
      } catch (err) {
        console.error(err);
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

      const query =
        search.toLowerCase();

      return students.filter(
        (student) => {
          return (
            student.fullName
              .toLowerCase()
              .includes(query) ||
            (
              student.admissionNumber ||
              ""
            )
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [students, search]);

  /* =========================================
     UPDATE SCORE
  ========================================= */

  function updateScore(
    studentId: string,
    field:
      | "ca1"
      | "ca2"
      | "assignment"
      | "exam",
    value: number
  ) {
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
          [field]: value,
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
  setSaving(true);

  try {
    await bulkUpsertResults({
      classId,
      subjectId,
      sessionId,
      termId,
      results: students,
    });
  } finally {
    setSaving(false);
  }
}
  /* =========================================
     PUBLISH
  ========================================= */

  async function handlePublish() {
    if (!classId) {
      alert("Class is required");
      return;
    }

    if (!subjectId) {
      alert("Subject is required");
      return;
    }

    if (!sessionId) {
      alert("Session is required");
      return;
    }

    if (!termId) {
      alert("Term is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        classId,
        subjectId,
        sessionId,
        termId,
      };

      console.log(
        "PUBLISH PAYLOAD",
        payload
      );

      const result =
        await publishResults(
          payload
        );

      console.log(
        "PUBLISH RESPONSE",
        result
      );

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
     PAGE
  ========================================= */

  return (
    <div className="space-y-6">

      {/* =========================================
         HEADER
      ========================================= */}

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

      {/* =========================================
         STUDENTS TABLE
      ========================================= */}

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
                    </th>

                    <th className="p-4">
                      CA2
                    </th>

                    <th className="p-4">
                      Assignment
                    </th>

                    <th className="p-4">
                      Exam
                    </th>

                    <th className="p-4">
                      Total
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
                        key={
                          student.studentId
                        }
                        className="border-t border-white/5 hover:bg-white/[0.03]"
                      >
                        {/* STUDENT */}

                        <td className="p-4">

                          <div className="font-semibold text-white">
                            {
                              student.fullName
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {
                              student.gender
                            }{" "}
                            •{" "}
                            {
                              student.attendanceStatus
                            }
                          </div>
                        </td>

                        {/* ADMISSION */}

                        <td className="p-4 text-slate-300">
                          {
                            student.admissionNumber
                          }
                        </td>

                        {/* SCORE INPUTS */}

                        {(
                          [
                            "ca1",
                            "ca2",
                            "assignment",
                            "exam",
                          ] as const
                        ).map((field) => (
                          <td
                            key={field}
                            className="p-4"
                          >
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={
                                student[
                                  field
                                ]
                              }
                              onChange={(
                                e
                              ) =>
                                updateScore(
                                  student.studentId,
                                  field,
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-white outline-none focus:border-cyan-500"
                            />
                          </td>
                        ))}

                        {/* TOTAL */}

                        <td className="p-4">
                          <span className="font-bold text-cyan-300">
                            {
                              student.total
                            }
                          </span>
                        </td>

                        {/* GRADE */}

                        <td className="p-4">
                          <span className="font-bold text-yellow-300">
                            {
                              student.grade
                            }
                          </span>
                        </td>

                        {/* REMARK */}

                        <td className="p-4 text-slate-300">
                          {
                            student.remark
                          }
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
                className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
              >
                <Save
                  size={16}
                  className="mr-2"
                />
                Save Draft
              </button>

              <button
                type="button"
                onClick={
                  handlePublish
                }
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
              >
                <UploadCloud
                  size={16}
                  className="mr-2"
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