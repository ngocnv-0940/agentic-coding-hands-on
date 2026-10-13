---
phase: 6
title: "Todo page and logout"
feature: F001,F002
status: completed
priority: P1
effort: 1h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [3, 4]
---

# Phase 06 — Minimal protected `/todo` + logout action

## Context Links
- `spec/auth/technical-spec.md` A5, A6, §3.4; `spec/auth/screens/SCR-todo/spec.md`
- `spec/system/permissions.md` (enforcement points), `clarifications.md` (/todo scope, logout scope local)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/{redirect,cookies}.md`

## Overview
Not a MoMorph screen — plain Track B page: server-verified user email + Logout button; logout Server Action re-checks the user, signs out locally, redirects to `/login`. Strings from `lib/i18n`.

## Key Insights
- Page and action each call `getUser()` (F001:FR-601) — proxy can be bypassed by Server Action POSTs.
- `redirect()` throws; keep it outside `try/catch`.
- If `signOut({ scope: 'local' })` errors (expired/revoked session), the action must still clear `sb-*` auth cookies and redirect (F001:FR-404 edge).

## Requirements
F001:FR-104, FR-301, FR-404, FR-601; US003, US004. F002: strings via dictionary (F001 D002).

## Architecture
```
app/todo/page.tsx (RSC, async)
  user = (await (await createClient()).auth.getUser()).data.user; !user → redirect('/login')
  dict = getDictionary(await getLocale())
  <main> <h1>{dict['todo.title']}</h1>
         <p>{dict['todo.emailLabel']} <span data-testid="todo-email">{user.email ?? dict['todo.emailMissing']}</span></p>
         <form action={logout}><button type="submit">{dict['todo.logout']}</button></form> </main>
app/todo/logout-action.ts ('use server')
  supabase = await createClient(); await supabase.auth.getUser()   // re-check; result does not gate logout
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) delete every cookie whose name starts with 'sb-' and contains '-auth-token'
  redirect('/login')
```
Minimal Tailwind styling consistent with the dark Login palette; no MoMorph assets.

## Related Code Files
Create: `app/todo/page.tsx`, `app/todo/logout-action.ts`. Modify: none.

## Implementation Steps
1. `logout-action.ts` per Architecture.
2. `page.tsx` per Architecture.
3. `bun run test:e2e --grep "todo|logout"` — tests needing a login via UI stay RED until 07; direct `/todo` unauth already redirects (05 or page-level).
4. `bunx tsc --noEmit`, `bun run lint`.

## Todo
- [x] logout with fallback cookie clear — DEVIATION: built as POST Route Handler `app/auth/logout/route.ts` (303 → `/login`, GET 405), not the Server Action in Architecture; `app/todo/logout-action.ts` deleted (plan D1)
- [x] /todo page with email + localized Logout (`app/todo/page.tsx`, `app/todo/logout-button.tsx`)
- [x] tsc/lint green (`evidence/temper-results.json`)

## Delivery Status (reconciled 2026-10-08)
- Done: `app/todo/page.tsx` (adds `await connection()`, plan D2), `app/todo/logout-button.tsx`, `app/auth/logout/route.ts`.
- Deviation D1 reason: Server Action logout kept hidden /todo DOM with the previous user's email after logout and Back (`reports/debugger-todo-stale-back-and-dynamic-error.md`). Regression test "browser Back after logout never shows the previous user data" is green.
- Missing email renders "—" (`todo.emailMissing`).
- Logout POST hits mock `/auth/v1/logout` (`e2e/support/mock-supabase-server.ts:98`). No spec asserts the hit; the behavior is covered by probe P6a and E2E logout tests.
- Follow-up: `docs/` still describes the Server Action (plan F2).

## MoMorph refs:

## Success Criteria
- After 07: logged-in `/todo` shows `e2e@example.com`; Logout → `/login`; revisiting `/todo` → `/login`; mock records `/auth/v1/logout` hit.
- Missing email renders "—".

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Session survives a failed signOut | L | H | explicit `sb-*-auth-token*` deletion on error |
| Page cached across users | L | H | page reads cookies → per-request; root `instant = false` (07); never `use cache` here |

## Security Considerations
Safety-critical (session mutation). Email rendered as text (React escapes). No user-controlled redirect target.

## Rollback
Revert commit; proxy still redirects `/todo` → `/login` for guests.

## Next Steps
Phase 07 GREEN run covers logout end-to-end.

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first
