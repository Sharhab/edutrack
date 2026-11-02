
"use client";

import { useEffect, useState, type FormEvent } from "react";
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
    "Could not create the exam."
  );
}

export default function ExamCreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  // Only show subjects assigned to the selected class.
  // classId must be declared before this derived value.
  const availableSubjects = subjects.filter((subject) =>
  (subject.classIds || []).some(
    (id) => String(id) === String(classId)
  )
);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    emptyQuestion(),
  ]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const [classOptions, subjectOptions, sessionOptions] =
          await Promise.all([
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
          currentSession?._id || sessionOptions[0]?._id || ""
        );
      } catch (err: any) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

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
            (term: TermOption) => term._id && term.name
          );

        setTerms(options);

        const currentTerm = options.find(
          (term) => term.isCurrent
        );

        setTermId(
          currentTerm?._id || options[0]?._id || ""
        );
      } catch (err: any) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoadingTerms(false);
      }
    }

    void loadTerms();

    return () => {
      active = false;
    };
  }, [sessionId]);

  function updateQuestion(
    index: number,
    update: Partial<QuestionDraft>
  ) {
    setQuestions((current) =>
      current.map((question, i) =>
        i === index ? { ...question, ...update } : question
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

        return { ...question, options };
      })
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Enter an exam title.");
      return;
    }

    if (!classId || !subjectId || !sessionId || !termId) {
      setError("Select a class, subject, session, and term.");
      return;
    }

    // Guard against stale or invalid subject selections.
    const subjectBelongsToClass = availableSubjects.some(
      (subject) => String(subject._id) === String(subjectId)
    );

    if (!subjectBelongsToClass) {
      setError(
        "The selected subject is not assigned to this class. Select an assigned subject or update the subject's class assignments."
      );
      return;
    }

    if (
      !Number.isInteger(Number(durationMinutes)) ||
      Number(durationMinutes) < 1 ||
      Number(durationMinutes) > 300
    ) {
      setError("Exam duration must be between 1 and 300 minutes.");
      return;
    }

    if (!startsAt || !endsAt) {
      setError("Enter the exam start and end times.");
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setError("The end time must be after the start time.");
      return;
    }

    if (questions.length === 0 || questions.length > 200) {
      setError("An exam must have between 1 and 200 questions.");
      return;
    }

    const invalidQuestion = questions.some((question) => {
      const options = question.options;

      return (
        !question.text.trim() ||
        options.length < 2 ||
        options.length > 6 ||
        options.some((option) => !option.trim()) ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= options.length ||
        !Number.isInteger(Number(question.marks)) ||
        Number(question.marks) < 1
      );
    });

    if (invalidQuestion) {
      setError(
        "Complete every question and its 2–6 options, select a valid correct answer, and use whole-number marks of at least 1."
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
        durationMinutes: Number(durationMinutes),
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        shuffleQuestions,
        shuffleOptions,
        questions: questions.map((question) => ({
          ...question,
          text: question.text.trim(),
          options: question.options.map((option) =>
            option.trim()
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

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-300";

  if (loadingOptions) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-slate-300">
        Loading classes, subjects, and sessions…
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            Create CBT exam
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Complete the exam details and add your questions.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Exam title</label>
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass}
            placeholder="e.g. First Term Mathematics Examination"
          />
        </div>

        <div>
          <label className={labelClass}>Class</label>
          <select
            required
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSubjectId("");
            }}
            className={fieldClass}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Subject</label>
          <select
            required
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={!classId}
            className={fieldClass}
          >
            <option value="">
              {!classId
                ? "Select a class first"
                : "Select subject"}
            </option>

            {availableSubjects.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          <p className="mt-1 text-xs text-slate-500">
            {!classId
              ? "Select a class first to see its assigned subjects."
              : availableSubjects.length
                ? "Showing subjects assigned to this class."
                : "No subjects are assigned to this class. Assign subjects in Subject Settings first."}
          </p>
        </div>

        <div>
          <label className={labelClass}>Academic session</label>
          <select
            required
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            className={fieldClass}
          >
            <option value="">Select session</option>
            {sessions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
                {item.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Academic term</label>
          <select
            required
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            disabled={!sessionId || loadingTerms || !terms.length}
            className={fieldClass}
          >
            <option value="">
              {loadingTerms ? "Loading terms…" : "Select term"}
            </option>
            {terms.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
                {item.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Duration (minutes)</label>
          <input
            required
            type="number"
            min={1}
            max={300}
            step={1}
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(Number(event.target.value))
            }
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Starts at</label>
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Ends at</label>
          <input
            required
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
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

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(event) =>
              setShuffleQuestions(event.target.checked)
            }
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
          />
          Shuffle options
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">
            Questions ({questions.length})
          </h3>

          <button
            type="button"
            disabled={questions.length >= 200 || saving}
            onClick={() =>
              setQuestions((current) => [
                ...current,
                emptyQuestion(),
              ])
            }
            className="rounded-lg border border-cyan-400/30 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40"
          >
            + Add question
          </button>
        </div>

        {questions.map((question, questionIndex) => (
          <section
            key={questionIndex}
            className="space-y-4 rounded-xl border border-white/10 p-4"
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
                    setQuestions((current) =>
                      current.filter(
                        (_, i) => i !== questionIndex
                      )
                    )
                  }
                  className="text-sm text-red-300 hover:text-red-200 disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className={labelClass}>Question text</label>
              <textarea
                required
                rows={2}
                value={question.text}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    text: event.target.value,
                  })
                }
                className={fieldClass}
                placeholder="Enter the question"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex}>
                  <label className={labelClass}>
                    Option {String.fromCharCode(65 + optionIndex)}
                  </label>
                  <input
                    required
                    value={option}
                    onChange={(event) =>
                      updateOption(
                        questionIndex,
                        optionIndex,
                        event.target.value
                      )
                    }
                    className={fieldClass}
                    placeholder={`Enter option ${optionIndex + 1}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Correct answer</label>
                <select
                  value={question.correctOptionIndex}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      correctOptionIndex: Number(
                        event.target.value
                      ),
                    })
                  }
                  className={fieldClass}
                >
                  {question.options.map((_, optionIndex) => (
                    <option key={optionIndex} value={optionIndex}>
                      Option {String.fromCharCode(65 + optionIndex)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Marks</label>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={question.marks}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      marks: Number(event.target.value),
                    })
                  }
                  className={fieldClass}
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving ||
            loadingTerms ||
            !terms.length ||
            !availableSubjects.some(
              (subject) => String(subject._id) === String(subjectId)
            )
          }
          className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving exam…" : "Save as draft"}
        </button>
      </div>
    </form>
  );
}
