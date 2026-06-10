"use client";

import { useEffect, useState, useMemo } from "react";
import api from "../../../../lib/axios";

export default function FeePlansPage() {
  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [feePlans, setFeePlans] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    classId: "",
    sessionId: "",
    termId: "",
    description: "",
  });

  const [assignStudent, setAssignStudent] = useState({
    studentId: "",
    feePlanId: "",
  });

  const [assignClass, setAssignClass] = useState({
    classId: "",
    feePlanId: "",
  });

  /* =========================================
     SINGLE DATA LOADER (CLEAN FIX)
  ========================================= */
  const loadAll = async () => {
    try {
      const [cls, sess, trm, std, plans] =
        await Promise.all([
          api.get("/classes"),
          api.get("/sessions"),
          api.get("/terms"),
          api.get("/students"),
          api.get("/finance/fees/plans"),
        ]);

      setClasses(cls.data?.data || []);
      setSessions(sess.data?.data || []);
      setTerms(trm.data?.data || []);
      setStudents(std.data?.data || []);
      setFeePlans(plans.data?.data || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* =========================================
     CREATE FEE PLAN (AUTO REFRESH FIX)
  ========================================= */
  const submit = async () => {
    try {
      setLoading(true);

      await api.post("/finance/fees/plans", {
        title: form.title,
        amount: Number(form.amount),
        classId: form.classId,
        sessionId: form.sessionId,
        termId: form.termId,
        description: form.description,
      });

      alert("Fee plan created");

      setForm({
        title: "",
        amount: "",
        classId: "",
        sessionId: "",
        termId: "",
        description: "",
      });

      await loadAll(); // 🔥 FIX: auto refresh everything
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     SMART FILTER: ONLY MATCH CLASS/SESSION/TERM
  ========================================= */
  const filteredFeePlans = useMemo(() => {
    return feePlans.filter((p: any) => {
      const matchClass = form.classId ? p.classId === form.classId : true;
      const matchSession = form.sessionId ? p.sessionId === form.sessionId : true;
      const matchTerm = form.termId ? p.termId === form.termId : true;

      return matchClass && matchSession && matchTerm;
    });
  }, [feePlans, form.classId, form.sessionId, form.termId]);

  /* =========================================
     ASSIGN TO STUDENT
  ========================================= */
  const assignToStudent = async () => {
    if (!assignStudent.studentId || !assignStudent.feePlanId)
      return alert("Select student and fee plan");

    try {
      setLoading(true);

      await api.post("/finance/fees/assign-student", {
        studentId: assignStudent.studentId,
        feePlanId: assignStudent.feePlanId,
      });

      alert("Assigned to student");

      setAssignStudent({
        studentId: "",
        feePlanId: "",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     ASSIGN TO CLASS
  ========================================= */
  const assignToClass = async () => {
    if (!assignClass.classId || !assignClass.feePlanId)
      return alert("Select class and fee plan");

    try {
      setLoading(true);

      await api.post("/finance/fees/assign-class", {
        classId: assignClass.classId,
        feePlanId: assignClass.feePlanId,
      });

      alert("Assigned to class");

      setAssignClass({
        classId: "",
        feePlanId: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-white">

      {/* ================= CREATE ================= */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xl font-semibold">Create Fee Plan</h2>

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl bg-black/30 p-3"
        />

        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full rounded-xl bg-black/30 p-3"
        />

        <select
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: e.target.value })}
          className="w-full rounded-xl bg-black/30 p-3"
        >
          <option value="">Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={form.sessionId}
          onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
          className="w-full rounded-xl bg-black/30 p-3"
        >
          <option value="">Session</option>
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          value={form.termId}
          onChange={(e) => setForm({ ...form, termId: e.target.value })}
          className="w-full rounded-xl bg-black/30 p-3"
        >
          <option value="">Term</option>
          {terms.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-green-600 p-3 rounded-xl"
        >
          {loading ? "Saving..." : "Create Fee Plan"}
        </button>
      </div>

      {/* ================= ASSIGN STUDENT ================= */}
      <div className="space-y-3 rounded-2xl bg-white/5 p-6">
        <h2>Assign To Student</h2>

        <select
          value={assignStudent.studentId}
          onChange={(e) =>
            setAssignStudent({ ...assignStudent, studentId: e.target.value })
          }
          className="w-full p-3 bg-black/30 rounded"
        >
          <option value="">Student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>

        <select
          value={assignStudent.feePlanId}
          onChange={(e) =>
            setAssignStudent({ ...assignStudent, feePlanId: e.target.value })
          }
          className="w-full p-3 bg-black/30 rounded"
        >
          <option value="">Fee Plan</option>
          {filteredFeePlans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title} — ₦{p.totalAmount}
            </option>
          ))}
        </select>

        <button onClick={assignToStudent} className="w-full bg-blue-600 p-3 rounded">
          Assign Student
        </button>
      </div>

      {/* ================= ASSIGN CLASS ================= */}
      <div className="space-y-3 rounded-2xl bg-white/5 p-6">
        <h2>Assign To Class</h2>

        <select
          value={assignClass.classId}
          onChange={(e) =>
            setAssignClass({ ...assignClass, classId: e.target.value })
          }
          className="w-full p-3 bg-black/30 rounded"
        >
          <option value="">Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={assignClass.feePlanId}
          onChange={(e) =>
            setAssignClass({ ...assignClass, feePlanId: e.target.value })
          }
          className="w-full p-3 bg-black/30 rounded"
        >
          <option value="">Fee Plan</option>
          {filteredFeePlans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title} — ₦{p.totalAmount}
            </option>
          ))}
        </select>

        <button onClick={assignToClass} className="w-full bg-purple-600 p-3 rounded">
          Assign Class
        </button>
      </div>
    </div>
  );
}