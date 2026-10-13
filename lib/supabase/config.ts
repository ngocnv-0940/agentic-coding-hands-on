// NEXT_PUBLIC_* values are inlined at build time only when read as literal
// `process.env.NEXT_PUBLIC_X` expressions, so they cannot be looked up dynamically.
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

export const supabaseUrl = required(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL",
);

export const supabasePublishableKey = required(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
);
