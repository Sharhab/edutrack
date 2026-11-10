
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  Clock3,
  GraduationCap,
  RefreshCw,
  Search,
  School,
  Users,
} from "lucide-react";

import StatCard from "../../../../components/ui/statCard";
import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";

import {
  getSchoolMonitoring,
  SchoolMonitoringData,
  MonitoredSchool,
  AdminStatus,
} from "../../../../lib/schoolMonitoring";

const emptyData: SchoolMonitoringData = {
  summary: {
    totalSchools: 0,
    totalStudents: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    neverLoggedInSchools: 0,
  },
  schools: [],
};

function formatDate(value?: string | null) {
  if (!value) return "Never logged in";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: AdminStatus) {
  const labels: Record<AdminStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    disabled: "Account disabled",
    never_logged_in: "Never logged in",
  };

  return labels[status];
}

function statusStyle(status: AdminStatus) {
  const styles: Record<AdminStatus, string> = {
    active:
      "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
    inactive:
      "bg-amber-500/10 text-amber-300 border-amber-400/20",
    disabled:
      "bg-red-500/10 text-red-300 border-red-400/20",
    never_logged_in:
      "bg-slate-500/10 text-slate-300 border-slate-400/20",
  };

  return styles[status];
}

function AdminInformation({
  school,
}: {
  school: MonitoredSchool;
}) {
  if (!school.schoolAdmins.length) {
    return (
      <span className="text-sm text-slate-400">
        No admin account found
      </span>
    );
  }

  return (
    <div className="space-y-3">
      {school.schoolAdmins.map((admin) => (
        <div key={admin._id}>
          <p className="font-medium text-white">
            {admin.name || "School Administrator"}
          </p>

          <p className="text-xs text-slate-400">
            {admin.email}
          </p>

          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${statusStyle(
              admin.status
            )}`}
          >
            {statusLabel(admin.status)}
          </span>

          <p className="mt-1 text-xs text-slate-500">
            Last login: {formatDate(admin.lastLogin)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function SchoolMonitoringPage() {
  const [data, setData] =
    useState<SchoolMonitoringData>(emptyData);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | AdminStatus>("all");

  async function loadData(refresh = false) {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setPageError("");

      const result = await getSchoolMonitoring();
      setData(result);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setPageError(
          error.response?.data?.message ||
            "Unable to load school monitoring data."
        );
      } else {
        setPageError(
          "Unable to load school monitoring data."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.schools.filter((school) => {
      const matchesSearch =
        !query ||
        school.name.toLowerCase().includes(query) ||
        school.slug.toLowerCase().includes(query) ||
        school.email.toLowerCase().includes(query) ||
        school.schoolAdmins.some(
          (admin) =>
            admin.name.toLowerCase().includes(query) ||
            admin.email.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "all" ||
        school.adminStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.schools, search, statusFilter]);

  if (loading) return <PageLoader />;

  if (pageError && data.schools.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Unable to load school monitoring"
          description={pageError}
        />

        <button
          onClick={() => void loadData()}
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            School Monitoring
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Monitor student enrolment and school administrator activity.
          </p>
        </div>

        <button
          onClick={() => void loadData(true)}
          disabled={refreshing}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {pageError && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          {pageError}
        </div>
      )}

      {/* MAIN STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Schools"
          value={data.summary.totalSchools.toLocaleString()}
          subtitle="Registered schools"
        />

        <StatCard
          title="Total Students"
          value={data.summary.totalStudents.toLocaleString()}
          subtitle="Across all schools"
        />

        <StatCard
          title="Active Admin Schools"
          value={data.summary.activeSchools.toLocaleString()}
          subtitle="Admin logged in within 7 days"
        />

        <StatCard
          title="Inactive Schools"
          value={(
            data.summary.inactiveSchools +
            data.summary.neverLoggedInSchools
          ).toLocaleString()}
          subtitle="Inactive or never logged in"
        />

      </div>

      {/* ADMIN STATUS */}
      <div className="grid gap-4 sm:grid-cols-3">

        <div className="card flex items-center gap-3 rounded-2xl p-4">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
            <Activity size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Active
            </p>
            <p className="text-xl font-semibold text-white">
              {data.summary.activeSchools}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-3 rounded-2xl p-4">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-300">
            <Clock3 size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Inactive
            </p>
            <p className="text-xl font-semibold text-white">
              {data.summary.inactiveSchools}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-3 rounded-2xl p-4">
          <div className="rounded-xl bg-slate-500/10 p-3 text-slate-300">
            <Users size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Never logged in
            </p>
            <p className="text-xl font-semibold text-white">
              {data.summary.neverLoggedInSchools}
            </p>
          </div>
        </div>

      </div>

      {/* SCHOOL TABLE */}
      <SectionCard
        title="Schools"
        subtitle="Student enrolment and administrator login status"
      >

        <div className="mb-5 flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search school or administrator..."
              className="input pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | AdminStatus
              )
            }
            className="input w-full md:w-56"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="never_logged_in">
              Never logged in
            </option>
            <option value="disabled">
              Account disabled
            </option>
          </select>

        </div>

        {filteredSchools.length === 0 ? (
          <EmptyState
            title="No schools found"
            description="Try another search or status filter."
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left text-sm">

              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">School</th>
                  <th className="px-3 py-3">Students</th>
                  <th className="px-3 py-3">Administrator</th>
                  <th className="px-3 py-3">Last Login</th>
                  <th className="px-3 py-3">School Access</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">

                {filteredSchools.map((school) => (
                  <tr
                    key={school._id}
                    className="align-top hover:bg-white/[0.025]"
                  >

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
                          <School size={18} />
                        </div>

                        <div>
                          <p className="font-semibold text-white">
                            {school.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {school.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <GraduationCap
                          size={17}
                          className="text-cyan-300"
                        />
                        {school.totalStudents.toLocaleString()}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {school.activeStudents.toLocaleString()} active
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      <AdminInformation school={school} />
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {formatDate(school.lastAdminLogin)}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          school.isActive
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : "border-red-400/20 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {school.isActive ? "Enabled" : "Disabled"}
                      </span>

                      <p className="mt-2 text-xs capitalize text-slate-500">
                        {school.subscriptionStatus || "Unknown"}
                      </p>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Showing {filteredSchools.length} of {data.schools.length} schools.
          Active means at least one enabled school administrator logged in
          within the last seven days.
        </p>

      </SectionCard>
    </div>
  );
}
