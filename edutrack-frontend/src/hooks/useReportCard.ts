"use client";

import { useCallback, useRef, useState } from "react";
import api from "../lib/axios";

import {
  ClassReport,
  ClassReportResponse,
  ReportCardFilter,
  StudentReportCard,
  StudentReportCardResponse,
} from "../types/report-card";

type CacheKey = string;

export function useReportCard() {
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);

  const [error, setError] = useState("");

  const [reportCard, setReportCard] =
    useState<StudentReportCard | null>(null);

  const [classReport, setClassReport] =
    useState<ClassReport | null>(null);

  const [reportBundle, setReportBundle] =
    useState<any>(null);

  const cache = useRef<Map<CacheKey, any>>(new Map());

  /* =====================================
     CACHE KEY
  ===================================== */

  const buildKey = (url: string, params?: any) =>
    `${url}:${JSON.stringify(params || {})}`;

  /* =====================================
     RESET
  ===================================== */

  const reset = useCallback(() => {
    setError("");
    setReportCard(null);
    setClassReport(null);
    setReportBundle(null);
  }, []);

  /* =====================================
     STUDENT REPORT
  ===================================== */

  const fetchStudentReportCard = useCallback(
    async (studentId: string, params: ReportCardFilter) => {
      const key = buildKey(`/student/${studentId}`, params);

      if (cache.current.has(key)) {
        const cached = cache.current.get(key);
        setReportCard(cached);
        return cached;
      }

      try {
        setLoading(true);
        setError("");

        const query = new URLSearchParams({
          sessionId: params.sessionId || "",
          termId: params.termId || "",
        }).toString();

        const { data } = await api.get<StudentReportCardResponse>(
          `/report-cards/student/${studentId}?${query}`
        );

        const report = data?.reportCard;

        cache.current.set(key, report);
        setReportCard(report);

        return report;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to load student report card"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* =====================================
     CLASS REPORT (FIXED)
  ===================================== */

  const fetchClassReport = useCallback(
    async (params: ReportCardFilter) => {
      if (!params.classId) {
        setError("Class is required");
        return null;
      }

      const key = buildKey("/class-report", params);

      if (cache.current.has(key)) {
        const cached = cache.current.get(key);
        setClassReport(cached);
        return cached;
      }

      try {
        setClassLoading(true);
        setError("");

        const query = new URLSearchParams({
          sessionId: params.sessionId || "",
          termId: params.termId || "",
        }).toString();

        const { data } = await api.get<ClassReportResponse>(
          `/report-cards/class/${params.classId}?${query}`
        );

        const report = data?.classReport;

        cache.current.set(key, report);
        setClassReport(report);

        return report;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to load class report"
        );
        return null;
      } finally {
        setClassLoading(false);
      }
    },
    []
  );

  /* =====================================
     CLASS REPORT BUNDLE (FIXED ONCE ONLY)
  ===================================== */

  const fetchClassReportCardsBundle = useCallback(
    async ({
      classId,
      sessionId,
      termId,
    }: {
      classId: string;
      sessionId: string;
      termId: string;
    }) => {
      const key = buildKey("/class-report-bundle", {
        classId,
        sessionId,
        termId,
      });

      if (cache.current.has(key)) {
        const cached = cache.current.get(key);
        setReportBundle(cached);
        return cached;
      }

      try {
        setBundleLoading(true);
        setError("");

        const query = new URLSearchParams({
          sessionId,
          termId,
        }).toString();

        const { data } = await api.get(
          `/report-cards/class/${classId}/bundle?${query}`
        );

        /**
         * FIX: backend returns raw object (NOT reportBundle wrapper)
         */
        const bundle = {
          class: data.class,
          sessionId: data.sessionId,
          termId: data.termId,
          totalStudents: data.totalStudents,
          reports: data.reports || [],
          generatedAt: data.generatedAt,
        };

        cache.current.set(key, bundle);
        setReportBundle(bundle);

        return bundle;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to load report cards bundle"
        );
        return null;
      } finally {
        setBundleLoading(false);
      }
    },
    []
  );

  /* =====================================
     RETURN
  ===================================== */

  return {
    loading,
    classLoading,
    bundleLoading,
    error,

    reportCard,
    classReport,
    reportBundle,

    fetchStudentReportCard,
    fetchClassReport,
    fetchClassReportCardsBundle,

    reset,
  };
}