export type UserRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "parent";

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  role: "super_admin" | "school_admin" | "teacher" | "parent";
  schoolId?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}