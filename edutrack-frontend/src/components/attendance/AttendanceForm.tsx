
"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";

import type {
  AttendanceFormValues,
  AttendanceStudentRow,
} from "../../types/attendance";

import type { ClassOption } from "../../types/options";

type OptionItem = {
  _id: string;
  name: string;
};

type AttendanceFormProps = {
  values: AttendanceFormValues;
  classes: ClassOption[];
  sessions?: OptionItem[];
  terms?: OptionItem[];

  onChange: <K extends keyof AttendanceFormValues>(
    field: K,
    value: AttendanceFormValues[K]
  ) => void;

  onStudentStatusChange: (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => void;

  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function AttendanceForm({
  values,
  classes,
  sessions = [],
  terms = [],
  onChange,
  onStudentStatusChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save Attendance",
}: AttendanceFormProps) {
  return (
    <div className="space-y-5 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 text-base font-bold text-slate-900">
          Attendance Details
        </h3>

        <div className="space-y-4">
          <SelectField
            label="Class"
            name="classId"
            value={values.classId}
            onChange={(value) => onChange("classId", value)}
            options={[
              { label: "Select Class", value: "" },
              ...classes.map((item) => ({
                label: item.name,
                value: item._id,
              })),
            ]}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Session"
              name="sessionId"
              value={values.sessionId}
              onChange={(value) => onChange("sessionId", value)}
              options={[
                { label: "Select Session", value: "" },
                ...sessions.map((item) => ({
                  label: item.name,
                  value: item._id,
                })),
              ]}
            />

            <SelectField
              label="Term"
              name="termId"
              value={values.termId}
              onChange={(value) => onChange("termId", value)}
              options={[
                { label: "Select Term", value: "" },
                ...terms.map((item) => ({
                  label: item.name,
                  value: item._id,
                })),
              ]}
            />
          </div>

          <FormInput
            label="Date"
            name="date"
            type="date"
            value={values.date}
            onChange={(value) => onChange("date", value)}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Student Attendance
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Select an attendance status for each student.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
            {values.records.length}
          </span>
        </div>

        {values.records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No students loaded
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Select a class and load its attendance register.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {values.records.map(
              (student: AttendanceStudentRow, index: number) => (
                <div
                  key={student.studentId}
                  className="grid grid-cols-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-sm font-bold text-cyan-800">
                      {student.studentName?.trim()
                        ? student.studentName.trim().charAt(0).toUpperCase()
                        : index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold leading-5 text-slate-900">
                        {student.studentName?.trim() ||
                          `Student ${index + 1}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Student {index + 1}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Attendance status
                    </label>

                    <SelectField
                      label=""
                      name={`status-${student.studentId}`}
                      value={student.status}
                      onChange={(value) =>
                        onStudentStatusChange(
                          student.studentId,
                          value as "present" | "absent" | "late"
                        )
                      }
                      options={[
                        { label: "Present", value: "present" },
                        { label: "Absent", value: "absent" },
                        { label: "Late", value: "late" },
                      ]}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || values.records.length === 0}
        className="btn-primary w-full rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      >
        {submitting ? "Saving attendance..." : submitLabel}
      </button>
    </div>
  );
}
