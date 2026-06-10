"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { getTenants } from "@/lib/tenants";
import { Tenant } from "@/types/tenant";
import PlanBadge from "@/components/tenants/PlanBadge";

export default function SuperAdminDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    premium: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getTenants();
      setTenants(data.tenants);
      setSummary(data.summary);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load super admin dashboard."
        );
      } else {
        setPageError("Failed to load super admin dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load super admin dashboard"
        description={pageError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tenants" value={summary.total} />
        <StatCard title="Active Tenants" value={summary.active} />
        <StatCard title="Inactive Tenants" value={summary.inactive} />
        <StatCard title="Premium Tenants" value={summary.premium} />
      </div>

      <SectionCard
        title="Recently Added Schools"
        subtitle="Latest onboarded school tenants"
      >
        <div className="space-y-3">
          {tenants.slice(0, 5).map((tenant) => (
            <div
              key={tenant._id}
              className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-white">{tenant.schoolName}</p>
                <p className="text-sm text-slate-400">{tenant.adminEmail}</p>
              </div>

              <div className="flex items-center gap-3">
                <PlanBadge plan={tenant.plan} />
                <span className="text-xs text-slate-500 capitalize">
                  {tenant.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}