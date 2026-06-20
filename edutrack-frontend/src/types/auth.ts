export type UserRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "parent"
  | "student";

export interface AuthTenant {
  _id: string;
  slug: string;
  schoolName: string;
  domain?: string;
  status?: string;
  subscriptionStatus?: string;
}

export interface AuthUser {
  _id?: string;

  firstName?: string;
  lastName?: string;

  name?: string; // optional fallback (if backend sends full name)

  email?: string;
  role: string;

  schoolId?: string;
  avatar?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}