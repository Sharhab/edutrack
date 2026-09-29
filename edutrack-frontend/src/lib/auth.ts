import { AuthUser, UserRole } from "../types/auth";

/**
 * DASHBOARD ROUTES
 */
export function getDashboardRoute(role: UserRole) {
  switch (role) {
    case "super_admin":
      return "/super-admin";

    case "school_admin":
      return "/school-admin";

    case "teacher":
      return "/teacher";

    case "parent":
      return "/parent";

    case "student":
      return "/student";

    default:
      return "/login";
  }
}

/**
 * ROLE ACCESS CONTROL
 */
export function isAllowedPath(
  role: UserRole | string,
  pathname: string
) {
  if (pathname.startsWith("/super-admin")) {
    return role === "super_admin";
  }

  if (pathname.startsWith("/school-admin")) {
    return role === "school_admin";
  }

  if (pathname.startsWith("/teacher")) {
    return role === "teacher";
  }

  if (pathname.startsWith("/parent")) {
    return role === "parent";
  }

  if (pathname.startsWith("/student")) {
    return role === "student";
  }

  return true;
}

/**
 * INITIALS HELPER
 */
export function getInitials(name?: string) {
  if (!name) return "ET";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * SAFE USER PARSER
 */
export function safeParseUser(
  value?: string
): AuthUser | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}