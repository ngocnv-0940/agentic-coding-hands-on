---
title: "SAA 2025 Login — Supabase Google OAuth + VN/EN"
description: "Login screen (MoMorph GzbNeVGJHz), same-tab Google OAuth via Supabase PKCE, protected /todo, logout, cookie-based VN/EN."
status: completed
priority: P1
effort: 16h
branch: master
tags: [auth, supabase, oauth, i18n, momorph, playwright, nextjs16]
created: 2026-10-08
work_type: feature
spec:
  - docs/features/F001_Auth/
  - docs/features/F002_Localization/
system_docs_draft: [plans/261008-0850-login-page-supabase-google/spec/system/architecture.md, plans/261008-0850-login-page-supabase-google/spec/system/permissions.md]
blockedBy: []
---

# SAA 2025 Login — Implementation Plan

## Overview

Login screen (MoMorph https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz), Supabase Google OAuth (same-tab PKCE, `/auth/callback`), `proxy.ts` guards, minimal `/todo` + logout, VN/EN via `NEXT_LOCALE`. testPolicy `e2e-red-first`. Authoritative: `clarifications.md`; specs: `spec/` (F001_Auth, F002_Localization). F001/F002 both number FR-001..; phases prefix ids (`F001:FR-402`).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [E2E harness and RED tests](./phase-01-e2e-harness-and-red-tests.md) | Completed with gap (RED failure excerpts not kept) |
| 2 | [Login screen presentational UI (Track A)](./phase-02-login-screen-presentational-ui.md) | Completed (2 correction rounds) |
| 3 | [Supabase setup and clients](./phase-03-supabase-setup-and-clients.md) | Completed |
| 4 | [i18n dictionary and locale cookie](./phase-04-i18n-dictionary-and-locale-cookie.md) | Completed (parity evidence controller-attested) |
| 5 | [Auth flow: proxy, callback, sign-in](./phase-05-auth-flow-proxy-callback-signin.md) | Completed |
| 6 | [Todo page and logout](./phase-06-todo-page-and-logout.md) | Completed with deviation (logout is POST Route Handler) |
| 7 | [Integration and GREEN](./phase-07-integration-login-wiring-and-green.md) | Completed (real-stack smoke pending, user action) |

Owners/effort: 1 tester 3h · 2 momorph-ui-implementer 4h · 3 implementer 1.5h · 4 implementer 1.5h · 5 implementer 2.5h · 6 implementer 1h · 7 implementer→tester 2.5h.

## Dependencies

```
1 ─┬─> 2 (Track A) ────────────────┐
   ├─> 3 ─┬─> 5 ───────────────────┼─> 7
   │      └─> 6 <── 4              │
   └─> 4 ──────────────────────────┘
```
After 1: {2} ∥ {3, 4}; then {5} ∥ {6}; 7 last. External: Supabase CLI + Docker (user, smoke only), Google Cloud OAuth client.

## Key calls

- Next 16.4: `proxy.ts` (named `proxy`, Node runtime); async `cookies()` / `searchParams`.
- `next.config.ts` has `cacheComponents: true`: root layout reads cookie for `<html lang>` → `export const instant = false` on root layout. Fallback if `bun run build` fails: `cacheComponents: false` (phase 7 decides, records why).
- Session check = `getUser()` in proxy, `/todo`, logout. Mock serves no JWKS.
- Callback never echoes provider errors: always `/login?error=auth_failed`.
- `.gitignore` has `.env*` → add `!.env.example` (phase 1 owns `.gitignore`).
- Mocks only in `e2e/`; app reaches mock solely via `NEXT_PUBLIC_SUPABASE_URL`.

## File ownership (W = writes)

| Path | Phase |
|------|-------|
| `e2e/**`, `playwright.config.ts`, `.gitignore` | 1 (fixes later only by tester) |
| `package.json`, `bun.lock` | 1 then 3 (strictly sequential) |
| `app/login/_components/**`, `public/images/login/**`, `app/globals.css` | 2 |
| `supabase/**`, `.env.example`, `lib/supabase/{config,client,server}.ts` | 3 |
| `lib/i18n/**` | 4 |
| `proxy.ts`, `lib/supabase/proxy.ts`, `lib/auth/**`, `app/auth/**`, `app/page.tsx` | 5 |
| `app/todo/**` | 6 |
| `app/login/page.tsx`, `app/login/*-container.tsx`, `app/layout.tsx`, `next.config.ts` (fallback) | 7 |

## Verification & rollback

Type parity (`bunx tsc --noEmit`) · E2E vs mock (`bun run test:e2e`) · build (`bun run build`) · optional `@smoke` on real stack. No unit runner (YAGNI). Rollback = revert the phase commit; only 7 edits scaffold files; no DB migrations.
Done = the phase-1 RED command exits 0, plus build, lint, tsc exit 0, plus phase-7 manual smoke checklist.

## Delivery status (reconciled 2026-10-08)

