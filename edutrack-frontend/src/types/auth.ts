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
  _id: string;

  schoolId?: string | null;

  role: UserRole;

  firstName?: string;
  lastName?: string;

  name?: string;

  email?: string;

  phone?: string;

  isActive?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}