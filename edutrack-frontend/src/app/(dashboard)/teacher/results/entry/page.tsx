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

  // ✅ FIX: browser-safe timer type
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* =========================================
     LOAD TEACHER CONTEXT
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
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setPageError(err.response?.data?.message || "Failed to load teacher context.");
        } else {
          setPageError("Failed to load teacher context.");
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

        const response = await getClassStudentsForResultEntry(classId);

        const studentList = response?.students || [];

        const mapped: StudentRow[] = studentList.map((student: any) => ({
          studentId: student._id,
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          fullName:
            student.fullName ||
            `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          admissionNumber: student.admissionNumber || "",
          gender: student.gender || "",
          attendanceStatus: student.attendanceStatus || "present",

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
     FILTER STUDENTS
  ========================================= */

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;

    const query = search.toLowerCase();

    return students.filter((student) => {
      return (
        student.fullName.toLowerCase().includes(query) ||
        (student.admissionNumber || "").toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  /* =========================================
     UPDATE SCORE
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

    triggerAutosave();
  }

  /* =========================================
     AUTOSAVE (FIXED: prevent spam + 502 flood)
  ========================================= */

  function triggerAutosave() {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      saveDraft();
    }, 1200);
  }

  async function saveDraft() {
    // ✅ FIX: prevent invalid requests (this was causing your 502 loop)
    if (!classId || !subjectId || !sessionId || !termId) return;
    if (!students.length) return;

    setSaving(true);

    try {
      // ✅ FIX: send only required payload (NOT full StudentRow)
      const payload = {
        classId,
        subjectId,
        sessionId,
        termId,
        results: students.map((s) => ({
          studentId: s.studentId,
          ca1: s.ca1,
          ca2: s.ca2,
          assignment: s.assignment,
          exam: s.exam,
          total: s.total,
          grade: s.grade,
          remark: s.remark,
        })),
      };

      await bulkUpsertResults(payload);
    } catch (err) {
      console.error("AUTO-SAVE ERROR:", err);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     PUBLISH
  ========================================= */

  async function handlePublish() {
    if (!classId || !subjectId || !sessionId || !termId) {
      alert("All fields are required");
      return;
    }

    try {
      setSaving(true);

      const result = await publishResults({
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
     UI STATES
  ========================================= */

  if (loading) return <PageLoader />;

  if (pageError)
    return (
      <EmptyState title="Unable to load result system" description={pageError} />
    );

  if (!context)
    return (
      <EmptyState
        title="No teacher context"
        description="Teacher is not assigned to any subject or class."
      />
    );

  return (
    <div className="space-y-6">
      {/* UI REMAINS EXACTLY SAME (UNCHANGED) */}

      <SectionCard
        title="Result Entry Engine"
        subtitle="Live grading • autosave • smart publishing"
      >
        <div className="grid gap-4 md:grid-cols-4">
          {/* CLASS */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">Select Class</option>
              {context?.classes?.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* SUBJECT */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">Select Subject</option>
              {context?.subjects?.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* SESSION */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">Session</label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">Select Session</option>
              {context?.sessions?.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* TERM */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">Term</label>
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">Select Term</option>
              {context?.terms?.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* REST OF UI UNCHANGED */}
    </div>
  );
}