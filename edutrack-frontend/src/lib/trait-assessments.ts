
import api from "./axios";

export type TraitRating = {
  traitKey: string;
  traitName: string;
  rating: number;
};

export type StudentTraitAssessment = {
  _id?: string;
  schoolId?: string;
  studentId?: string;
  classId?: string;
  sessionId?: string;
  termId?: string;
  psychomotor: TraitRating[];
  affective: TraitRating[];
  teacherComment: string;
  enteredBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClassStudentTraitAssessment = {
  student: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    admissionNumber?: string;
  };
  assessment: StudentTraitAssessment | null;
};

export type SaveStudentTraitAssessmentPayload = {
  classId: string;
  sessionId: string;
  termId: string;
  psychomotor: TraitRating[];
  affective: TraitRating[];
  teacherComment?: string;
};

/**
 * Load student trait assessments for a class and academic period.
 */
export async function getClassTraitAssessments(params: {
  classId: string;
  sessionId: string;
  termId: string;
}): Promise<ClassStudentTraitAssessment[]> {
  const { classId, sessionId, termId } = params;

  const { data } = await api.get(
    `/trait-assessments/class/${classId}`,
    {
      params: {
        sessionId,
        termId,
      },
    }
  );

  return data.data;
}

/**
 * Create or update a student's trait assessment.
 */
export async function saveStudentTraitAssessment(
  studentId: string,
  payload: SaveStudentTraitAssessmentPayload
): Promise<StudentTraitAssessment> {
  const { data } = await api.put(
    `/trait-assessments/student/${studentId}`,
    payload
  );

  return data.data;
}
