"use client";

import { AnnouncementFormValues } from "../../types/announcement";
import { ClassOption } from "../../types/options";
import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";

type Props = {
  values: AnnouncementFormValues;
  classes: ClassOption[];
  onChange: (field: keyof AnnouncementFormValues, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export default function AnnouncementForm({
  values,
  classes,
  onChange,
  onSubmit,
  submitting = false,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <FormInput
        label="Title"
        name="title"
        value={values.title}
        onChange={(v) => onChange("title", v)}
      />

      {/* Message */}
      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Message
        </label>
        <textarea
          className="input h-32 resize-none"
          placeholder="Write announcement..."
          value={values.message}
          onChange={(e) => onChange("message", e.target.value)}
        />
      </div>

      {/* Target */}
      <SelectField
        label="Target"
        name="target"
        value={values.target}
        onChange={(v) => onChange("target", v)}
        options={[
          { label: "All", value: "all" },
          { label: "Students", value: "students" },
          { label: "Teachers", value: "teachers" },
          { label: "Parents", value: "parents" },
        ]}
      />

      {/* Conditional Class */}
      {values.target === "students" && (
        <SelectField
          label="Class"
          name="classId"
          value={values.classId}
          onChange={(v) => onChange("classId", v)}
          options={[
            { label: "Select Class", value: "" },
            ...(classes || []).map((c) => ({
              label: c.name,
              value: c._id,
            })),
          ]}
        />
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary w-full"
      >
        {submitting ? "Saving..." : "Save Announcement"}
      </button>
    </div>
  );
}