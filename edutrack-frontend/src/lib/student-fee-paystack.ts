import api from "./axios";

export interface InitializeStudentFeePaymentResponse {
  success: boolean;
  data?: {
    authorizationUrl: string;
    accessCode?: string;
    reference: string;
    metadata?: {
      schoolId?: string;
      studentId?: string;
      studentFeeId?: string;
      session?: string;
      term?: string;
      source?: string;
    };
  };
  message?: string;
}

export async function initializeStudentFeePaystack(
  studentFeeId: string
) {
  const { data } =
    await api.post<InitializeStudentFeePaymentResponse>(
      "/finance/paystack/initialize",
      { studentFeeId }
    );

  return data;
}
