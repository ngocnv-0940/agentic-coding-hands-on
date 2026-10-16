# Phase 3 - Verification gate

## Context Links
Phases 1-2; `playwright.config.*`; `package.json` scripts.

## Overview
Priority P1. Status completed (optional local smoke step 5 and real Google OAuth not run). Prove DB behavior, then confirm nothing in app/e2e moved. No app code change expected.

## Scope Contract
- Changed: one migration, one new + six edited pgTAP files, seed.sql comment.
- Impacted: every flow reading `sunners` (board, write kudo); `/auth/callback` unchanged; mock e2e unchanged.
- Will verify: pgTAP full (lowest reliable layer for trigger/grants), `supabase db lint`, full `bun run test:e2e` (safety-critical), `tsc --noEmit`, lint.
- Deliberately skipped: new e2e (mock cannot exercise the trigger; YAGNI per clarifications); manual Google OAuth (needs real credentials).

## Files owned
None (read-only verification). Evidence under `plans/261015-1700-auto-provision-sunner/evidence/`.

## Steps
1. `supabase db reset && supabase test db`; record exit codes.
2. `supabase db lint`.
3. `git diff --stat` confirms no `app/`, `lib/`, `e2e/` changes; if any appear, justify or revert.
4. `bun run test:e2e` full; `bunx tsc --noEmit`; project lint.
5. Optional local smoke: sign in via local auth with a new email, confirm one `sunners` row.

## Todo
- [x] db reset+test 0 (fix2: 316/316)  - [x] lint clean  - [x] e2e 0 (252/252, run before fix rounds; fix rounds touched SQL only)  - [x] tsc/lint 0  - [x] no app diff (git status: migration, seed, tests only)

## Success Criteria
All exit codes 0, recorded with real output in evidence.

## Risks
e2e flakiness unrelated to change: rerun the failing spec once, report honestly. Docker/local Supabase unavailable: report BLOCKED, never fake green.

## Rollback
Nothing to undo; failures route back to Phase 1/2.

## Next
Docs (F006/F007 spec, permissions.md already drafted under `spec/`) via doc-writer; commit and push to PR #10.
