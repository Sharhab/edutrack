import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/login";
  const isProtected =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/school-admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/parent");

  // ❌ NOT LOGGED IN
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ❌ LOGGED IN BUT WRONG ROLE
  if (isProtected) {
    if (pathname.startsWith("/super-admin") && role !== "super_admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/school-admin") && role !== "school_admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/teacher") && role !== "teacher") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/parent") && role !== "parent") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ❌ LOGGED IN → PREVENT GOING BACK TO LOGIN
  if (token && isLogin) {
    if (role === "super_admin") {
      return NextResponse.redirect(new URL("/super-admin", req.url));
    }
    if (role === "school_admin") {
      return NextResponse.redirect(new URL("/school-admin", req.url));
    }
    if (role === "teacher") {
      return NextResponse.redirect(new URL("/teacher", req.url));
    }
    if (role === "parent") {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};