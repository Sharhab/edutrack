"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";

/* =========================================
   TYPES
========================================= */
type DashboardStats = {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  subjects: number;
  attendance: number;

  revenue: number;
  expected: number;
  outstanding: number;

  invoicesTotal: number;
  invoicesPaid: number;
  invoicesPending: number;

  paymentsTotal: number;
};

type DashboardData = {
  stats: DashboardStats;
  recentAnnouncements: any[];
  recentResults: any[];
};

/* =========================================
   HOOK
========================================= */
export function useSchoolAdminDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardData | null>(null);

  async function fetchDashboard() {
    try {
      setLoading(true);

      const res = await api.get("/dashboard/school-admin");

      const payload = res.data?.data;

      console.log("RAW DASHBOARD RESPONSE:", payload);

      if (!payload) {
        setData(null);
        return;
      }

      const formatted: DashboardData = {
        /* =====================================
           STATS (DIRECT MAPPING - NO GUESSING)
        ===================================== */
        stats: {
          students: Number(payload.stats?.students) || 0,
          teachers: Number(payload.stats?.teachers) || 0,
          parents: Number(payload.stats?.parents) || 0,
          classes: Number(payload.stats?.classes) || 0,
          subjects: Number(payload.stats?.subjects) || 0,
          attendance: Number(payload.stats?.attendance) || 0,

          revenue: Number(payload.stats?.revenue) || 0,
          expected: Number(payload.stats?.expected) || 0,
          outstanding: Number(payload.stats?.outstanding) || 0,

          invoicesTotal: Number(payload.stats?.invoicesTotal) || 0,
          invoicesPaid: Number(payload.stats?.invoicesPaid) || 0,
          invoicesPending: Number(payload.stats?.invoicesPending) || 0,

          paymentsTotal: Number(payload.stats?.paymentsTotal) || 0,
        },

        /* =====================================
           SAFE ARRAYS
        ===================================== */
        recentAnnouncements: Array.isArray(payload.recentAnnouncements)
          ? payload.recentAnnouncements
          : [],

        recentResults: Array.isArray(payload.recentResults)
          ? payload.recentResults
          : [],
      };

      console.log("NORMALIZED DASHBOARD:", formatted);

      setData(formatted);
    } catch (err) {
      console.error("Dashboard error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    loading,

    stats:
      data?.stats || {
        students: 0,
        teachers: 0,
        parents: 0,
        classes: 0,
        subjects: 0,
        attendance: 0,

        revenue: 0,
        expected: 0,
        outstanding: 0,

        invoicesTotal: 0,
        invoicesPaid: 0,
        invoicesPending: 0,

        paymentsTotal: 0,
      },

    recentAnnouncements: data?.recentAnnouncements || [],
    recentResults: data?.recentResults || [],

    refresh: fetchDashboard,
  };
}