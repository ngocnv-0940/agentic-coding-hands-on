import { createClient } from "@/lib/supabase/client";

export interface SignInWithGoogleResult {
  /** false when the OAuth redirect could not be started (FR-403); true means navigation began. */
  ok: boolean;
}

/**
 * Browser-only: starts the same-tab Google OAuth (PKCE) flow. The Supabase client
 * stores the code verifier cookie and navigates to the authorize URL, which comes
 * back to /auth/callback on this origin. Never throws.
 */
export async function signInWithGoogle(): Promise<SignInWithGoogleResult> {
  try {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
