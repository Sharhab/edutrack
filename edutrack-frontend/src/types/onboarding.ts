/**
 * =========================
 * FRONTEND FORM VALUES
 * =========================
 */
export interface OnboardingFormValues {
  schoolName: string;
  slug: string;

  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;

  phone: string;
  address: string;

  plan: "starter" | "growth" | "premium";

  billingCycle: "monthly" | "quarterly" | "yearly";

  adminPassword: string;
  confirmPassword: string;
}
/**
 * =========================
 * PAYMENT INIT (TEMP SAAS STATE)
 * =========================
 * NO SCHOOL CREATED YET
 */
export interface OnboardingPaymentInitPayload {
  schoolName: string;

  adminFirstName: string;
  adminLastName: string;

  adminEmail: string;
  adminPassword: string;

  phone?: string;
  address?: string;

  plan: "starter" | "growth" | "premium";

  billingCycle: "monthly" | "quarterly" | "yearly";

  amount: number;

  callbackUrl?: string;

  /**
   * CRITICAL: stored for webhook recovery
   */
  metadata?: Record<string, any>;
}

/**
 * =========================
 * PAYSTACK INIT RESPONSE
 * =========================
 */
export interface OnboardingPaymentResponse {
  success: boolean;
  authorizationUrl: string;
  reference: string;
}

/**
 * =========================
 * FINAL RESPONSE (AFTER PAYMENT WEBHOOK)
 * =========================
 */
export interface OnboardingResponse {
  success: boolean;
  message?: string;

  data: {
    school: {
      _id: string;
      slug: string;
    };

    adminUser: {
      _id: string;
      email: string;
    };
  };
}