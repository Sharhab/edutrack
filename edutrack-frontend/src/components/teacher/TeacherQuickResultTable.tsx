"use client";

import EmptyState from "../../components/ui/EmptyState";
import FormInput from "../../components/ui/FormInput";

import { TeacherPortalStudent } from "../../types/teacher-portal";

import {
  getGrade,
  getRemark,
  getTotalScore,
} from "../../lib/result-helpers";

export type TeacherResultDraft = {
  studentId: string;

  ca1: string;
  ca2: string;
  assignment: string;
  exam: string;
};

type TeacherQuickResultTableProps = {
  students: TeacherPortalStudent[];

  drafts: TeacherResultDraft[];

  onChangeScore: (
    studentId: string,
    field:
      | "ca1"
      | "ca2"
      | "assignment"
      | "exam",
    value: string
  ) => void;
};

export default function TeacherQuickResultTable({
  students,
  drafts,
  onChangeScore,
}: TeacherQuickResultTableProps) {
  if (!students.length) {
    return (
      <EmptyState
        title="No students found"
        description="Students assigned to this class will appear here."
      />
    );
  }

  function getDraft(studentId: string) {
    return (
      drafts.find(
        (item) =>
          item.studentId === studentId
      ) || {
        studentId,

        ca1: "",
        ca2: "",
        assignment: "",
        exam: "",
      }
    );
  }

  return (
    <div className="space-y-5">
      {students.map((student) => {
        const draft = getDraft(
          student._id
        );

        const total =
          getTotalScore(
            draft.ca1,
            draft.ca2,
            draft.assignment,
            draft.exam
          );

        const grade =
          getGrade(total);

        const remark =
          getRemark(total);

        return (
          <div
            key={student._id}
            className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
          >
            {/* HEADER */}
            <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.02] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {student.firstName}{" "}
                  {student.lastName}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Admission No:{" "}
                  {student.admissionNumber ||
                    "N/A"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-cyan-200">
                    Total
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-white">
                    {total}
                  </h3>
                </div>

                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-purple-200">
                    Grade
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-white">
                    {grade}
                  </h3>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-200">
                    Remark
                  </p>

                  <h3 className="mt-1 text-sm font-semibold text-white">
                    {remark}
                  </h3>
                </div>
              </div>
            </div>

            {/* SCORE INPUTS */}
            <div className="grid gap-5 p-5 lg:grid-cols-4">
              <FormInput
                label="CA 1 (20)"
                name={`ca1-${student._id}`}
                type="number"
                value={draft.ca1}
                placeholder="0"
                onChange={(value) =>
                  onChangeScore(
                    student._id,
                    "ca1",
                    value
                  )
                }
              />

              <FormInput
                label="CA 2 (20)"
                name={`ca2-${student._id}`}
                type="number"
                value={draft.ca2}
                placeholder="0"
                onChange={(value) =>
                  onChangeScore(
                    student._id,
                    "ca2",
                    value
                  )
                }
              />

              <FormInput
                label="Assignment (10)"
                name={`assignment-${student._id}`}
                type="number"
                value={
                  draft.assignment
                }
                placeholder="0"
                onChange={(value) =>
                  onChangeScore(
                    student._id,
                    "assignment",
                    value
                  )
                }
              />

              <FormInput
                label="Exam (50)"
                name={`exam-${student._id}`}
                type="number"
                value={draft.exam}
                placeholder="0"
                onChange={(value) =>
                  onChangeScore(
                    student._id,
                    "exam",
                    value
                  )
                }
              />
            </div>

            {/* FOOTER */}
            <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-400">
                  Standard Result Structure:
                  CA1 (20) + CA2 (20) +
                  Assignment (10) + Exam
                  (50)
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300">
                  Final Score:{" "}
                  <span className="font-bold text-white">
                    {total}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}