import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSubdomain(hostname: string) {
  hostname = hostname.split(":")[0].toLowerCase();

  const ROOT_DOMAIN = "edutrack.cloud";

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

  const hostname = req.headers.get("host") || "";
  const subdomain = getSubdomain(hostname);

  const { pathname } = req.nextUrl;

  console.log("HOST:", hostname);
  console.log("SUBDOMAIN:", subdomain);
console.log("PATH:", pathname);

  /**
   * ==================================
   * TENANT SUBDOMAIN ROUTING
   * ==================================
   */
  if (subdomain) {
    const url = req.nextUrl.clone();

    // Root of subdomain
    // demo-academic.edutrack.cloud
    if (pathname === "/") {
      url.pathname = `/school/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    // Optional:
    // demo-academic.edutrack.cloud/login
   if (subdomain) {
  const url = req.nextUrl.clone();

  const publicRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  if (pathname === "/") {
    url.pathname = `/school/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
}
  }

  const isLogin = pathname === "/login";

  const isProtected =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/school-admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/parent");

  /**
   * ==================================
   * AUTH CHECK
   * ==================================
   */

  if (!token && isProtected) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  if (isProtected) {
    if (
      pathname.startsWith("/super-admin") &&
      role !== "super_admin"
    ) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    if (
      pathname.startsWith("/school-admin") &&
      role !== "school_admin"
    ) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    if (
      pathname.startsWith("/teacher") &&
      role !== "teacher"
    ) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    if (
      pathname.startsWith("/parent") &&
      role !== "parent"
    ) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
  }

  /**
   * ==================================
   * ALREADY LOGGED IN
   * ==================================
   */

  if (token && isLogin) {
    if (role === "super_admin") {
      return NextResponse.redirect(
        new URL("/super-admin", req.url)
      );
    }

    if (role === "school_admin") {
      return NextResponse.redirect(
        new URL("/school-admin", req.url)
      );
    }

    if (role === "teacher") {
      return NextResponse.redirect(
        new URL("/teacher", req.url)
      );
    }

    if (role === "parent") {
      return NextResponse.redirect(
        new URL("/parent", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};