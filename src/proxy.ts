import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/register", "/"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // 4. Redirect Logic
  
  // Scenario: User tries to access protected route without being logged in
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Scenario: User is logged in (CLIENT) but tries to go to login page -> redirect to dashboard
  if (isPublicRoute && session?.role === 'CLIENT' && path === '/login') {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Scenario: Role-based access control for Dashboard
  if (path.startsWith("/dashboard") && session?.role !== "CLIENT") {
    // Logged in but not a CLIENT (e.g., Evaluator)
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
