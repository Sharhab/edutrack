"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";

import {
  Search,
  Lock,
  Unlock,
  Eye,
  FileSpreadsheet,
  RefreshCcw,
} from "lucide-react";

import {
  getClassOptions,
  getSubjectOptions,
  getSessions,
  getTerms,
} from "../../../../lib/options";

import api from "../../../../lib/axios";

import {
  ClassOption,
  SubjectOption,
} from "../../../../types/options";

/* =========================================================
   TYPES
========================================================= */

type SessionOption = {
  _id: string;
  name: string;
};

type TermOption = {
  _id: string;
  name: string;
};

type ResultSummary = {
  classId: string;
  className: string;

  subjectId: string;
  subjectName: string;

  sessionId: string;
  sessionName: string;

  termId: string;
  termName: string;

  totalStudents: number;
  totalResults: number;

  status: "draft" | "published" | "locked";
};

type GeneratePayload = {
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;
};

/* =========================================================
   INITIAL
========================================================= */

const initialGenerateForm: GeneratePayload = {
  classId: "",
  subjectId: "",
  sessionId: "",
  termId: "",
};

/* =========================================================
   PAGE
========================================================= */

export default function ResultsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  const [resultGroups, setResultGroups] = useState<ResultSummary[]>([]);

  const [generateOpen, setGenerateOpen] = useState(false);

  const [form, setForm] =
    useState<GeneratePayload>(initialGenerateForm);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setPageError("");

      const [
        classData,
        subjectData,
        sessionData,
        termData,
        resultData,
      ] = await Promise.all([
        getClassOptions(),
        getSubjectOptions(),
        getSessions(),
        getTerms(),

        api.get("/results/admin/summary"),
      ]);

      setClasses(
        Array.isArray(classData)
          ? classData
          : []
      );

      setSubjects(
        Array.isArray(subjectData)
          ? subjectData
          : []
      );

      setSessions(
        Array.isArray(sessionData)
          ? sessionData
          : []
      );

      setTerms(
        Array.isArray(termData)
          ? termData
          : []
      );

      setResultGroups(
        resultData?.data?.data || []
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load result management data."
        );
      } else {
        setPageError(
          "Failed to load result management data."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    if (!search.trim()) return resultGroups;

    const q = search.toLowerCase();

    return resultGroups.filter((item) => {
      return (
        item.className
          ?.toLowerCase()
          .includes(q) ||
        item.subjectName
          ?.toLowerCase()
          .includes(q) ||
        item.sessionName
          ?.toLowerCase()
          .includes(q) ||
        item.termName
          ?.toLowerCase()
          .includes(q)
      );
    });
  }, [resultGroups, search]);

  /* =========================================================
     FORM
  ========================================================= */

  function updateForm(
    field: keyof GeneratePayload,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialGenerateForm);
    setActionError("");
  }

  function validateGenerate() {
    if (!form.classId.trim()) {
      return "Class is required.";
    }

    if (!form.subjectId.trim()) {
      return "Subject is required.";
    }

    if (!form.sessionId.trim()) {
      return "Session is required.";
    }

    if (!form.termId.trim()) {
      return "Term is required.";
    }

    return "";
  }

  /* =========================================================
     GENERATE RESULT SHEET
  ========================================================= */

  async function handleGenerate() {
    const validation = validateGenerate();

    if (validation) {
      setActionError(validation);
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      await api.post(
        "/results/admin/generate",
        {
          classId: form.classId,
          subjectId: form.subjectId,
          sessionId: form.sessionId,
          termId: form.termId,
        }
      );

      setGenerateOpen(false);
      resetForm();

      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Failed to generate result sheet."
        );
      } else {
        setActionError(
          "Failed to generate result sheet."
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     LOCK RESULTS
  ========================================================= */

  async function handleLock(item: ResultSummary) {
    try {
      setActionLoading(true);

      await api.patch(
        "/results/admin/lock",
        {
          classId: item.classId,
          subjectId: item.subjectId,
          sessionId: item.sessionId,
          termId: item.termId,
        }
      );

      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     UNLOCK RESULTS
  ========================================================= */

  async function handleUnlock(
    item: ResultSummary
  ) {
    try {
      setActionLoading(true);

      await api.patch(
        "/results/admin/unlock",
        {
          classId: item.classId,
          subjectId: item.subjectId,
          sessionId: item.sessionId,
          termId: item.termId,
        }
      );

      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     PUBLISH RESULTS
  ========================================================= */

  async function handlePublish(
    item: ResultSummary
  ) {
    try {
      setActionLoading(true);

      await api.patch(
        "/results/admin/publish",
        {
          classId: item.classId,
          subjectId: item.subjectId,
          sessionId: item.sessionId,
          termId: item.termId,
        }
      );

      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     UI STATES
  ========================================================= */

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load result management"
        description={pageError}
      />
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <div className="space-y-6">

        {/* ================================================= */}
        {/* RESULT MANAGEMENT */}
        {/* ================================================= */}

        <SectionCard
          title="Result Management"
          subtitle="Track preparation, lock, unlock and publish results"
        >
          {/* TOP BAR */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            {/* SEARCH */}

            <div className="w-full max-w-md">
              <label className="mb-2 block text-sm text-slate-300">
                Search Results
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search class, subject, session..."
                  className="input pl-11"
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setGenerateOpen(true);
                }}
                className="btn-primary inline-flex items-center"
              >
                <FileSpreadsheet
                  size={16}
                  className="mr-2"
                />
                Generate Result Sheet
              </button>

              <button
                type="button"
                onClick={loadData}
                className="btn-secondary inline-flex items-center"
              >
                <RefreshCcw
                  size={16}
                  className="mr-2"
                />
                Refresh
              </button>
            </div>
          </div>

          {/* RESULT CARDS */}

          <div className="space-y-4">

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
                No result preparation found.
              </div>
            )}

            {filtered.map((item, index) => (
              <div
                key={`${item.classId}-${item.subjectId}-${index}`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                  {/* LEFT */}

                  <div className="space-y-2">

                    <h3 className="text-lg font-semibold text-white">
                      {item.className}
                    </h3>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-400">

                      <span>
                        Subject:
                        {" "}
                        {item.subjectName}
                      </span>

                      <span>•</span>

                      <span>
                        {item.termName}
                      </span>

                      <span>•</span>

                      <span>
                        {item.sessionName}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">

                      <div className="rounded-xl bg-white/5 px-3 py-1 text-slate-300">
                        Students:
                        {" "}
                        {item.totalStudents}
                      </div>

                      <div className="rounded-xl bg-white/5 px-3 py-1 text-slate-300">
                        Results:
                        {" "}
                        {item.totalResults}
                      </div>

                      <div
                        className={`rounded-xl px-3 py-1 ${
                          item.status ===
                          "published"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : item.status ===
                              "locked"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {item.status}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-wrap gap-2">

                    {/* VIEW */}

                    <button
                      type="button"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                    >
                      <Eye
                        size={15}
                        className="mr-2 inline"
                      />
                      View
                    </button>

                    {/* LOCK */}

                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        handleLock(item)
                      }
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                    >
                      <Lock
                        size={15}
                        className="mr-2 inline"
                      />
                      Lock
                    </button>

                    {/* UNLOCK */}

                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        handleUnlock(item)
                      }
                      className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/20"
                    >
                      <Unlock
                        size={15}
                        className="mr-2 inline"
                      />
                      Unlock
                    </button>

                    {/* PUBLISH */}

                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        handlePublish(item)
                      }
                      className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ================================================= */}
      {/* GENERATE MODAL */}
      {/* ================================================= */}

      <Modal
        open={generateOpen}
        title="Generate Result Preparation"
        description="Select class, subject, term and session"
        onClose={() => {
          setGenerateOpen(false);
          resetForm();
        }}
      >
        {actionError && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        )}

        <div className="space-y-5">

          {/* CLASS */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Class
            </label>

            <select
              value={form.classId}
              onChange={(e) =>
                updateForm(
                  "classId",
                  e.target.value
                )
              }
              className="input"
            >
              <option value="">
                Select Class
              </option>

              {classes.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* SUBJECT */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Subject
            </label>

            <select
              value={form.subjectId}
              onChange={(e) =>
                updateForm(
                  "subjectId",
                  e.target.value
                )
              }
              className="input"
            >
              <option value="">
                Select Subject
              </option>

              {subjects.map((item: any) => (
                <option
                  key={
                    item._id ||
                    item.value
                  }
                  value={
                    item._id ||
                    item.value
                  }
                >
                  {item.name ||
                    item.label}
                </option>
              ))}
            </select>
          </div>

          {/* SESSION */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Session
            </label>

            <select
              value={form.sessionId}
              onChange={(e) =>
                updateForm(
                  "sessionId",
                  e.target.value
                )
              }
              className="input"
            >
              <option value="">
                Select Session
              </option>

              {sessions.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* TERM */}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Term
            </label>

            <select
              value={form.termId}
              onChange={(e) =>
                updateForm(
                  "termId",
                  e.target.value
                )
              }
              className="input"
            >
              <option value="">
                Select Term
              </option>

              {terms.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* SUBMIT */}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={actionLoading}
            className="btn-primary w-full"
          >
            {actionLoading
              ? "Generating..."
              : "Generate Result Preparation"}
          </button>
        </div>
      </Modal>
    </>
  );
}