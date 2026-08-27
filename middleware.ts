import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = (req.auth?.user as { role?: string })?.role;
  const isAdminOrEditor = isLoggedIn && (role === "ADMIN" || role === "EDITOR");
  const isStudent = isLoggedIn && role === "STUDENT";

  // 1. Strict Admin Route Protection
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isStudent) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  // 2. Student Protected Routes (Dashboard, Profile, Notifications)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile") || pathname.startsWith("/notifications")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // If admin visits /dashboard, allow them to view it or redirect if desired (admins have user accounts too)
  }

  // 3. Auth pages (/login, /register) when already logged in
  if (pathname === "/login" || pathname === "/register") {
    if (isAdminOrEditor) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl.origin));
    }
    if (isStudent) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/profile/:path*", "/notifications/:path*", "/login", "/register"],
};


