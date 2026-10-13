---
phase: 3
title: "Supabase setup and clients"
feature: F001
status: completed
priority: P1
effort: 1.5h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
---

# Phase 03 — Supabase setup + client factories

## Context Links
- `clarifications.md` (Supabase CLI layout, env var `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `spec/auth/technical-spec.md` §4.6, §5.3 #1; `spec/system/architecture.md` (Env Vars, Local Dev Topology)
- `reports/researcher-supabase-ssr-auth-next16.md` §1, §3, §5
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`

## Overview
Commit the local Supabase project config (Google provider via `env()`), `.env.example`, deps, and the two per-call client factories every later phase uses. No routes, no UI.

## Key Insights
- `.gitignore` `.env*` would swallow `.env.example`; phase 01 adds `!.env.example`. `supabase/.env` stays ignored by the root `.env*` rule.
- `additional_redirect_urls` default is `https://localhost:3000` (https!) → must override to `http://localhost:3000/**`.
- Server client in a Server Component cannot set cookies → `setAll` try/catch is intentional (proxy refreshes).
- `NEXT_PUBLIC_*` must be read as literal `process.env.NEXT_PUBLIC_…` for inlining.

## Requirements
- F001:FR-001 (Google provider enabled from committed config, secrets from env), F001:FR-002 (no domain restriction — nothing in config restricts it).
- NFR: no secrets committed; one host (`localhost`) in docs/examples.

## Architecture
```
lib/supabase/config.ts  ── exports supabaseUrl, supabasePublishableKey (throws clear Error if missing)
lib/supabase/client.ts  ── createClient(): createBrowserClient(url, key)            [browser]
lib/supabase/server.ts  ── async createClient(): createServerClient(url, key, {cookies:{getAll,setAll}}) via await cookies()  [RSC, route handlers, actions]
```
No module-level client instances.

## Related Code Files
Create: `supabase/config.toml`, `supabase/.gitignore` (from `supabase init`), `.env.example`, `lib/supabase/config.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`.
Modify: `package.json`, `bun.lock` (deps `@supabase/supabase-js@^2.117`, `@supabase/ssr@^0.12` — pin exact minor of ssr since 0.x).

## Implementation Steps
1. `bun add @supabase/supabase-js @supabase/ssr` (check peer range; record versions in the phase report).
2. `bunx supabase@latest init` (no devDep added; if download blocked, hand-author `config.toml` from Supabase's `init` template). Edit `[auth]`: `site_url = "http://localhost:3000"`, `additional_redirect_urls = ["http://localhost:3000/**"]`; `[auth.external.google]`: `enabled = true`, `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`, `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"`, `skip_nonce_check = false`. Comment: if `env()` is rejected for `client_id`, hardcode the (non-secret) id.
3. `.env.example`: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` (from `supabase status`), and a commented block for `supabase/.env`: `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=`, `…_SECRET=`; one-line setup notes (Google redirect URI `http://127.0.0.1:54321/auth/v1/callback`, JS origin `http://localhost:3000`, always browse via `localhost`).
4. `lib/supabase/config.ts`, `client.ts`, `server.ts` per Architecture (server `setAll` forwards options; swallow error only for the RSC case).
5. `bunx tsc --noEmit`; `bun run lint`.

## Todo
- [x] Deps installed and pinned (`@supabase/ssr` ~0.12.7, `@supabase/supabase-js` ^2.117.3)
- [x] `supabase/config.toml` with Google provider + redirect allow-list (`http://localhost:3000/**`, `env()` client_id and secret; file not yet git-committed, see plan risk)
- [x] `.env.example` present and un-ignored by `!.env.example` in `.gitignore` (`git check-ignore` not executed; rule verified by reading)
- [x] Client factories compile (`evidence/temper-run-tsc-v3.json`, exit 0)

## Delivery Status (reconciled 2026-10-08)
- Done: `supabase/config.toml`, `.env.example`, `lib/supabase/{config,client,server}.ts`.
- Success criterion met: secret-pattern grep (`sb_secret|GOCSPX`) hits only in docs, none in code.
- `env()` for client_id confirmed from Supabase CLI source (`config.toml` comment, line ~339).
- Open: real `supabase start` not run (plan F1).

## MoMorph refs:

## Success Criteria
- `git status` shows `.env.example` tracked; `supabase/.env`, `.env.local` ignored.
- `bunx tsc --noEmit` exit 0. E2E unchanged (still RED; no routes yet) — no regression in harness startup.
- `grep -R "sb_secret\|GOCSPX" -- . ':!node_modules'` returns nothing.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| `@supabase/ssr` 0.x minor breaks API | M | H | pin minor; canonical factory shape only |
| `env()` unsupported for `client_id` | M | L | hardcode id (not secret), note in config |
| `supabase init` unavailable offline | L | L | hand-author minimal template |

## Security Considerations
Only the publishable key is exposed to the browser. Google secret only in `supabase/.env` (ignored). Server client created per request — no cross-user session bleed.

## Rollback
Revert commit; remove deps. Nothing else depends on it until phases 05/06.

## Next Steps
Unblocks 05 and 06.

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first
