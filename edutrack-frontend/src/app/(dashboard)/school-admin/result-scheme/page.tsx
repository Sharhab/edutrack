
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Award,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import api from "../../../../lib/axios";
import { useTenant } from "../../../../components/tenant/TenantProvider";

type Scope = "school" | "level" | "class";

type AssessmentComponent = {
  key: string;
  label: string;
  maxScore: number;
  enabled: boolean;
  order: number;
};

type ResultScheme = {
  _id?: string;
  name: string;
  scope: Scope;
  level?: string;
  classId?: string | null;
  totalMax: number;
  components: AssessmentComponent[];
  version?: number;
  source?: string;
};

type ClassOption = {
  _id: string;
  name: string;
  level?: string;
  code?: string;
};

const DEFAULT_COMPONENTS: AssessmentComponent[] = [
  { key: "assignment", label: "Assignment", maxScore: 10, enabled: true, order: 0 },
  { key: "ca1", label: "1st CA", maxScore: 10, enabled: true, order: 1 },
  { key: "ca2", label: "2nd CA", maxScore: 10, enabled: true, order: 2 },
  { key: "exam", label: "Exam", maxScore: 70, enabled: true, order: 3 },
];

const DEFAULT_SCHEME: ResultScheme = {
  name: "Standard Results Scheme",
  scope: "school",
  totalMax: 100,
  components: DEFAULT_COMPONENTS.map((item) => ({ ...item })),
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

function getResponseData(response: any): any {
  return response?.data?.data ?? response?.data;
}

function normalizeComponents(value: any): AssessmentComponent[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_COMPONENTS.map((item) => ({ ...item }));
  }

  return value.map((item: any, index: number) => ({
    key: String(item.key ?? ""),
    label: String(item.label ?? ""),
    maxScore: Number(item.maxScore ?? 0),
    enabled: item.enabled !== false,
    order: Number(item.order ?? index),
  }));
}

function validateScheme(
  scheme: ResultScheme,
  level: string,
  classId: string
): string {
  if (!scheme.name.trim()) {
    return "Enter a scheme name.";
  }

  if (scheme.scope === "level" && !level.trim()) {
    return "Enter the academic level.";
  }

  if (scheme.scope === "class" && !classId) {
    return "Select a class.";
  }

  if (!scheme.components.length || scheme
