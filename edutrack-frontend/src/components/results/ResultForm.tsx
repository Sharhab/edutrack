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
      <SelectField
        label="Student"
        name="studentId"
        value={values.studentId}
        onChange={(value) => onChange("studentId", value)}
        options={[
          { label: "Select Student", value: "" },
          ...(students || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]}
      />

      <SelectField
        label="Class"
        name="classId"
        value={values.classId}
        onChange={(value) => onChange("classId", value)}
        options={[
          { label: "Select Class", value: "" },
          ...(classes || []).map((item) => ({
            label: item.name,
            value: item._id,
          })),
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Subject"
          name="subject"
          value={values.subject}
          onChange={(value) => onChange("subject", value)}
          options={[
            { label: "Select Subject", value: "" },
            ...(subjects || []).map((item) => ({
              label: item.name,
              value: item.name,
            })),
          ]}
        />

        <FormInput
          label="Score"
          name="score"
          type="number"
          value={values.score}
          onChange={(value) => onChange("score", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Term"
          name="term"
          value={values.term}
          onChange={(value) => onChange("term", value)}
        />

        <FormInput
          label="Session"
          name="session"
          value={values.session}
          onChange={(value) => onChange("session", value)}
        />
      </div>

      <FormInput
        label="Remark"
        name="remark"
        value={values.remark}
        onChange={(value) => onChange("remark", value)}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}