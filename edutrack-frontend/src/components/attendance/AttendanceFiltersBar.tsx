"use client";

import { useState } from "react";
import SelectField from "../../components/ui/SelectField";
import { AttendanceFilters } from "../../types/attendance";

type Props = {
  classes: { _id: string; name: string }[];
  students?: { _id: string; name: string }[];
  onFilterChange: (filters: AttendanceFilters) => void;
};

export default function AttendanceFiltersBar({
  classes,
  students = [],
  onFilterChange,
}: Props) {
  const [filters, setFilters] = useState<AttendanceFilters>({
    classId: "",
    studentId: "",
    date: "",
  });

  const updateFilter = (key: keyof AttendanceFilters, value: string) => {
    const updated = {
      ...filters,
      [key]: value,
    };

    setFilters(updated);
  };

  const apply = () => {
    onFilterChange(filters);
  };

  const reset = () => {
    const cleared = {
      classId: "",
      studentId: "",
      date: "",
    };

    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
       <SelectField
  name="classId"
  label="Class"
  value={filters.classId ?? ""}
  onChange={(v) => updateFilter("classId", v)}
  options={[
    { label: "All Classes", value: "" },
    ...classes.map((c) => ({
      label: c.name,
      value: c._id,
    })),
  ]}
/>

      <SelectField
        name="studentId"
        label="Student"
        value={filters.studentId ?? ""}
        onChange={(v) => updateFilter("studentId", v)}
        options={[
          { label: "All Students", value: "" },
          ...students.map((s) => ({
            label: s.name,
            value: s._id,
          })),
        ]}
      />

      <input
        type="date"
        value={filters.date}
        onChange={(e) => updateFilter("date", e.target.value)}
        className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-md"
      />

      <button onClick={apply}>Apply</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}