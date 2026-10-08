import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Supabase SSR cookies: `sb-<project-ref>-auth-token`, chunked as `...-auth-token.0`, `.1`, ...
const isAuthCookie = (name: string) => name.startsWith("sb-") && name.includes("-auth-token");

/**
 * Logout is a native form POST so the browser does a full-document navigation: no client router
 * state (hidden /todo tree) survives. Only POST is exported, so GET gets 405 and cannot log out.
 * Relative Location, like /auth/callback: the destination never depends on Host headers.
 */
export async function POST(): Promise<Response> {
  let signOutFailed = false;

  try {
    const supabase = await createClient();
    // The result does not gate logout: an expired or invalid session must still end up signed out.
    await supabase.auth.getUser();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    signOutFailed = error !== null;
  } catch {
    signOutFailed = true;
  }

  if (signOutFailed) {
    const cookieStore = await cookies();
    for (const { name } of cookieStore.getAll()) {
      if (isAuthCookie(name)) cookieStore.delete(name);
    }
  }

  return new Response(null, {
    status: 303,
    headers: { Location: "/login", "Cache-Control": "private, no-store" },
  });
}
