---
phase: 7
title: "Integration and GREEN"
feature: F001,F002
status: completed
priority: P1
effort: 2.5h
owner_agent: implementer (wiring) then tester (GREEN + visual validation)
track: integration
test_policy: e2e-red-first
depends_on: [2, 4, 5, 6]
---

# Phase 07 — Login page wiring, root layout, GREEN

## Context Links
- Phase 02 integration contract; phase 01 selector contract + `reports/tester-red-evidence.md`
- `spec/auth/technical-spec.md` A1, A2, SM-001; `spec/localization/technical-spec.md` A1, A2, DEC-001
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`, `.../04-functions/cookies.md` (Cache Components note), `01-app/02-guides/migrating-to-cache-components.md`

## Overview
Join Track A components to Track B behavior: server `/login` page (error flag + locale + dictionary), two thin client containers, root layout with `<html lang>` and metadata. Then the tester reruns the exact RED command to GREEN and does visual validation against MoMorph.

## Key Insights
- `cacheComponents: true`: `await cookies()` in the root layout outside `<Suspense>` blocks the static shell → `export const instant = false` on `app/layout.tsx` (docs: a `false` at the top of the tree opts the route out of static-shell validation). All routes here are per-request (session/locale), so no prerender benefit is lost.
- Fallback (only if `bun run build` still fails): set `cacheComponents: false` and remove `partialPrefetching` in `next.config.ts`; record the error text in the phase report.
- bfcache/Activity can restore the login button in `initiating` → reset to `idle` on `pageshow` with `event.persisted`.

## Requirements
F001:FR-201..205, FR-401, FR-403, BR-001, DEC-003, SM-001, US001, US002. F002:FR-002, FR-201..203, FR-401..405, DEC-001, DEC-002, US001, US002.

## Architecture
```
app/layout.tsx (async)  export const instant = false
   locale = await getLocale(); dict = getDictionary(locale)
   generateMetadata → { title: dict['meta.title'] }
   <html lang={locale} …><body>{children}</body></html>
app/login/page.tsx (async RSC; PageProps<'/login'>)
   { error } = await searchParams; hasError = first value of error is a non-empty string
   locale, dict → <LoginScreen title subtitle tagline footerText logoAlt
       languageSelector={<LanguageSelectorContainer locale labels={{vi,en,menu}} />}
       loginArea={<GoogleLoginContainer label loadingLabel errorText initialError={hasError} />} />
app/login/google-login-container.tsx ('use client')
   status: 'idle'|'initiating'|'error'; showError = status==='error' || (status==='idle' && initialError)
   onClick: status='initiating' (hides old error) → { ok } = await signInWithGoogle(); !ok → status='error', focus button
   <LoginButton loading={status==='initiating'} disabled={status==='initiating'} …/>
   <LoginErrorMessage message={showError ? errorText : ''} />
   useEffect: window 'pageshow' (persisted) → status='idle'
app/login/language-selector-container.tsx ('use client')
   [pending, startTransition] = useTransition(); onSelect = l => startTransition(() => setLocale(l))
   <LanguageSelector locale labels onSelect pending />
```
Error text always `dict['login.error']`; the raw `error` value never reaches the DOM (F001:BR-001).

## Related Code Files
Create: `app/login/page.tsx`, `app/login/google-login-container.tsx`, `app/login/language-selector-container.tsx`.
Modify: `app/layout.tsx` (lang, metadata, `instant`, drop Create Next App metadata), `next.config.ts` (fallback only).
Read-only: everything owned by 01–06. Contract mismatch with Track A → bounded fix request to `momorph-ui-implementer`, not an edit here.

## Implementation Steps
1. `app/layout.tsx` per Architecture.
2. Containers, then `app/login/page.tsx`.
3. `bun run build` → resolve Cache Components errors (instant → fallback).
4. `bunx tsc --noEmit`, `bun run lint`.
5. Tester: `bun run test:e2e` (identical command to RED) → exit 0. Failures: UI → back to phase 02 owner; behavior → owning Track B phase. Never weaken assertions.
6. Tester: visual validation (Playwright MCP capture of `/login` vi + en, 1440 and 375 widths) vs MoMorph frame; material mismatch = incomplete.
7. Manual smoke with real stack (user, optional `@smoke`): `supabase start`, `.env.local` from `.env.example`, Google consent → `/todo` shows email; cancel at Google → error under button (confirms cancel params); Logout → `/login`.

## Todo
- [x] Layout + login page + 2 containers (`app/login/page.tsx`, `google-login-container.tsx`, `language-selector-container.tsx`, `app/layout.tsx`)
- [x] `bun run build` exit 0 (`evidence/build-output.txt`). Decision: `cacheComponents` stays `true`, `instant = false` on root layout; no fallback config flip
- [x] E2E GREEN with same command as RED (`E2E_PROD=1 bun run test:e2e`: RED exit 1 / 33 failed; GREEN 34 passed)
- [x] Visual validation passed — by user acceptance, not metric. Metric verdict NOT PASS (CTA/footer text +2–3%); accepted as font tolerance (`clarifications.md`)
- [x] Smoke checklist handed to user — handed off 2026-10-08; execution pending (plan F1)

## Delivery Status (reconciled 2026-10-08)
- Success criteria: tsc 0, lint 0, build 0, E2E 34/34; `html[lang]` follows locale (E2E); no Create Next App strings left in `app/` (grep empty).
- Open: real-stack smoke (Docker, `supabase start`, Google OAuth creds) not run (plan F1).
- Gap: bfcache `pageshow` branch not exercised (plan F5).

## MoMorph refs:

## Success Criteria
`bun run test:e2e` exit 0 · `bun run build` exit 0 · `bun run lint` exit 0 · `bunx tsc --noEmit` exit 0 · `html[lang]` matches locale · no Create Next App strings left in `/login`, `/todo`, metadata.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Cache Components blocks dynamic root layout | H | M | `instant = false`; fallback config flip |
| Track A prop names drift from contract | M | L | contract in phase 02; fix routed to UI owner |
| Locale switch does not re-render | L | M | `refresh()` in action (04); E2E asserts text change |
| Login button stuck disabled after Back | M | L | `pageshow` reset |

## Security Considerations
Safety-critical surface (auth, sessions, config) → full E2E suite, not a subset. No secrets in `next.config.ts` or layout. `?error` never rendered.

## Rollback
Revert this commit → `/login` 404s again, layout returns to scaffold; Track A/B code stays inert.

## Next Steps
Docs impact: minor — setup section (Supabase CLI, Google client, `.env.local`, `bun run test:e2e`) for doc-writer; takumi promote turns `spec_draft` into `spec:`.

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first
