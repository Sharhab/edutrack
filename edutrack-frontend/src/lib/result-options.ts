import {
  getClassOptions,
  getStudentOptions,
  getSubjectOptions,
} from "./options";
export function getTotalScore(caScore: string | number, examScore: string | number) {
  const ca = Number(caScore) || 0;
  const exam = Number(examScore) || 0;
  return ca + exam;
}

export function getGrade(total: number) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export function getRemark(total: number) {
  if (total >= 70) return "Excellent";
  if (total >= 60) return "Very Good";
  if (total >= 50) return "Good";
  if (total >= 45) return "Fair";
  if (total >= 40) return "Pass";
  return "Fail";
}

export async function getResultClassOptions() {
  return getClassOptions();
}

export async function getResultStudentOptions() {
  return getStudentOptions();
}

export async function getResultSubjectOptions() {
  return getSubjectOptions();
}