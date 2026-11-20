
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../../../../lib/axios";

import {
  getClassOptions,
  getSubjectOptions,
  getSessions,
  type OptionItem,
} from "../../../../lib/options";

type QuestionDraft = {
  text: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
};

type TermOption = OptionItem;

type AssessmentComponent = {
  key: string;
  label: string;
  maxScore: number;
  enabled: boolean;
  aggregationMethod?: "average" | "highest" | "selected";
};

type AssessmentSchemeResponse = {
  scheme?: {
    _id?: string;
    name?: string;
    version?: number;
    components?: AssessmentComponent[];
  } | null;
  inherited?: boolean;
};

const emptyQuestion = (): QuestionDraft => ({
  text: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 1,
});

function errorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

export default function ExamCreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  // Academic options
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  // Academic selections
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  // Assessment scheme
  const [assessmentComponents, setAssessmentComponents] =
    useState<AssessmentComponent[]>([]);

  const [assessmentKey, setAssessmentKey] = useState("");
  const [assessmentSchemeName, setAssessmentSchemeName] =
    useState("");
  const [assessmentSchemeVersion, setAssessmentSchemeVersion] =
    useState<number | null>(null);

  const [loadingAssessment, setLoadingAssessment] =
    useState(false);

  // Exam details
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // Exam settings
  const [shuffleQuestions, setShuffleQuestions] =
    useState(false);

  const [shuffleOptions, setShuffleOptions] =
    useState(false);

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    emptyQuestion(),
  ]);

  // UI states
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Only show subjects assigned to the selected class.
  const availableSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        (subject.classIds || []).some(
          (id) => String(id) === String(classId)
        )
      ),
    [subjects, classId]
  );

  const selectedAssessment = useMemo(
    () =>
      assessmentComponents.find(
        (component) => component.key === assessmentKey
      ),
    [assessmentComponents, assessmentKey]
  );

  // --------------------------------------------------
  // LOAD CLASSES, SUBJECTS AND SESSIONS
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const [
          classOptions,
          subjectOptions,
          sessionOptions,
        ] = await Promise.all([
          getClassOptions(),
          getSubjectOptions(),
          getSessions(),
        ]);

        if (!active) return;

        setClasses(classOptions);
        setSubjects(subjectOptions);
        setSessions(sessionOptions);

        const currentSession = sessionOptions.find(
          (item) => item.isCurrent
        );

        setSessionId(
          currentSession?._id ||
            sessionOptions[0]?._id ||
            ""
        );
      } catch (err: any) {
        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // LOAD TERMS WHEN SESSION CHANGES
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    setTerms([]);
    setTermId("");

    if (!sessionId) {
      setLoadingTerms(false);

      return () => {
        active = false;
      };
    }

    async function loadTerms() {
      setLoadingTerms(true);

      try {
        const response = await api.get("/terms", {
          params: { sessionId },
        });

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        if (!active) return;

        const options: TermOption[] = data
          .filter((term: any) => {
            const linkedSession =
              typeof term.sessionId === "object"
                ? term.sessionId?._id
                : term.sessionId;

            return (
              !linkedSession ||
              String(linkedSession) === String(sessionId)
            );
          })
          .map((term: any) => ({
            _id: String(term._id || term.value || ""),
            name: String(term.name || term.label || ""),
            isCurrent: Boolean(term.isCurrent),
          }))
          .filter(
            (term: TermOption) =>
              term._id && term.name
          );

        setTerms(options);

        const currentTerm = options.find(
          (term) => term.isCurrent
        );

        setTermId(
          currentTerm?._id ||
            options[0]?._id ||
            ""
        );
      } catch (err: any) {
        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoadingTerms(false);
        }
      }
    }

    void loadTerms();

    return () => {
      active = false;
    };
  }, [sessionId]);

  // --------------------------------------------------
  // LOAD ASSESSMENT SCHEME WHEN CLASS CHANGES
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    setAssessmentComponents([]);
    setAssessmentKey("");
    setAssessmentSchemeName("");
    setAssessmentSchemeVersion(null);

    if (!classId) {
      setLoadingAssessment(false);

      return () => {
        active = false;
      };
    }

    async function loadAssessmentScheme() {
      setLoadingAssessment(true);

      try {
        const response = await api.get("/result-scheme", {
          params: { classId },
        });

        const result: AssessmentSchemeResponse =
          response.data?.data || {};

        const scheme = result.scheme;

        const components: AssessmentComponent[] =
          Array.isArray(scheme?.components)
            ? scheme.components.filter(
                (component: AssessmentComponent) =>
                  component.enabled === true &&
                  typeof component.key === "string" &&
                  typeof component.label === "string" &&
                  Number.isFinite(
                    Number(component.maxScore)
                  )
              )
            : [];

        if (!active) return;

        setAssessmentComponents(components);
        setAssessmentSchemeName(scheme?.name || "");
        setAssessmentSchemeVersion(
          Number.isFinite(Number(scheme?.version))
            ? Number(scheme?.version)
            : null
        );

        if (components.length === 1) {
          setAssessmentKey(components[0].key);
        }
      } catch (err: any) {
        if (active) {
          setAssessmentComponents([]);
          setAssessmentKey("");
          setError(
            `Could not load the assessment scheme: ${errorMessage(err)}`
          );
        }
      } finally {
        if (active) {
          setLoadingAssessment(false);
        }
      }
    }

    void loadAssessmentScheme();

    return () => {
      active = false;
    };
  }, [classId]);

  // --------------------------------------------------
  // QUESTION HELPERS
  // --------------------------------------------------

  function updateQuestion(
    index: number,
    update: Partial<QuestionDraft>
  ) {
    setQuestions((current) =>
      current.map((question, i) =>
        i === index
          ? { ...question, ...update }
          : question
      )
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        const options = [...question.options];
        options[optionIndex] = value;

        return {
          ...question,
          options,
        };
      })
    );
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      emptyQuestion(),
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  // --------------------------------------------------
  // FORM SUBMISSION
  // --------------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Enter an exam title.");
      return;
    }

    if (
      !classId ||
      !subjectId ||
      !sessionId ||
      !termId
    ) {
      setError(
        "Select a class, subject, session, and term."
      );
      return;
    }

    // Validate subject assignment.
    const subjectBelongsToClass =
      availableSubjects.some(
        (subject) =>
          String(subject._id) === String(subjectId)
      );

    if (!subjectBelongsToClass) {
      setError(
        "The selected subject is not assigned to this class."
      );
      return;
    }

    // Validate assessment scheme selection.
    if (loadingAssessment) {
      setError(
        "Wait for the assessment scheme to finish loading."
      );
      return;
    }

    if (!assessmentComponents.length) {
      setError(
        "No enabled assessment components were found for this class. Configure the class assessment scheme first."
      );
      return;
    }

    const validAssessment = assessmentComponents.some(
      (component) =>
        component.key === assessmentKey &&
        component.enabled === true
    );

    if (!validAssessment) {
      setError(
        "Select a valid assessment component."
      );
      return;
    }

    // Validate duration.
    if (
      !Number.isInteger(Number(durationMinutes)) ||
      Number(durationMinutes) < 1 ||
      Number(durationMinutes) > 300
    ) {
      setError(
        "Exam duration must be between 1 and 300 minutes."
      );
      return;
    }

    // Validate schedule.
    if (!startsAt || !endsAt) {
      setError(
        "Enter the exam start and end times."
      );
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setError(
        "The end time must be after the start time."
      );
      return;
    }

    // Validate question count.
    if (
      questions.length < 1 ||
      questions.length > 200
    ) {
      setError(
        "An exam must have between 1 and 200 questions."
      );
      return;
    }

    // Validate every question.
    const invalidQuestion = questions.some(
      (question) => {
        const options = question.options;

        const uniqueOptions = new Set(
          options.map((option) =>
            option.trim().toLowerCase()
          )
        );

        return (
          !question.text.trim() ||
          options.length < 2 ||
          options.length > 6 ||
          options.some(
            (option) => !option.trim()
          ) ||
          uniqueOptions.size !== options.length ||
          !Number.isInteger(
            question.correctOptionIndex
          ) ||
          question.correctOptionIndex < 0 ||
          question.correctOptionIndex >= options.length ||
          !Number.isInteger(Number(question.marks)) ||
          Number(question.marks) < 1 ||
          Number(question.marks) > 100
        );
      }
    );

    if (invalidQuestion) {
      setError(
        "Complete every question with 2–6 unique options, a valid correct answer, and whole-number marks between 1 and 100."
      );
      return;
    }

    setSaving(true);

    try {
      await api.post("/cbt/exams", {
        title: title.trim(),
        instructions: instructions.trim(),

        classId,
        subjectId,
        sessionId,
        termId,

        // Assessment scheme integration
        assessmentKey,

        durationMinutes: Number(durationMinutes),

        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),

        shuffleQuestions,
        shuffleOptions,

        questions: questions.map((question) => ({
          ...question,
          text: question.text.trim(),
          options: question.options.map(
            (option) => option.trim()
          ),
          marks: Number(question.marks),
        })),
      });

      onCreated();
    } catch (err: any) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // STYLES
  // --------------------------------------------------

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-300";

  const disabledSubmit =
    saving ||
    loadingTerms ||
    loadingAssessment ||
    !terms.length ||
    !availableSubjects.some(
      (subject) =>
        String(subject._id) === String(subjectId)
    ) ||
    !assessmentKey;

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loadingOptions) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-slate-300">
        Loading classes, subjects, and sessions…
      </div>
    );
  }

  // --------------------------------------------------
  // FORM UI
  // --------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
    >
      {/* Header */}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            Create CBT exam
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Configure the academic details, assessment category,
            schedule, and questions.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Error */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {/* Academic details */}

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-white">
          Academic information
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Title */}

          <div className="md:col-span-2">
            <label className={labelClass}>
              Exam title
            </label>

            <input
              required
              maxLength={160}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className={fieldClass}
              placeholder="e.g. First Term Mathematics Examination"
            />
          </div>

          {/* Class */}

          <div>
            <label className={labelClass}>
              Class
            </label>

            <select
              required
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSubjectId("");
              }}
              className={fieldClass}
            >
              <option value="">
                Select class
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

          {/* Subject */}

          <div>
            <label className={labelClass}>
              Subject
            </label>

            <select
              required
              value={subjectId}
              onChange={(event) =>
                setSubjectId(event.target.value)
              }
              disabled={!classId}
              className={fieldClass}
            >
              <option value="">
                {!classId
                  ? "Select a class first"
                  : "Select subject"}
              </option>

              {availableSubjects.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              {!classId
                ? "Select a class first to see its subjects."
                : availableSubjects.length
                  ? "Showing subjects assigned to this class."
                  : "No subjects are assigned to this class."}
            </p>
          </div>

          {/* Session */}

          <div>
            <label className={labelClass}>
              Academic session
            </label>

            <select
              required
              value={sessionId}
              onChange={(event) =>
                setSessionId(event.target.value)
              }
              className={fieldClass}
            >
              <option value="">
                Select session
              </option>

              {sessions.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                  {item.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}

          <div>
            <label className={labelClass}>
              Academic term
            </label>

            <select
              required
              value={termId}
              onChange={(event) =>
                setTermId(event.target.value)
              }
              disabled={
                !sessionId ||
                loadingTerms ||
                !terms.length
              }
              className={fieldClass}
            >
              <option value="">
                {loadingTerms
                  ? "Loading terms…"
                  : "Select term"}
              </option>

              {terms.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                  {item.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment component */}

          <div className="md:col-span-2">
            <label className={labelClass}>
              Assessment component
            </label>

            <select
              required
              value={assessmentKey}
              onChange={(event) =>
                setAssessmentKey(event.target.value)
              }
              disabled={
                !classId ||
                loadingAssessment ||
                assessmentComponents.length === 0
              }
              className={fieldClass}
            >
              <option value="">
                {loadingAssessment
                  ? "Loading assessment scheme…"
                  : !classId
                    ? "Select a class first"
                    : assessmentComponents.length === 0
                      ? "No assessment scheme configured"
                      : "Select assessment component"}
              </option>

              {assessmentComponents.map((component) => (
                <option
                  key={component.key}
                  value={component.key}
                >
                  {component.label} — {component.maxScore} marks
                </option>
              ))}
            </select>

            {selectedAssessment && (
              <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] p-3">
                <p className="text-sm font-medium text-cyan-200">
                  {selectedAssessment.label}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>
                    Maximum: {selectedAssessment.maxScore} marks
                  </span>

                  <span>
                    Aggregation:{" "}
                    {selectedAssessment.aggregationMethod ||
                      "average"}
                  </span>
                </div>

                {assessmentSchemeName && (
                  <p className="mt-2 text-xs text-slate-500">
                    Scheme: {assessmentSchemeName}
                    {assessmentSchemeVersion !== null
                      ? ` · Version ${assessmentSchemeVersion}`
                      : ""}
                  </p>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-500">
              Submitted CBT marks will be assigned to this
              assessment component when results integration is
              implemented.
            </p>

            {!loadingAssessment &&
              classId &&
              assessmentComponents.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">
                  Configure an assessment scheme for this class
                  before creating a CBT exam.
                </p>
              )}
          </div>
        </div>
      </section>

      {/* Exam schedule */}

      <section className="space-y-4 border-t border-white/10 pt-5">
        <h3 className="text-base font-semibold text-white">
          Exam schedule
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Duration (minutes)
            </label>

            <input
              required
              type="number"
              min={1}
              max={300}
              step={1}
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  Number(event.target.value)
                )
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Starts at
            </label>

            <input
              required
              type="datetime-local"
              value={startsAt}
              onChange={(event) =>
                setStartsAt(event.target.value)
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Ends at
            </label>

            <input
              required
              type="datetime-local"
              value={endsAt}
              onChange={(event) =>
                setEndsAt(event.target.value)
              }
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              Instructions (optional)
            </label>

            <textarea
              rows={3}
              maxLength={5000}
              value={instructions}
              onChange={(event) =>
                setInstructions(event.target.value)
              }
              className={fieldClass}
              placeholder="Instructions students should read before starting."
            />
          </div>
        </div>
      </section>

      {/* Settings */}

      <section className="space-y-3 border-t border-white/10 pt-5">
        <h3 className="text-base font-semibold text-white">
          Exam settings
        </h3>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(event) =>
                setShuffleQuestions(event.target.checked)
              }
              disabled={saving}
            />
            Shuffle questions
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(event) =>
                setShuffleOptions(event.target.checked)
              }
              disabled={saving}
            />
            Shuffle options
          </label>
        </div>
      </section>

      {/* Questions */}

      <section className="space-y-4 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Questions ({questions.length})
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Add between 1 and 200 questions.
            </p>
          </div>

          <button
            type="button"
            disabled={
              questions.length >= 200 || saving
            }
            onClick={addQuestion}
            className="rounded-lg border border-cyan-400/30 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40"
          >
            + Add question
          </button>
        </div>

        {questions.map((question, questionIndex) => (
          <section
            key={questionIndex}
            className="space-y-4 rounded-xl border border-white/10 bg-slate-950/30 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-white">
                Question {questionIndex + 1}
              </h4>

              {questions.length > 1 && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    removeQuestion(questionIndex)
                  }
                  className="text-sm text-red-300 hover:text-red-200 disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Question text */}

            <div>
              <label className={labelClass}>
                Question text
              </label>

              <textarea
                required
                rows={2}
                maxLength={5000}
                value={question.text}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    text: event.target.value,
                  })
                }
                disabled={saving}
                className={fieldClass}
                placeholder="Enter the question"
              />
            </div>

            {/* Options */}

            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map(
                (option, optionIndex) => (
                  <div key={optionIndex}>
                    <label className={labelClass}>
                      Option{" "}
                      {String.fromCharCode(
                        65 + optionIndex
                      )}
                    </label>

                    <input
                      required
                      maxLength={1000}
                      value={option}
                      onChange={(event) =>
                        updateOption(
                          questionIndex,
                          optionIndex,
                          event.target.value
                        )
                      }
                      disabled={saving}
                      className={fieldClass}
                      placeholder={`Enter option ${optionIndex + 1}`}
                    />
                  </div>
                )
              )}
            </div>

            {/* Answer and marks */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Correct answer
                </label>

                <select
                  value={question.correctOptionIndex}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      correctOptionIndex: Number(
                        event.target.value
                      ),
                    })
                  }
                  disabled={saving}
                  className={fieldClass}
                >
                  {question.options.map(
                    (_, optionIndex) => (
                      <option
                        key={optionIndex}
                        value={optionIndex}
                      >
                        Option{" "}
                        {String.fromCharCode(
                          65 + optionIndex
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Marks
                </label>

                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={question.marks}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      marks: Number(event.target.value),
                    })
                  }
                  disabled={saving}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>
        ))}
      </section>

      {/* Footer actions */}

      <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={disabledSubmit}
          className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving exam…" : "Save as draft"}
        </button>
      </div>
    </form>
  );
}
