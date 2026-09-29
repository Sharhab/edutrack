import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = "edutrack.cloud";

function getSubdomain(hostname: string) {
  hostname = hostname.split(":")[0].toLowerCase();

  if (
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname.includes("localhost") ||
    hostname.endsWith(".onrender.com")
  ) {
    return null;
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.replace(`.${ROOT_DOMAIN}`, "");
  }

  return null;
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  const host = req.headers.get("host") || "";
  const subdomain = getSubdomain(host);

  const url = req.nextUrl.clone();
  const { pathname } = url;

  const publicRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  const isProtected =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/school-admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/parent");

  /**
   * =========================
   * SUBDOMAIN ROUTING
   * =========================
   */
  if (subdomain) {
    url.searchParams.set("school", subdomain);

    if (pathname === "/") {
      url.pathname = `/school/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }
  }

  /**
   * =========================
   * AUTH GUARDS
   * =========================
   */
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isProtected && role) {
    if (
      pathname.startsWith("/super-admin") &&
      role !== "super_admin"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (
      pathname.startsWith("/school-admin") &&
      role !== "school_admin"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (
      pathname.startsWith("/teacher") &&
      role !== "teacher"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (
      pathname.startsWith("/parent") &&
      role !== "parent"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  /**
   * =========================
   * REDIRECT LOGGED IN USERS
   * =========================
   */
  if (token && pathname === "/login") {
    const redirects: Record<string, string> = {
      super_admin: "/super-admin",
      school_admin: "/school-admin",
      teacher: "/teacher",
      parent: "/parent",
    };

    return NextResponse.redirect(
      new URL(redirects[role || ""] || "/", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};