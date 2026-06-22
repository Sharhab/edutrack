"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import SectionCard from "../../../../../components/ui/SectionCard";
import PageLoader from "../../../../../components/ui/PageLoader";
import EmptyState from "../../../../../components/ui/EmptyState";
import FormInput from "../../../../../components/ui/FormInput";

import { bulkUpsertResults } from "../../../../../lib/results";
import {
  getClassStudentsForResultEntry,
  getTeacherResultContext,
  publishResults,
} from "../../../../../lib/results";

import { Save, Search, UploadCloud } from "lucide-react";

/* =========================================
   TYPES
========================================= */

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

/* =========================================
   COMPUTE RESULT
========================================= */

function computeResult(row: Partial<StudentRow>) {
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

  return { total, grade, remark };
}

/* =========================================
   PAGE
========================================= */

export default function ResultEntryPage() {
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [context, setContext] = useState<any>(null);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [pageError, setPageError] = useState("");

  /* ===========================
     IMPORTANT FIXES
  =========================== */

  const savingRef = useRef(false);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  /* =========================================
     LOAD CONTEXT
  ========================================= */

  useEffect(() => {
    async function loadContext() {
      try {
        setLoading(true);
        setPageError("");

        const data = await getTeacherResultContext();

        setContext(data);

        setClassId(data?.classes?.[0]?._id || "");
        setSubjectId(data?.subjects?.[0]?._id || "");
        setSessionId(data?.sessions?.[0]?._id || "");
        setTermId(data?.terms?.[0]?._id || "");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setPageError(err.response?.data?.message || "Failed to load context");
        } else {
          setPageError("Failed to load context");
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

        const res = await getClassStudentsForResultEntry(classId);

        const list = res?.students || [];

        const mapped: StudentRow[] = list.map((s: any) => ({
          studentId: s._id,
          firstName: s.firstName || "",
          lastName: s.lastName || "",
          fullName:
            s.fullName ||
            `${s.firstName || ""} ${s.lastName || ""}`.trim(),

          admissionNumber: s.admissionNumber || "",
          gender: s.gender || "",
          attendanceStatus: s.attendanceStatus || "present",

          ca1: 0,
          ca2: 0,
          assignment: 0,
          exam: 0,

          total: 0,
          grade: "F",
          remark: "Fail",
        }));

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
     FILTER
  ========================================= */

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;

    const q = search.toLowerCase();

    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.admissionNumber || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  /* =========================================
     SCORE UPDATE (FIXED - NO AUTOSAVE HERE)
  ========================================= */

  function updateScore(
    studentId: string,
    field: "ca1" | "ca2" | "assignment" | "exam",
    value: number
  ) {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.studentId !== studentId) return student;

        const updated = { ...student, [field]: value };
        const computed = computeResult(updated);

        return {
          ...updated,
          total: computed.total,
          grade: computed.grade,
          remark: computed.remark,
        };
      })
    );
  }

  /* =========================================
     AUTOSAVE (DEBOUNCED + LOCKED)
  ========================================= */

  useEffect(() => {
    if (!classId || !subjectId || !sessionId || !termId) return;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      saveDraft();
    }, 3000); // 3s debounce

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [students]);

  async function saveDraft() {
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);

    try {
      await bulkUpsertResults({
        classId,
        subjectId,
        sessionId,
        termId,
        results: students,
      });
    } catch (err) {
      console.error("Autosave error:", err);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  /* =========================================
     PUBLISH
  ========================================= */

  async function handlePublish() {
    if (!classId || !subjectId || !sessionId || !termId) return;

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
     LOADING STATES
  ========================================= */

  if (loading) return <PageLoader />;

  if (pageError)
    return (
      <EmptyState
        title="Error"
        description={pageError}
      />
    );

  if (!context)
    return (
      <EmptyState
        title="No context"
        description="Teacher not assigned"
      />
    );

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <SectionCard
        title="Result Entry Engine"
        subtitle="Autosave safe version"
      >
        <div className="grid md:grid-cols-4 gap-4">

          {/* CLASS */}
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {context.classes?.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* SUBJECT */}
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {context.subjects?.map((s: any) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* SESSION */}
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {context.sessions?.map((s: any) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* TERM */}
          <select value={termId} onChange={(e) => setTermId(e.target.value)}>
            {context.terms?.map((t: any) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <div>Students: {students.length}</div>
          <div>{saving ? "Saving..." : "Saved"}</div>
          {published && <div>Published ✔</div>}
        </div>
      </SectionCard>

      {/* TABLE */}
      <SectionCard title="Students">
        {studentsLoading ? (
          <PageLoader />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>CA1</th>
                <th>CA2</th>
                <th>Assign</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.studentId}>
                  <td>{s.fullName}</td>

                  {(["ca1", "ca2", "assignment", "exam"] as const).map((f) => (
                    <td key={f}>
                      <input
                        type="number"
                        value={s[f]}
                        onChange={(e) =>
                          updateScore(
                            s.studentId,
                            f,
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                  ))}

                  <td>{s.total}</td>
                  <td>{s.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button onClick={saveDraft} disabled={saving}>
          <Save /> Save
        </button>

        <button onClick={handlePublish} disabled={saving}>
          <UploadCloud /> Publish
        </button>
      </SectionCard>
    </div>
  );
}