Implementation complete, verified against code and evidence: tsc 0, lint 0, `bun run build` 0 (`evidence/build-output.txt`), E2E 34/34 incl. logout-Back regression (`evidence/e2e-green-v3-rerun-output.txt`), probes pass (`evidence/probes-browser-v2-output.txt`), inspection SEALED score 9, 0 critical (`evidence/inspection-verdict.json`). Visual metric verdict was NOT PASS (CTA/footer text width +2–3%); user accepted as font tolerance (`clarifications.md`).

## Deviations (scope drift)

| # | Change | Reason | Cost |
|---|--------|--------|------|
| D1 | Logout = POST Route Handler `app/auth/logout/route.ts` + native form (`app/todo/logout-button.tsx`); `app/todo/logout-action.ts` deleted | Server Action left hidden /todo DOM with previous user's email after logout/Back (`reports/debugger-todo-stale-back-and-dynamic-error.md`) | Route lives under phase-05 path `app/auth/**`; `docs/` now stale (F2) |
| D2 | `await connection()` at top of `UserPanel` in `app/todo/page.tsx` | `Date.now()` prerender error under `cacheComponents` | None measured |
| D3 | Visual accepted at ~2–3% text-width residual | Figma vs Chromium font rendering | Not pixel-identical; user decision |
| D4 | E2E run with `E2E_PROD=1` (prod build) in both RED and GREEN | User dev server held :3000 (Next dev lock) | Default dev-mode E2E not re-run on final code |
| D5 | Phase 02 needed 2 correction rounds (real key visual, gradients at node bounds, rest box-shadow none, CTA 305px) | Visual fidelity vs MoMorph | Extra iteration; actual hours not logged |
| D6 | Extra helpers: `e2e/support/app-alert.ts`, `e2e/support/start-mock-supabase.ts` | Shared assertions and mock launch | Small |

## Risks (live)

| Risk | Status | Owner / clear when |
|------|--------|--------------------|
| Real Google + Supabase path never run; `env()` client_id and cancel param names unconfirmed | Open | User — smoke passes (F1) |
| Nothing committed: all work is uncommitted on `master`, but rollback assumes per-phase commits | Open | User — commits made or one commit approved |
| `docs/` describes deleted Server Action | Open | Main agent → doc-writer (F2) |
| Build needs `NEXT_PUBLIC_SUPABASE_*` at build time (import-time throw) | Open | Implementer when CI exists (F7) |
| Back-after-logout leaked prior user's DOM | Closed | Route fix + regression test green |
| `Date.now` prerender error on /todo | Closed | 0 occurrences in prod log |

## Follow-ups (owner, done-mark)

- **F1 Real-stack smoke** — owner: user. Done when: `supabase start` + Google consent lands on `/todo` showing the real email; cancel shows inline error (confirms cancel params); Logout → `/login`; Back shows no user data.
- **F2 Stale docs** — owner: main agent → doc-writer (`docs/` not touched here). Done when `docs/features/F001_Auth/technical-spec.md:171-176`, `docs/system/permissions.md:43`, `docs/system/architecture.md` describe POST `/auth/logout`; grep for `logoutAction` in `docs/` is empty.
- **F3 Commit** — owner: user. Done when phase commits (or one approved commit) exist and no `app/`, `lib/`, `e2e/`, `supabase/` file is untracked.
- **F4 Parity experiment** — CLOSED. Controller-attested: deleting `todo.logout` from `lib/i18n/dictionary-en.ts` gave tsc TS2741, key restored, final tsc exit 0. Source is the phase-04 implementer handoff; not in `evidence/`. Optional: tester may archive the tsc output into `evidence/`.
- **F5 bfcache `pageshow` branch** — owner: tester. Done when a test exercises the persisted branch, or it is recorded as accepted-untested (`/login` is `no-store`, Chromium does not restore it).
- **F6 Lows backlog** — owner: implementer. Done when each item is fixed with a test or closed as accepted here: (a) `lib/supabase/proxy.ts:55-63` absolute redirect from Host vs relative elsewhere; (b) `lib/supabase/proxy.ts:32-39` `setAll` reassigns cache headers (unreachable today); (c) redundant `getUser()` in `app/auth/logout/route.ts:18`; (d) no Origin check on logout POST (Defer; SameSite=Lax); (e) `@smoke` gate in `playwright.config.ts:21-22` tags no spec; (f) mock does not verify S256 `code_verifier` (`e2e/support/mock-supabase-server.ts:78-83`, Defer).
- **F7 CI env** — owner: implementer. Done when CI sets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` before build.

## Unresolved

1. Phase 01 RED failure excerpts and `reports/tester-red-evidence.md` not kept (only `evidence/temper-run-red.json`: exit 1, 33 failed). Accept the summary as the record, or ask tester to reconstruct — user decides.
2. F001:FR-403 (initiation failure) has no deterministic E2E; covered by probe P7a and code review only.
3. Resolved: `/` → `redirect('/login')` (`clarifications.md`).
