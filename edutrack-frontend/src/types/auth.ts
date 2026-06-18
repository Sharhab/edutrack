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
  id: string;
  _id?: string;
  name?: string;
  email?: string;
  role: UserRole;
  schoolId?: string | null;
  tenant?: AuthTenant | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}