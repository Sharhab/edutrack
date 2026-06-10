import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  const subdomain = host.split(".")[0];

  // ignore main domain
  if (subdomain === "edutrack" || subdomain === "www") {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();

  // attach school slug
  url.searchParams.set("school", subdomain);

  return NextResponse.rewrite(url);
}