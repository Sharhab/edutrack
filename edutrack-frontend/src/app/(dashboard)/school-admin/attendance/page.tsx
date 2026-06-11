"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import AttendanceFiltersBar from "../../../../components/attendance/AttendanceFiltersBar";
import AttendanceStats from "../../../../components/attendance/AttendanceStats";
import AttendanceAnalytics from "../../../../components/attendance/AttendanceAnalytics";
import AttendanceTable from "../../../../components/attendance/AttendanceTable";
import { getAttendanceRecords } from "../../../../lib/attendance";
import { getClassOptions } from "../../../../lib/options";
import {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceFilters,
} from "../../../../types/attendance";
import { ClassOption } from "../../../../types/options";

const emptySummary: AttendanceSummary = {
  total: 0,
  present: 0,
  absent: 0,
  late: 0,
  attendanceRate: 0,
};

export default function SchoolAdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] =
    useState<AttendanceSummary>(emptySummary);

  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [filters, setFilters] =
    useState<AttendanceFilters>({
      classId: "",
      studentId: "",
      date: "",
    });

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [tableLoading, setTableLoading] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  function normalizeAttendanceResponse(
    data: any
  ) {
    const recordsData = Array.isArray(data)
      ? data
      : Array.isArray(data?.records)
      ? data.records
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const total = recordsData.length;

    const present = recordsData.filter(
      (item: AttendanceRecord) =>
        item.status === "present"
    ).length;

    const absent = recordsData.filter(
      (item: AttendanceRecord) =>
        item.status === "absent"
    ).length;

    const late = recordsData.filter(
      (item: AttendanceRecord) =>
        item.status === "late"
    ).length;

    return {
      records: recordsData,
      summary: data?.summary || {
        total,
        present,
        absent,
        late,
        attendanceRate: total
          ? Math.round((present / total) * 100)
          : 0,
      },
    };
  }

  async function loadClasses() {
    try {
      const data = await getClassOptions();

      console.log(
        "ATTENDANCE CLASSES:",
        data
      );

      setClasses(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "FAILED TO LOAD CLASSES:",
        error
      );

      setClasses([]);
    }
  }

  async function loadAttendance(
    nextFilters?: AttendanceFilters
  ) {
    try {
      setTableLoading(true);
      setPageError("");

      const activeFilters = {
        classId:
          nextFilters?.classId ??
          filters.classId,
        studentId:
          nextFilters?.studentId ??
          filters.studentId,
        date:
          nextFilters?.date ??
          filters.date,
      };

      console.log(
        "LOADING ATTENDANCE WITH FILTERS:",
        activeFilters
      );

      const data =
        await getAttendanceRecords(
          activeFilters
        );

      console.log(
        "ATTENDANCE API RESULT:",
        data
      );

      const normalized =
        normalizeAttendanceResponse(
          data
        );

      setRecords(normalized.records);
      setSummary(normalized.summary);
    } catch (err: unknown) {
      console.error(
        "FAILED TO LOAD ATTENDANCE:",
        err
      );

      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            `Failed to load attendance records. Status: ${
              err.response?.status ||
              "network error"
            }`
        );
      } else {
        setPageError(
          "Failed to load attendance records."
        );
      }

      setRecords([]);
      setSummary(emptySummary);
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    async function start() {
      try {
        setInitialLoading(true);

        await Promise.allSettled([
          loadClasses(),
          loadAttendance({
            classId: "",
            studentId: "",
            date: "",
          }),
        ]);
      } finally {
        setInitialLoading(false);
      }
    }

    start();
  }, []);

  if (initialLoading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load attendance"
        description={pageError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Attendance"
        subtitle="Review daily attendance records, filters, and performance summary"
      >
        <AttendanceFiltersBar
          classes={classes}
          onFilterChange={(
            nextFilters
          ) => {
            const updatedFilters = {
              classId:
                nextFilters.classId ||
                "",
              studentId:
                nextFilters.studentId ||
                "",
              date:
                nextFilters.date || "",
            };

            setFilters(
              updatedFilters
            );

            loadAttendance(
              updatedFilters
            );
          }}
        />
      </SectionCard>

      <AttendanceStats
        summary={summary}
      />

      <AttendanceAnalytics
        total={summary.total}
        present={summary.present}
        absent={summary.absent}
        late={summary.late}
        attendanceRate={
          summary.attendanceRate
        }
      />

      <SectionCard
        title="Attendance Records"
        subtitle="Filtered attendance log across classes and dates"
      >
        {tableLoading ? (
          <PageLoader />
        ) : (
          <AttendanceTable
            data={records}
          />
        )}
      </SectionCard>
    </div>
  );
}
