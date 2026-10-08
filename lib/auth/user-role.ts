import type { User } from "@supabase/supabase-js";

/**
 * DEC-004 / FR-602: admin is decided by `app_metadata.role` only. `app_metadata`
 * is writable by the service role alone; `user_metadata` is user-editable and
 * must never grant privileges.
 */
export function isAdminUser(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}
