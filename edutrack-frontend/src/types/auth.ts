export type UserRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "parent";

export interface AuthUser {
  id: string;
  _id?: string;
  name?: string;
  email?: string;

  role: "super_admin" | "school_admin" | "teacher" | "parent";
  schoolId?: string | null;

  // ✅ ADD THIS (SaaS context, optional)
  tenant?: {
    _id: string;
    slug: string;
    schoolName: string;
    domain?: string;
    status?: string;
    subscriptionStatus?: string;
  } | null;
}
