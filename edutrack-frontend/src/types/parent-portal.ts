export interface ParentFinanceSummary {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface ParentDashboardStats {
  totalChildren: number;
  totalPaid: number;
  totalOutstanding: number;
  totalBilled: number;
  currentTermBilled: number;
  currentTermPaid: number;
  currentTermOutstanding: number;
}
export interface ParentChild {
  _id: string;
  firstName: string;
  lastName: string;
  className?: string;
  admissionNumber?: string;
  attendanceRate?: number | string;
}

export interface Parent {
  _id: string;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  occupation?: string;
  address?: string;

  relationshipToStudent?: string;

  studentIds: string[];

  isActive?: boolean;

  createdAt?: string;
}

export interface ParentResult {
  _id: string;
  subjectName?: string;
  session?: string;
  term?: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade?: string;
  remark?: string;
}

export interface ParentAnnouncement {
  _id: string;
  title: string;
  message: string;
  target?: string;
  className?: string;
  createdAt?: string;
}

export interface ParentInvoice {
  _id: string;
  invoiceNumber?: string;
  amount?: number;
  totalAmount?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  status?: string;
  issuedAt?: string;
}

export interface ParentPayment {
  _id: string;
  amount?: number;
  paymentMethod?: string;
  status?: string;
  paidAt?: string;
  reference?: string;
}

export interface ParentFormValues {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  password: string;

  occupation: string;
  address: string;

  relationshipToStudent: string;

  studentIds: string[];

  classIds?: string[];
}


export interface ParentBulkRow {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  password: string;

  occupation?: string;
  address?: string;

  classIds: string[];
  studentIds: string[];

  relationshipToStudent?: string;

  isActive: boolean;
}



export interface ParentBulkRequest {
  rows: ParentBulkRow[];
}

export interface ParentBulkResponse {
  created: number;
  updated: number;
  failed: number;

  credentials?: {
    email: string;
    password: string;
  }[];
}

export interface ParentDashboardResponse {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    occupation?: string;
    relationshipToStudent?: string;
  };

  currentSession: string;
  currentTerm: string;

  stats: ParentDashboardStats;

  currentTermFinance: ParentFinanceSummary;

  children: ParentChild[];

  announcements: ParentAnnouncement[];

  invoices: ParentInvoice[];

  studentFees: Array<{
    _id: string;
    studentId: string | { _id: string };
    title?: string;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    status?: string;
    session?: string;
    term?: string;
    sessionId?: string;
    termId?: string;
    feePlanId?: string | {
      _id?: string;
      paymentPolicy?: {
        mode?: "full_only" | "flexible_partial" | "fixed_installment";
        minimumPaymentAmount?: number;
        installmentAmount?: number;
      };
    } | null;
  }>;

  payments: ParentPayment[];
}

export interface ParentPortalResponse
  extends ParentDashboardResponse {}

export interface ParentChildResultsResponse {
  results: ParentResult[];
}
