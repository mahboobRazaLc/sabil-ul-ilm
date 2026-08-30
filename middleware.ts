import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  try {
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
    }

    // 3. Auth pages (/login, /register, /forgot-password) when already logged in
    // Note: /reset-password is NOT blocked — logged-in users need access via email link
    if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
      if (isAdminOrEditor) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl.origin));
      }
      if (isStudent) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] auth check failed:", err);
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/profile/:path*", "/notifications/:path*", "/login", "/register", "/forgot-password", "/reset-password"],
};


