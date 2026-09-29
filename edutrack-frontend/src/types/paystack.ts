export interface InitializePaystackPayload {
  /**
   * SCHOOL ID
   * generated after onboarding
   */
  schoolId: string;

  /**
   * SCHOOL PLAN
   */
  plan:
    | "starter"
    | "growth"
    | "premium";

  /**
   * PAYMENT AMOUNT
   */
  amount: number;

  /**
   * ADMIN/SCHOOL EMAIL
   */
  email: string;

  /**
   * BILLING CYCLE
   */
  billingCycle:
    | "monthly"
    | "quarterly"
    | "yearly";

  /**
   * OPTIONAL CALLBACK
   */
  callbackUrl?: string;
}

export interface InitializePaystackResponse {
  success: boolean;

  message?: string;

  authorizationUrl: string;

  accessCode?: string;

  reference: string;
}

export interface VerifyPaystackResponse {
  success: boolean;

  message?: string;

  payment?: {
    _id?: string;

    reference?: string;

    amount?: number;

    status?:
      | "paid"
      | "pending"
      | "failed";

    paidAt?: string;

    paymentMethod?: string;
  };

  subscription?: {
    _id?: string;

    schoolId?: string;

    plan?:
      | "starter"
      | "growth"
      | "premium";

    amount?: number;

    status?:
      | "active"
      | "expired"
      | "pending"
      | "cancelled";

    billingCycle?:
      | "monthly"
      | "quarterly"
      | "yearly";

    nextRenewalDate?: string;

    expiryDate?: string;
  };

  school?: {
    _id?: string;

    schoolName?: string;

    slug?: string;

    status?:
      | "active"
      | "inactive";
  };
}