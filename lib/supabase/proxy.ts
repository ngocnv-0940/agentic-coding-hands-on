import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "./config";

const LOGIN_PATH = "/login";
const TODO_PATH = "/todo";

function isProtectedPath(pathname: string): boolean {
  return pathname === TODO_PATH || pathname.startsWith(`${TODO_PATH}/`);
}

/**
 * Refreshes the Supabase session cookies and applies the route guards (DEC-001).
 * Decisions use `getUser()` (verified by the Auth server), never `getSession()`.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // BR-003: let /auth/callback finish the code exchange without touching cookies here.
  if (pathname.startsWith("/auth/")) return NextResponse.next();

  let response = NextResponse.next({ request });
  // Cache headers Supabase asks for whenever it writes auth cookies (no shared caching).
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        cacheHeaders = headers;
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nothing may run between client creation and getUser(): it is what refreshes the session.
  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth server unreachable: fail closed (treated as signed out).
    user = null;
  }

  // BR-004: every redirect carries the refreshed cookies and cache headers.
  const redirectWithCookies = (path: string): NextResponse => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) => redirect.headers.set(key, value));
    return redirect;
  };

  if (!user && isProtectedPath(pathname)) return redirectWithCookies(LOGIN_PATH);
  if (user && pathname === LOGIN_PATH) return redirectWithCookies(TODO_PATH);
  return response;
}
