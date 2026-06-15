"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";
import { ResultFormValues } from "../../types/result";
import { ClassOption, StudentOption, SubjectOption } from "../../types/options";

type ResultFormProps = {
  values: ResultFormValues;
  students: StudentOption[];
  classes: ClassOption[];
  subjects: SubjectOption[];
  onChange: (field: keyof ResultFormValues, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export default function ResultForm({
  values,
  students,
  classes,
  subjects,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save Result",
}: ResultFormProps) {
  return (
    <div className="space-y-4">

      {/* Student */}
      <SelectField
        label="Student"
        name="studentId"
        value={values.studentId || ""}
        onChange={(value) => onChange("studentId", value)}
        options={[
          { label: "Select Student", value: "" },
          ...(students || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]}
      />

      {/* Class */}
      <SelectField
        label="Class"
        name="classId"
        value={values.classId || ""}
        onChange={(value) => onChange("classId", value)}
        options={[
          { label: "Select Class", value: "" },
          ...(classes || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]}
      />

      {/* Subject */}
      <SelectField
        label="Subject"
        name="subjectId"
        value={values.subjectId || ""}
        onChange={(value) => onChange("subjectId", value)}
        options={[
          { label: "Select Subject", value: "" },
          ...(subjects || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">

        {/* CA1 */}
        <FormInput
          label="CA 1"
          name="ca1"
          type="number"
          value={values.ca1 || ""}
          onChange={(value) => onChange("ca1", value)}
        />

        {/* CA2 */}
        <FormInput
          label="CA 2"
          name="ca2"
          type="number"
          value={values.ca2 || ""}
          onChange={(value) => onChange("ca2", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        {/* Assignment */}
        <FormInput
          label="Assignment"
          name="assignment"
          type="number"
          value={values.assignment || ""}
          onChange={(value) => onChange("assignment", value)}
        />

        {/* Exam */}
        <FormInput
          label="Exam"
          name="exam"
          type="number"
          value={values.exam || ""}
          onChange={(value) => onChange("exam", value)}
        />
      </div>

      {/* Term */}
      <SelectField
        label="Term"
        name="termId"
        value={values.termId || ""}
        onChange={(value) => onChange("termId", value)}
        options={[
          { label: "Select Term", value: "" },
          { label: "First Term", value: "first" },
          { label: "Second Term", value: "second" },
          { label: "Third Term", value: "third" },
        ]}
      />

      {/* Session */}
      <SelectField
        label="Session"
        name="sessionId"
        value={values.sessionId || ""}
        onChange={(value) => onChange("sessionId", value)}
        options={[
          { label: "Select Session", value: "" },
          { label: "2025/2026", value: "2025-2026" },
          { label: "2024/2025", value: "2024-2025" },
        ]}
      />

      {/* Remark */}
      <FormInput
        label="Remark"
        name="remark"
        value={values.remark || ""}
        onChange={(value) => onChange("remark", value)}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary w-full"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}