"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";

export type AcademicSession = {
  _id: string;
  name: string;
  isCurrent?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

export type AcademicTerm = {
  _id: string;
  name: string;
  sessionId?: string | { _id: string; name?: string };
  isCurrent?: boolean;
  order?: number;
};

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
  currentSession: string;
  currentTerm: string;
  currentSessionId: string;
  currentTermId: string;
  isCurrentPeriod: boolean;
};

const emptyStats: DashboardStats = {
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
};

function responseArray<T>(response: any): T[] {
  const data = response?.data?.data ?? response?.data;

  return Array.isArray(data) ? data : [];
}

export function useSchoolAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [periodsLoading, setPeriodsLoading] = useState(true);

  const [data, setData] = useState<DashboardData | null>(null);

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");

  const selectedSession =
    sessions.find(
      (session) => session._id === selectedSessionId
    ) || null;

  const selectedTerm =
    terms.find(
      (term) => term._id === selectedTermId
    ) || null;

  // Load sessions and default to the session marked current.
  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setPeriodsLoading(true);

      try {
        const response = await api.get("/sessions");
        const list =
          responseArray<AcademicSession>(response);

        if (cancelled) return;

        setSessions(list);

        const current =
          list.find((session) => session.isCurrent) ||
          list[0];

        setSelectedSessionId(current?._id || "");
      } catch (error) {
        console.error(
          "Failed to load academic sessions:",
          error
        );

        if (!cancelled) {
          setSessions([]);
          setSelectedSessionId("");
        }
      } finally {
        if (!cancelled) {
          setPeriodsLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load only the terms that belong to the selected session.
  useEffect(() => {
    let cancelled = false;

    async function loadTerms() {
      if (!selectedSessionId) {
        setTerms([]);
        setSelectedTermId("");
        return;
      }

      try {
        const response = await api.get("/terms", {
          params: {
            sessionId: selectedSessionId,
          },
        });

        const list =
          responseArray<AcademicTerm>(response);

        if (cancelled) return;

        setTerms(list);

        // Preserve the selected term if it belongs to this session.
        const existingSelection = list.find(
          (term) => term._id === selectedTermId
        );

        if (existingSelection) return;

        const currentTerm = list.find(
          (term) => term.isCurrent
        );

        const sessionIsCurrent =
          sessions.find(
            (session) =>
              session._id === selectedSessionId
          )?.isCurrent;

        // For an older session, default to its latest term.
        const fallbackTerm = sessionIsCurrent
          ? list[0]
          : list[list.length - 1];

        setSelectedTermId(
          currentTerm?._id ||
            fallbackTerm?._id ||
            ""
        );
      } catch (error) {
        console.error(
          "Failed to load academic terms:",
          error
        );

        if (!cancelled) {
          setTerms([]);
          setSelectedTermId("");
        }
      }
    }

    loadTerms();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, sessions]);

  // Reload all period-sensitive dashboard figures whenever
  // the selected session or term changes.
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      if (!selectedSessionId || !selectedTermId) {
        setData(null);
        setLoading(true);
        return;
      }

      try {
        setLoading(true);

        const response = await api.get(
          "/dashboard/school-admin",
          {
            params: {
              sessionId: selectedSessionId,
              termId: selectedTermId,
            },
          }
        );

        if (cancelled) return;

        const payload = response.data?.data;

        if (!payload) {
          setData(null);
          return;
        }

        const stats = payload.stats || {};

        setData({
          stats: {
            students: Number(stats.students) || 0,
            teachers: Number(stats.teachers) || 0,
            parents: Number(stats.parents) || 0,
            classes: Number(stats.classes) || 0,
            subjects: Number(stats.subjects) || 0,
            attendance: Number(stats.attendance) || 0,

            revenue: Number(stats.revenue) || 0,
            expected: Number(stats.expected) || 0,
            outstanding: Number(stats.outstanding) || 0,

            invoicesTotal:
              Number(stats.invoicesTotal) || 0,

            invoicesPaid:
              Number(stats.invoicesPaid) || 0,

            invoicesPending:
              Number(stats.invoicesPending) || 0,

            paymentsTotal:
              Number(stats.paymentsTotal) || 0,
          },

          recentAnnouncements: Array.isArray(
            payload.recentAnnouncements
          )
            ? payload.recentAnnouncements
            : [],

          recentResults: Array.isArray(
            payload.recentResults
          )
            ? payload.recentResults
            : [],

          currentSession:
            payload.currentSession || "",

          currentTerm:
            payload.currentTerm || "",

          currentSessionId:
            payload.currentSessionId || "",

          currentTermId:
            payload.currentTermId || "",

          isCurrentPeriod:
            Boolean(payload.isCurrentPeriod),
        });
      } catch (error) {
        console.error(
          "Dashboard load failed:",
          error
        );

        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, selectedTermId]);

  return {
    loading,
    periodsLoading,

    stats: data?.stats || emptyStats,

    recentAnnouncements:
      data?.recentAnnouncements || [],

    recentResults:
      data?.recentResults || [],

    sessions,
    terms,

    selectedSession,
    selectedTerm,

    selectedSessionId,
    selectedTermId,

    setSelectedSessionId,
    setSelectedTermId,

    isCurrentPeriod:
      data?.isCurrentPeriod || false,

    currentSession:
      data?.currentSession || "",

    currentTerm:
      data?.currentTerm || "",
  };
}
