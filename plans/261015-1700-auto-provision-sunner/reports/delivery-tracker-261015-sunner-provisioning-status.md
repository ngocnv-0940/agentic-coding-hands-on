# Status: auto-provision sunner (2026-10-15)

Plan `plans/261015-1700-auto-provision-sunner/`: completed (3/3 phases). Uncommitted on `feat/write-kudo`.

## Done-criteria vs evidence
| Phase | Criterion | Evidence | Met |
|-------|-----------|----------|-----|
| 1 | Migration + new pgTAP green, lint clean | migration file (3 fns, trigger, backfill, revokes); fix2-pgtap 316/316 exit 0; fix2-db-lint "No schema errors" | yes |
| 2 | Existing files green, seed comment, no assertion loosened | fix2-pgtap 7 files PASS; seed.sql:5-10; sender-masking allowlist updated | yes (scope reduced) |
| 3 | reset/test/lint 0, e2e 0, tsc/lint 0, no app diff | final-*-exit all 0; e2e 252 passed; git status shows no app/lib/e2e change | yes |
| - | Independent inspection | inspection-verdict.json SEALED 9.5, 0 critical, 0 refuted | yes |

TDD proof: red runs exit 1 (red, fix1-red, fix2-red) then green; fix1/fix2 mutation checks kill the mutants.

## Caveat on evidence
e2e 252/252 and pgTAP 302 were captured before fix rounds 1-2. pgTAP re-run after (310, 316). e2e not re-run: fix rounds changed SQL only and e2e uses the mock Supabase server, so it cannot reach the trigger. Cheap to re-run once before PR if wanted.

## Scope drift
- Google-only gate (review M1): +1 helper, +8 tests.
- Trigger also on `update of raw_app_meta_data` (review round 2): fires on every Google sign-in as a no-op, +6 tests.
- Phase 2 per-file fixture cleanup dropped as dead code.

## Open follow-ups (owner: main agent unless noted)
1. Real Google OAuth sign-in never run end to end. Owner: user. Done = first real login yields one `sunners` row, compose pill enabled, like works. Mock e2e cannot exercise the trigger.
2. Deferred review findings (Low), each needs a decision or ticket:
   - Avatar host allowlist (any https host allowed; tracking-pixel path). Done = restrict to googleusercontent or accept in writing.
   - Orphan sunner when auth user deleted (`on delete set null`, pre-existing); re-sign-up makes a second persona.
   - Trigger name `on_auth_user_created_provision_sunner` says "created" but also fires on UPDATE. Rename is cheap only while migration is uncommitted; after commit it needs a new migration.
3. Privacy: every Google account is searchable as a kudo recipient. Accepted by user (clarifications.md); keep as a standing risk.
4. A deleted sunner of a Google account is re-created at next sign-in (consistent with "every Google account gets one"; no app path deletes sunners today). Revisit if a delete feature lands.
5. Stale docs: F006 D013 "no auto-create", technical-spec:704, permissions-matrix:387 until `spec/` draft is promoted (doc-writer). Changelog entry added.
6. Commit and push to PR #10 pending user approval.

## Risk register
Closed: trigger blocking sign-ups (no raising input, pgTAP), role rights on auth.users (local reset ok), client EXECUTE (revoked + tested), email sign-up minting sunners (gate).
Open: items 1-4 above.

## Unresolved
- Rename trigger before commit, or leave?
- Re-run e2e before PR?
