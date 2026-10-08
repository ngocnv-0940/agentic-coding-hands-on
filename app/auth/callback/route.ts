import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUCCESS_PATH = "/todo";
// BR-001: one fixed flag; provider error text is never forwarded.
const FAILURE_PATH = "/login?error=auth_failed";
const MAX_CODE_LENGTH = 2048;

/**
 * Relative Location on purpose: the destination never depends on Host or
 * X-Forwarded-Host, so a spoofed header cannot turn this into an open redirect.
 * Session cookies written by the Supabase client are merged in by Next.
 */
function redirectTo(path: string): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: path, "Cache-Control": "private, no-store" },
  });
}

async function exchangeCode(code: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  } catch {
    return false;
  }
}

// DEC-002 / BR-002: success always lands on /todo; `next` is never read.
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (searchParams.has("error") || !code || code.length > MAX_CODE_LENGTH) {
    return redirectTo(FAILURE_PATH);
  }

  return redirectTo((await exchangeCode(code)) ? SUCCESS_PATH : FAILURE_PATH);
}
