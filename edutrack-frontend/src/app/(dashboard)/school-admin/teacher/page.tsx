"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import { getTeacherDashboard } from "../../../../lib/dashboard";

import { TeacherDashboardData } from "../../../../types/dashboard";

import StatCard from "../../../../components/ui/statCard";
import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import AnnouncementList from "../../../../components/dashboard/AnnouncementList";

type TeacherClass = {
  _id: string;
  name: string;
  level?: string;
  studentCount?: number;
};

type TeacherSubject = {
  _id: string;
  name: string;
  code?: string;
};

export default function TeacherDashboardPage() {
  const [data, setData] =
    useState<TeacherDashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [classes, setClasses] =
    useState<TeacherClass[]>([]);

  const [subjects, setSubjects] =
    useState<TeacherSubject[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getTeacherDashboard();

        if (!mounted) return;

        setData(result);

        setClasses(result?.myClasses || []);
        setSubjects(result?.mySubjects || []);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load teacher dashboard."
          );
        } else {
          setError(
            "Failed to load teacher dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data found"
        description="No teacher dashboard information was returned."
      />
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="My Classes"
          value={data?.stats?.myClasses || 0}
        />

        <StatCard
          title="Students"
          value={data?.stats?.students || 0}
        />

        <StatCard
          title="Attendance Pending"
          value={data?.stats?.attendancePending || 0}
        />

        <StatCard
          title="Results Drafted"
          value={data?.stats?.resultsDrafted || 0}
        />

      </div>

      <div className="grid gap-6 xl:grid-cols-3">

        <div className="space-y-6 xl:col-span-2">

          <SectionCard
            title="My Classes"
            subtitle="Classes assigned to you"
          >
            <div className="space-y-4">

              {classes.length === 0 ? (
                <EmptyState
                  title="No classes assigned"
                  description="Your assigned classes will appear here."
                />
              ) : (
                classes.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.name}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {item.level || "Class"}
                      </p>
                    </div>

                    <div className="text-right">

                      <h4 className="text-xl font-bold text-cyan-300">
                        {item.studentCount || 0}
                      </h4>

                      <p className="text-xs text-slate-400">
                        Students
                      </p>

                    </div>

                  </div>
                ))
              )}

            </div>
          </SectionCard>

          <SectionCard
            title="My Subjects"
            subtitle="Subjects you teach"
          >
            <div className="grid gap-4 md:grid-cols-2">

              {subjects.length === 0 ? (
                <EmptyState
                  title="No subjects assigned"
                  description="Your assigned subjects will appear here."
                />
              ) : (
                subjects.map((subject) => (
                  <div
                    key={subject._id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {subject.name}
                    </h3>

                    <p className="mt-2 text-sm text-cyan-300">
                      {subject.code || "No Code"}
                    </p>

                  </div>
                ))
              )}

            </div>
          </SectionCard>

          <SectionCard
            title="Recent Announcements"
            subtitle="Updates from school management"
          >
           <AnnouncementList
  items={
    (data?.recentAnnouncements || []).map((item) => ({
      _id: item._id,
      title: item.title || "",
      message: item.message ?? "",   // 🔥 FIX HERE
      createdAt: item.createdAt,
    }))
  }
/>
          </SectionCard>

        </div>

        <div className="space-y-6 xl:col-span-1">

          <SectionCard
            title="Quick Actions"
            subtitle="Teacher shortcuts"
          >
            <div className="grid gap-3">

              <Link
                href="/teacher/attendance"
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-cyan-400"
              >
                Take Attendance
              </Link>

              <Link
                href="/teacher/results"
                className="rounded-2xl bg-green-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-400"
              >
                Enter Results
              </Link>

              <Link
                href="/teacher/classes"
                className="rounded-2xl bg-purple-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-400"
              >
                View Classes
              </Link>

              <Link
                href="/teacher/results"
                className="rounded-2xl bg-yellow-500 px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-yellow-400"
              >
                Manage Results
              </Link>

            </div>
          </SectionCard>

          <SectionCard
            title="Work Summary"
            subtitle="Current academic workload"
          >
            <div className="space-y-4">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">
                  Total Classes
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  {classes.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">
                  Total Subjects
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  {subjects.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">
                  Pending Attendance
                </p>

                <h3 className="mt-2 text-2xl font-bold text-yellow-300">
                  {data?.stats?.attendancePending || 0}
                </h3>
              </div>

            </div>
          </SectionCard>

        </div>

      </div>

    </div>
  );
}