
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import api from "../../../../lib/axios";
import { getTeacherDashboard } from "../../../../lib/dashboard";

type Option = {
  _id: string;
  name: string;
  code?: string;
  level?: string;
};

type LessonStage = {
  stage: string;
  teacherActivities: string;
  learnerActivities: string;
};

type LessonContent = {
  previousKnowledge: string;
  learningObjectives: string[];
  instructionalMaterials: string[];
  introduction: string;
  lessonDevelopment: LessonStage[];
  evaluationQuestions: string[];
  conclusion: string;
  assignment: string;
};

type LessonNote = {
  _id?: string;
  sessionId: string | { _id: string; name: string };
  termId: string | { _id: string; name: string };
  classId: string | { _id: string; name: string };
  subjectId: string | { _id: string; name: string; code?: string };
  topic: string;
  week: number | null;
  durationMinutes: number;
  curriculumRequirements: string;
  content: LessonContent;
  status?: "draft" | "saved";
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const emptyContent: LessonContent = {
  previousKnowledge: "",
  learningObjectives: [],
  instructionalMaterials: [],
  introduction: "",
  lessonDevelopment: [
    {
      stage: "Introduction",
      teacherActivities: "",
      learnerActivities: "",
    },
  ],
  evaluationQuestions: [],
  conclusion: "",
  assignment: "",
};

function getId(value: string | { _id: string } | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString();
}

export default function TeacherLessonNotesPage() {
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [topic, setTopic] = useState("");
  const [week, setWeek] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("40");
  const [learningObjectivesInput, setLearningObjectivesInput] =
    useState("");
  const [curriculumRequirements, setCurriculumRequirements] =
    useState("");

  const [content, setContent] = useState<LessonContent>(emptyContent);
  const [selectedNoteId, setSelectedNoteId] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSession = sessions.find((item) => item._id === sessionId);
  const selectedTerm = terms.find((item) => item._id === termId);
  const selectedClass = classes.find((item) => item._id === classId);
  const selectedSubject = subjects.find((item) => item._id === subjectId);

  const loadSavedNotes = useCallback(async () => {
    setLoadingNotes(true);

    try {
      const response = await api.get<ApiResponse<LessonNote[]>>(
        "/lesson-notes"
      );

      const payload = response.data;

      setNotes(
        Array.isArray(payload.data)
          ? payload.data
          : Array.isArray((payload as unknown as { lessonNotes?: LessonNote[] }).lessonNotes)
            ? (payload as unknown as { lessonNotes: LessonNote[] }).lessonNotes
            : []
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to load saved lesson notes."));
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [dashboard, sessionResponse] = await Promise.all([
          getTeacherDashboard(),
          api.get<ApiResponse<Option[]>>("/sessions"),
        ]);

        if (!mounted) return;

        setClasses(dashboard?.myClasses ?? []);
        setSubjects(dashboard?.mySubjects ?? []);

        const sessionPayload = sessionResponse.data;
        const sessionList = Array.isArray(sessionPayload.data)
          ? sessionPayload.data
          : [];

        setSessions(sessionList);

        const currentSession = sessionList.find(
          (item: Option & { isCurrent?: boolean }) => item.isCurrent
        );

        if (currentSession) {
          setSessionId(currentSession._id);
        }

        const currentClass = (dashboard?.myClasses ?? []).find(
          (item: Option & { isCurrent?: boolean }) => item.isCurrent
        );

        if (currentClass) setClassId(currentClass._id);
      } catch (err: unknown) {
        if (mounted) {
          setError(
            getErrorMessage(
              err,
              "Unable to load your classes, subjects, or academic sessions."
            )
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      return;
    }

    let mounted = true;

    async function loadTerms() {
      setLoadingTerms(true);

      try {
        const response = await api.get<ApiResponse<Option[]>>("/terms", {
          params: { sessionId },
        });

        if (!mounted) return;

        const payload = response.data;
        const termList = Array.isArray(payload.data) ? payload.data : [];

        setTerms(termList);

        const currentTerm = termList.find(
          (item: Option & { isCurrent?: boolean }) => item.isCurrent
        );

        setTermId(currentTerm?._id ?? "");
      } catch (err: unknown) {
        if (mounted) {
          setTerms([]);
          setTermId("");
          setError(getErrorMessage(err, "Unable to load academic terms."));
        }
      } finally {
        if (mounted) setLoadingTerms(false);
      }
    }

    loadTerms();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  async function generateNote() {
    setError("");
    setSuccess("");
    setSelectedNoteId("");

    if (!sessionId || !termId || !classId || !subjectId || !topic.trim()) {
      setError(
        "Select the session, term, class, and subject, then enter a lesson topic."
      );
      return;
    }

    setGenerating(true);

    try {
      const response = await api.post("/lesson-notes/generate", {
        sessionId,
        termId,
        classId,
        subjectId,
        topic: topic.trim(),
        week: week ? Number(week) : null,
        durationMinutes: Number(durationMinutes),
        learningObjectives: splitLines(learningObjectivesInput),
        curriculumRequirements: curriculumRequirements.trim(),
      });

      const generated = response.data?.lessonNote;

      if (!generated?.content) {
        throw new Error("The server returned no lesson-note content.");
      }

      setContent(generated.content);
      setSuccess("Lesson note generated. Review and edit it before saving.");
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          err instanceof Error
            ? err.message
            : "Unable to generate the lesson note."
        )
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveNote() {
    setError("");
    setSuccess("");

    if (!content.learningObjectives.length) {
      setError("Add at least one learning objective before saving.");
      return;
    }

    if (!content.lessonDevelopment.length) {
      setError("Add at least one lesson development stage.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.post("/lesson-notes", {
        sessionId,
        termId,
        classId,
        subjectId,
        topic: topic.trim(),
        week: week ? Number(week) : null,
        durationMinutes: Number(durationMinutes),
        curriculumRequirements: curriculumRequirements.trim(),
        content,
      });

      const saved = response.data?.lessonNote;

      setSelectedNoteId(saved?._id ?? "");
      setSuccess("Lesson note saved successfully.");
      await loadSavedNotes();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save the lesson note."));
    } finally {
      setSaving(false);
    }
  }

  async function openSavedNote(note: LessonNote) {
    setError("");
    setSuccess("");
    setSelectedNoteId(note._id ?? "");

    setSessionId(getId(note.sessionId));
    setTermId(getId(note.termId));
    setClassId(getId(note.classId));
    setSubjectId(getId(note.subjectId));

    setTopic(note.topic);
    setWeek(note.week == null ? "" : String(note.week));
    setDurationMinutes(String(note.durationMinutes));
    setCurriculumRequirements(note.curriculumRequirements ?? "");
    setContent(note.content);

    setSuccess("Saved lesson note loaded.");
  }

  function updateContent<K extends keyof LessonContent>(
    field: K,
    value: LessonContent[K]
  ) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateStage(
    index: number,
    field: keyof LessonStage,
    value: string
  ) {
    setContent((current) => ({
      ...current,
      lessonDevelopment: current.lessonDevelopment.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      ),
    }));
  }

  function addStage() {
    setContent((current) => ({
      ...current,
      lessonDevelopment: [
        ...current.lessonDevelopment,
        {
          stage: `Stage ${current.lessonDevelopment.length + 1}`,
          teacherActivities: "",
          learnerActivities: "",
        },
      ],
    }));
  }

  function removeStage(index: number) {
    setContent((current) => ({
      ...current,
      lessonDevelopment: current.lessonDevelopment.filter(
        (_, i) => i !== index
      ),
    }));
  }

  function printNote() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-400">
        Loading lesson note workspace...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <Link
            href="/teacher"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Teacher dashboard
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            AI Lesson Note Generator
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Create, review, edit, save, and print lesson notes for your
            assigned classes and subjects.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
          <strong>AI-assisted planning</strong>
          <p className="mt-1 text-xs text-cyan-100/70">
            Always review the generated content before teaching.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl sm:p-6 print:hidden">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Lesson details
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Choose your academic period and enter the lesson requirements.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Academic session">
                <select
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select session</option>
                  {sessions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Term">
                <select
                  value={termId}
                  onChange={(event) => setTermId(event.target.value)}
                  disabled={!sessionId || loadingTerms}
                  className={inputClass}
                >
                  <option value="">
                    {loadingTerms ? "Loading terms..." : "Select term"}
                  </option>
                  {terms.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Class">
                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject">
                <select
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select subject</option>
                  {subjects.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                      {item.code ? ` (${item.code})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lesson topic">
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  maxLength={200}
                  placeholder="e.g. Fractions"
                  className={inputClass}
                />
              </Field>

              <Field label="Week (optional)">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={week}
                  onChange={(event) => setWeek(event.target.value)}
                  placeholder="e.g. 4"
                  className={inputClass}
                />
              </Field>

              <Field label="Lesson duration (minutes)">
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Learning objectives (one per line)">
                <textarea
                  rows={3}
                  value={learningObjectivesInput}
                  onChange={(event) =>
                    setLearningObjectivesInput(event.target.value)
                  }
                  placeholder={"Define fractions\nIdentify equivalent fractions"}
                  className={inputClass}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Curriculum requirements or syllabus notes (optional)">
                  <textarea
                    rows={4}
                    maxLength={10000}
                    value={curriculumRequirements}
                    onChange={(event) =>
                      setCurriculumRequirements(event.target.value)
                    }
                    placeholder="Paste the relevant curriculum objectives or school requirements. Do not include student personal data."
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <button
              type="button"
              onClick={generateNote}
              disabled={generating}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {generating ? "Generating lesson note..." : "✦ Generate lesson note"}
            </button>
          </section>

          <section
            id="lesson-note-print"
            className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl sm:p-7 print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none"
          >
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between print:border-gray-300">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 print:text-gray-600">
                  EduTrack • Lesson note
                </p>
                <h2 className="mt-2 text-xl font-bold text-white print:text-black">
                  {topic || "Your lesson note"}
                </h2>
                <p className="mt-2 text-sm text-slate-400 print:text-gray-600">
                  {selectedSubject?.name || "Subject"} ·{" "}
                  {selectedClass?.name || "Class"}
                </p>
                <p className="mt-1 text-xs text-slate-500 print:text-gray-600">
                  {selectedSession?.name || "Session"} ·{" "}
                  {selectedTerm?.name || "Term"}
                  {week ? ` · Week ${week}` : ""}
                  {durationMinutes ? ` · ${durationMinutes} minutes` : ""}
                </p>
              </div>

              <div className="flex gap-2 print:hidden">
                <button
                  type="button"
                  onClick={printNote}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/5"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={saving || !content.introduction.trim()}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save note"}
                </button>
              </div>
            </div>

            <ContentTextarea
              title="Previous knowledge"
              value={content.previousKnowledge}
              onChange={(value) => updateContent("previousKnowledge", value)}
            />

            <ContentTextarea
              title="Learning objectives"
              hint="One objective per line."
              value={content.learningObjectives.join("\n")}
              onChange={(value) =>
                updateContent("learningObjectives", splitLines(value))
              }
            />

            <ContentTextarea
              title="Instructional materials"
              hint="One material per line."
              value={content.instructionalMaterials.join("\n")}
              onChange={(value) =>
                updateContent("instructionalMaterials", splitLines(value))
              }
            />

            <ContentTextarea
              title="Introduction"
              value={content.introduction}
              onChange={(value) => updateContent("introduction", value)}
            />

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white print:text-black">
                  Lesson development
                </h3>
                <p className="mt-1 text-xs text-slate-500 print:hidden">
                  Edit the teaching stages and activities below.
                </p>
              </div>

              {content.lessonDevelopment.map((stage, index) => (
                <div
                  key={index}
                  className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 print:break-inside-avoid print:border-gray-300 print:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-bold text-cyan-300 print:bg-gray-100 print:text-black">
                      {index + 1}
                    </span>
                    <input
                      value={stage.stage}
                      onChange={(event) =>
                        updateStage(index, "stage", event.target.value)
                      }
                      aria-label={`Stage ${index + 1} title`}
                      className={`${inputClass} font-semibold`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStage(index)}
                      className="text-xs text-red-300 hover:text-red-200 print:hidden"
                      aria-label={`Remove stage ${index + 1}`}
                    >
                      Remove
                    </button>
                  </div>

                  <ContentTextarea
                    title="Teacher activities"
                    value={stage.teacherActivities}
                    onChange={(value) =>
                      updateStage(index, "teacherActivities", value)
                    }
                  />

                  <ContentTextarea
                    title="Learner activities"
                    value={stage.learnerActivities}
                    onChange={(value) =>
                      updateStage(index, "learnerActivities", value)
                    }
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addStage}
                className="rounded-lg border border-dashed border-white/20 px-4 py-2 text-sm text-cyan-300 hover:bg-white/5 print:hidden"
              >
                + Add teaching stage
              </button>
            </div>

            <ContentTextarea
              title="Evaluation questions"
              hint="One question per line."
              value={content.evaluationQuestions.join("\n")}
              onChange={(value) =>
                updateContent("evaluationQuestions", splitLines(value))
              }
            />

            <ContentTextarea
              title="Conclusion"
              value={content.conclusion}
              onChange={(value) => updateContent("conclusion", value)}
            />

            <ContentTextarea
              title="Assignment"
              value={content.assignment}
              onChange={(value) => updateContent("assignment", value)}
            />

            <p className="border-t border-white/10 pt-4 text-xs text-slate-500 print:border-gray-300 print:text-gray-600">
              Teacher review required. Confirm the lesson content against
              your school syllabus and the applicable curriculum before use.
            </p>

            <div className="hidden print:block">
              <style>{`
                @media print {
                  body { background: white !important; color: black !important; }
                  body * { visibility: hidden; }
                  #lesson-note-print,
                  #lesson-note-print * { visibility: visible; }
                  #lesson-note-print {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    padding: 16px !important;
                    color: black !important;
                    background: white !important;
                    font-size: 11pt;
                  }
                  #lesson-note-print input,
                  #lesson-note-print textarea {
                    color: black !important;
                    background: white !important;
                    border: 0 !important;
                    resize: none !important;
                    padding: 2px 0 !important;
                  }
                  #lesson-note-print button { display: none !important; }
                  #lesson-note-print h2,
                  #lesson-note-print h3,
                  #lesson-note-print p,
                  #lesson-note-print label { color: black !important; }
                  @page { margin: 12mm; }
                }
              `}</style>
            </div>
          </section>
        </div>

        <aside className="space-y-5 print:hidden">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="font-semibold text-white">Lesson overview</h2>

            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Session" value={selectedSession?.name || "Not selected"} />
              <SummaryRow label="Term" value={selectedTerm?.name || "Not selected"} />
              <SummaryRow label="Class" value={selectedClass?.name || "Not selected"} />
              <SummaryRow label="Subject" value={selectedSubject?.name || "Not selected"} />
              <SummaryRow label="Duration" value={`${durationMinutes || 0} minutes`} />
              <SummaryRow label="Status" value={selectedNoteId ? "Saved" : "Draft"} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">Saved lesson notes</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Open a note to review it.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSavedNotes}
                disabled={loadingNotes}
                className="text-xs text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {loadingNotes ? (
                <p className="text-sm text-slate-400">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-400">
                  Your saved lesson notes will appear here.
                </p>
              ) : (
                notes.map((note, index) => (
                  <button
                    type="button"
                    key={note._id || index}
                    onClick={() => openSavedNote(note)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedNoteId === note._id
                        ? "border-cyan-400/50 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="font-medium text-white">{note.topic}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {typeof note.subjectId === "object"
                        ? note.subjectId.name
                        : "Subject"}{" "}
                      ·{" "}
                      {typeof note.classId === "object"
                        ? note.classId.name
                        : "Class"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Updated {formatDate(note.updatedAt) || "recently"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50 print:border-0 print:bg-white print:text-black";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300 print:text-black">
        {label}
      </span>
      {children}
    </label>
  );
}

function ContentTextarea({
  title,
  value,
  onChange,
  hint,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-200 print:text-black">
        {title}
      </label>
      {hint && (
        <p className="text-xs text-slate-500 print:hidden">{hint}</p>
      )}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={Math.min(8, Math.max(2, value.split("\n").length + 1))}
        className={`${inputClass} leading-6`}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-slate-200">
        {value}
      </span>
    </div>
  );
}
