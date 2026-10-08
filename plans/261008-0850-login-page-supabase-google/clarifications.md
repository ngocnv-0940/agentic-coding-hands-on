# Clarifications — Login screen (SAA 2025)

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz (fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `GzbNeVGJHz`)
Sources: `momorph/login-specs.csv` (8 items), `momorph/login-test-cases.csv` (17 cases)

## Session 2026-10-08

- Q: SDD mode for the project? → A: On (persisted to `.claude/.tkm.json`)
- Q: Spec/doc language? → A: vi
- Q: How to run Supabase (no CLI/Docker on machine)? → A: Commit `supabase/` config (`supabase init` layout, Google provider enabled in `config.toml` via env-substituted client id/secret). User installs Docker + Supabase CLI and runs `supabase start` locally; app reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key) from `.env.local` (not committed; `.env.example` committed).
- Q: Test policy (behavioral screen, no E2E runner)? → A: `e2e-red-first`; add `@playwright/test` as devDependency. Google OAuth / Supabase auth endpoints stubbed at the network boundary inside E2E tests only (never in app code).
- Q: What is /todo in this task? → A: Minimal protected page: shows signed-in user's email + Logout button. Logout → `/login`. Unauthenticated access to `/todo` → redirect `/login`. Authenticated access to `/login` → redirect `/todo`.
- Q: Language selector scope? → A: Full VN/EN switch: in-house vi/en dictionary for login strings, `NEXT_LOCALE` cookie, server-side render by locale, default `vi` (label "VN"). No i18n library.
- Q: OAuth flow: redirect or popup (spec vs TC 60bc5bbb conflict)? → A: Same-tab redirect via Supabase `signInWithOAuth` + `/auth/callback` route (PKCE code exchange). TC "new tab or popup" is superseded.
- Q: Where to show auth error "Đăng nhập không thành công. Vui lòng thử lại."? → A: Inline text under the Login button, driven by `?error=` query param set by the callback on failure/cancel.

## Derived decisions (from specs, not re-asked)

- All Google accounts are allowed (no domain restriction).
- Login button: disabled + loading indicator while the OAuth redirect is being initiated; hover shows shadow/elevation.
- Logo is static, non-interactive. Footer is fixed at bottom, non-interactive.
- Header is fixed/sticky.

## Session 2026-10-08 (spec gaps — Stage 1.5 Step 3)

- Q: [F001] Env var name for the Supabase public key? → A: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (supersedes ANON_KEY mentioned above). URL stays `NEXT_PUBLIC_SUPABASE_URL`.
- Q: [F001] How does the proxy verify the session? → A: `supabase.auth.getUser()` (authoritative; no JWKS needed in the E2E mock). `/todo` and the logout action re-check with `getUser()` server-side.
- Q: [F001] Logout scope? → A: Current device only — `signOut({ scope: 'local' })`.
- Q: [F001/F002] Dictionary scope and ownership? → A: One `lib/i18n` dictionary owned by F002, covering every Login string (title, subtitle, tagline, button, error, footer, language labels) plus /todo (email label, Logout). F001 only consumes keys.
- Q: [F002] Source of the English copy? → A: Authored by us; "ROOT FURTHER" and "LOGIN With Google" stay as-is in both locales. Editable later in the dictionary.
- Q: [F002] EN flag in the menu? → A: UK flag, same size as the VN flag.
- Q: [F001] Responsive? → A: Basic responsive: same desktop composition; below md, scale down type/padding, logo stays left and language selector right, no horizontal scroll.
- Q: [F002] NEXT_LOCALE lifetime + keyboard? → A: `max-age` 1 year, `path=/`, `SameSite=Lax`; menu toggles with Enter/Space, closes with Escape and outside click, options reachable with Tab (no arrow-key listbox).
- Q: Behaviour of / ? → A: Redirect to /login (signed-in users then go on to /todo via proxy).
- Q: P3 — raw /login query echoed (JSON-escaped) in Next RSC payload? → A: Accept and document as a known low risk (Next default; never rendered as HTML; callback only emits error=auth_failed).
- Q: Visual residual — CTA label/footer text ~2–3% wider than Figma? → A: Accepted as font-rendering tolerance (Figma vs Chromium); hero key visual matches (band 25.6/26.0).
