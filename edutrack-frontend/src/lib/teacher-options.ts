import api from "../lib/axios";
import { SubjectOption } from "../types/options";
import { ClassOption } from "../types/options";

type SubjectListResponse =
  | SubjectOption[]
  | {
      subjects?: SubjectOption[];
      data?: SubjectOption[];
    };

type ClassListResponse =
  | ClassOption[]
  | {
      classes?: ClassOption[];
      data?: ClassOption[];
    };

const OPTION_ENDPOINTS = {
  subjects: "/subjects",
  classes: "/classes",
};

export async function getSubjectOptions(): Promise<SubjectOption[]> {
  const { data } = await api.get<SubjectListResponse>(OPTION_ENDPOINTS.subjects);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.subjects)) return data.subjects;
  if (Array.isArray(data.data)) return data.data;

  return [];
}

export async function getTeacherClassOptions(): Promise<ClassOption[]> {
  const { data } = await api.get<ClassListResponse>(OPTION_ENDPOINTS.classes);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.classes)) return data.classes;
  if (Array.isArray(data.data)) return data.data;

  return [];
}