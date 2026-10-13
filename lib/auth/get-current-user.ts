import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "./user-role";

export type CurrentUser = {
  email: string | null;
  isAdmin: boolean;
};

/**
 * Server-only (reads request cookies through `next/headers`). Memoised per
 * request with React `cache()` so the layout and page share one Auth call.
 * Uses `getUser()` (verified by the Auth server); any error fails closed → null.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { email: data.user.email ?? null, isAdmin: isAdminUser(data.user) };
  } catch {
    return null;
  }
});
