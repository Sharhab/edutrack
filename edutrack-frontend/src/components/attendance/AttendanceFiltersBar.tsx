"use client";

import { useEffect, useState } from "react";
import SelectField from "../../components/ui/SelectField";
import { AttendanceFilters } from "../../types/attendance";

type AttendanceFiltersBarProps = {
  classes: { _id: string; name: string }[];
  students?: { _id: string; name: string }[];

  // ✅ MAKE OPTIONAL (IMPORTANT FIX)
  onFilterChange?: (filters: AttendanceFilters) => void;
};

export default function AttendanceFiltersBar({
  classes,
  students = [],
  onFilterChange,
}: AttendanceFiltersBarProps) {
  const [filters, setFilters] =
  useState<AttendanceFilters>({
    classId: "",
    studentId: "",
    date: "",
  });
  // ✅ SAFE CALL (NO CRASH)
  useEffect(() => {
    if (typeof onFilterChange === "function") {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const updateFilter = (
    key: keyof AttendanceFilters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const reset = () => {
    const cleared = {
      classId: "",
      studentId: "",
      date: "",
    };
    setFilters(cleared);

    if (typeof onFilterChange === "function") {
      onFilterChange(cleared);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      {/* CLASS */}
       {/* CLASS */}
<SelectField
  name="classId"
  label="Class"
  value={filters.classId}
  onChange={(value) => updateFilter("classId", value)}
  options={[
    { label: "All Classes", value: "" },
    ...classes.map((c) => ({
      label: c.name,
      value: c._id,
    })),
  ]}
/>

{/* STUDENT */}
<SelectField
  name="studentId"
  label="Student"
  value={filters.studentId}
  onChange={(value) =>
    updateFilter("studentId", value)
  }
  options={[
    { label: "All Students", value: "" },
    ...students.map((s) => ({
      label: s.name,
      value: s._id,
    })),
  ]}
/>
      {/* DATE */}
      <div className="flex flex-col">
        <label className="text-xs text-slate-400 mb-1">
          Date
        </label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) =>
            updateFilter("date", e.target.value)
          }
          className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-md"
        />
      </div>

      {/* RESET */}
      <button
        onClick={reset}
        className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600"
      >
        Reset
      </button>
    </div>
  );
}