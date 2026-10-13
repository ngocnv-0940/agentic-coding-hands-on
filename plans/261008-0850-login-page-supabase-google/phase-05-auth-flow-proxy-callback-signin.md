---
phase: 5
title: "Auth flow: proxy, callback, sign-in"
feature: F001
status: completed
priority: P1
effort: 2.5h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [3]
---

# Phase 05 — Auth flow (proxy guards, PKCE callback, sign-in function)

## Context Links
- `spec/auth/technical-spec.md` A2, A3, A4, §3.4 edge cases, §4.4 (A0/FR-601, BR-001)
- `spec/system/permissions.md` (route matrix, enforcement points, cookie handling)
- `reports/researcher-supabase-ssr-auth-next16.md` §3–§4, §6
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/{proxy,route}.md`

## Overview
Session refresh + redirect rules in `proxy.ts`; `/auth/callback` exchanges the PKCE code and always lands on `/todo` or `/login?error=auth_failed`; a browser-side `signInWithGoogle()` the login container (phase 07) calls; `/` forwards to `/login`.

## Key Insights
- Next 16: file `proxy.ts` at repo root, export `proxy`, Node runtime (setting `runtime` throws). Server Actions are POSTs to page routes → proxy is not the only guard (phase 06 re-checks).
- No code between `createServerClient` and `auth.getUser()` in the proxy; any redirect must copy the cookies (and cache headers) from the refreshed response (F001:BR-004).
- `/auth/*` returns `NextResponse.next()` before touching Supabase (F001:BR-003).
- PKCE start makes no network call; `signInWithOAuth` builds the URL and navigates. Its `{ error }`/throw path is the only F001:FR-403 hook.

## Requirements
F001:FR-101, FR-102, FR-103, FR-401, FR-402, FR-601; BR-002, BR-003, BR-004; DEC-001, DEC-002; INT-001; US001, US002, US005, US006.

## Architecture
```
proxy.ts ── proxy(req) → updateSession(req); config.matcher excludes _next/static, _next/image, favicon.ico, *.svg|png|jpg|jpeg|gif|webp
lib/supabase/proxy.ts ── updateSession(req):
   if path startsWith '/auth/' → NextResponse.next()
   res = NextResponse.next({ request }); client(getAll: req.cookies, setAll: req.cookies.set + res = NextResponse.next({request}) + res.cookies.set + res.headers.set(cacheHeaders))
   user = (await client.auth.getUser()).data.user
   path === '/todo' || startsWith '/todo/' && !user → redirectWithCookies('/login')
   path === '/login' && user → redirectWithCookies('/todo')        (search params dropped)
   else → res
   redirectWithCookies(p): r = NextResponse.redirect(new URL(p, req.url)); copy res.cookies.getAll() + cache headers onto r
app/auth/callback/route.ts ── GET(req):
   url = new URL(req.url); fail = redirect(new URL('/login?error=auth_failed', url))
   if url.searchParams.get('error') || !code → fail
   { error } = await (await createClient()).auth.exchangeCodeForSession(code); error → fail
   → redirect(new URL('/todo', url))          (never reads `next`; F001:BR-002)
lib/auth/sign-in-with-google.ts ── async signInWithGoogle(): Promise<{ ok: boolean }>
   try { const { error } = await createBrowserSupabase().auth.signInWithOAuth({ provider:'google', options:{ redirectTo: `${window.location.origin}/auth/callback` } }); return { ok: !error } } catch { return { ok: false } }
app/page.tsx ── redirect('/login')   (replaces Create Next App page; see plan Unresolved #1)
```

## Related Code Files
Create: `proxy.ts`, `lib/supabase/proxy.ts`, `app/auth/callback/route.ts`, `lib/auth/sign-in-with-google.ts`.
Modify: `app/page.tsx` (replace scaffold content).

## Implementation Steps
1. `lib/supabase/proxy.ts` per Architecture (<80 lines). Use `getUser()`, never `getSession()` for decisions.
2. `proxy.ts` with constant matcher.
3. `app/auth/callback/route.ts`. Error flag is the constant `auth_failed` — never forward `error_description`.
4. `lib/auth/sign-in-with-google.ts`.
5. `app/page.tsx` → `redirect('/login')`.
6. Run `bun run test:e2e --grep "route guard|callback"`: unauth `/todo*` → `/login`, callback `error`/missing/bad code → `/login?error=auth_failed` now pass on URL; assertions needing the login UI stay RED until 07. Record which tests flipped.
7. `bunx tsc --noEmit`, `bun run lint`.

## Todo
- [x] updateSession with DEC-001 + cookie-copying redirects (`lib/supabase/proxy.ts`)
- [x] proxy.ts + matcher (`proxy.ts`)
- [x] callback route (DEC-002, constant flag) (`app/auth/callback/route.ts`)
- [x] signInWithGoogle (`lib/auth/sign-in-with-google.ts`)
- [x] `/` redirect (`app/page.tsx` → `/login`)
- [x] Guard/callback E2E URL assertions GREEN (34/34, `evidence/temper-results.json`)

## Delivery Status (reconciled 2026-10-08)
- Done as planned. Inspection SEALED (`evidence/inspection-verdict.json`), proxy/callback regressions checked.
- Deferred Lows (plan F6): proxy absolute redirect from Host (`lib/supabase/proxy.ts:55-63`); `setAll` cache-header reassignment (`:32-39`).
- Phase-05 path `app/auth/**` also holds the phase-06 logout Route Handler (plan D1).

## MoMorph refs:

## Success Criteria
- E2E: unauth `/todo`, `/todo/x`, `/todo?a=1` end at `/login`; callback failure variants end at `/login?error=auth_failed`; no infra regressions.
- Static assets under `/images/login/*` load without passing through Supabase (matcher).

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Refreshed cookie lost on redirect → silent logout | M | H | `redirectWithCookies` helper used for every redirect; E2E authed `/login`→`/todo` keeps session (07) |
| Proxy runs on `/auth/callback` and races cookie writes | L | H | early return for `/auth/` |
| Open redirect via `next` | L | H | `next` never read |
| Host mismatch kills PKCE verifier | M | M | always `localhost`; documented in `.env.example` |
| Behind a proxy in prod `req.url` host wrong | L | M | out of scope (local only); deploy follow-up: honor `x-forwarded-host` |

## Security Considerations
Safety-critical (auth, sessions, cookies) → full E2E suite runs in phase 07 regardless of scope. Decisions only on server-verified `getUser()`. Error flag constant → no reflected content (F001:BR-001).

## Rollback
Revert commit; deleting `proxy.ts` removes all guards at once (no partial state).

## Next Steps
Phase 07 wires `signInWithGoogle` into the login container.

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first
