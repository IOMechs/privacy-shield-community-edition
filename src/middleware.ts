import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;

  const isPublicRoute =
    req.nextUrl.pathname === "/signin" || req.nextUrl.pathname === "/signup";

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/home",
    "/signin",
    "/signup",
    "/api/destroySession/:path*",
    "/api/redact/:path*",
  ],
};
