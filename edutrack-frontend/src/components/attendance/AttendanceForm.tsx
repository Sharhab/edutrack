"use client";

import FormInput from "../../components/ui/FormInput";
import SelectField from "../../components/ui/SelectField";

import {
AttendanceFormValues,
AttendanceStudentRow,
} from "../../types/attendance";

import { ClassOption } from "../../types/options";

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
return ( <div className="space-y-6">
<SelectField
label="Class"
name="classId"
value={values.classId}
onChange={(value) =>
onChange("classId", value)
}
options={[
{
label: "Select Class",
value: "",
},

      ...classes.map((item) => ({
        label: item.name,
        value: item._id,
      })),
    ]}
  />

  <div className="grid gap-4 md:grid-cols-2">
    <SelectField
      label="Session"
      name="sessionId"
      value={values.sessionId}
      onChange={(value) =>
        onChange("sessionId", value)
      }
      options={[
        {
          label: "Select Session",
          value: "",
        },

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
      onChange={(value) =>
        onChange("termId", value)
      }
      options={[
        {
          label: "Select Term",
          value: "",
        },

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
    onChange={(value) =>
      onChange("date", value)
    }
  />

  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-white">
      Student Attendance
    </h3>

    {values.records.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">
        Select a class to load students
      </div>
    ) : (
      values.records.map(
        (
          student: AttendanceStudentRow
        ) => (
          <div
            key={student.studentId}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-medium text-white">
                {student.studentName}
              </p>
            </div>

            <div className="w-full md:w-48">
              <SelectField
                label=""
                name={`status-${student.studentId}`}
                value={student.status}
                onChange={(value) =>
                  onStudentStatusChange(
                    student.studentId,
                    value as
                      | "present"
                      | "absent"
                      | "late"
                  )
                }
                options={[
                  {
                    label: "Present",
                    value: "present",
                  },
                  {
                    label: "Absent",
                    value: "absent",
                  },
                  {
                    label: "Late",
                    value: "late",
                  },
                ]}
              />
            </div>
          </div>
        )
      )
    )}
  </div>

  <button
    type="button"
    onClick={onSubmit}
    disabled={submitting}
    className="btn-primary w-full md:w-auto"
  >
    {submitting
      ? "Saving..."
      : submitLabel}
  </button>
</div>


);
}
