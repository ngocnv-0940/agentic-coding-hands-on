# Phase 2 - Adapt existing pgTAP files and seed comment

## Context Links
Phase 1; `supabase/tests/database/*.test.sql`; `supabase/seed.sql` header.

## Overview
Priority P1. Status completed (scope reduced: per-file fixture delete removed as dead code; delivered = seed.sql comment + sender-masking DEFINER allowlist). Existing tests assume auth inserts create no sunner.

## Requirements
After each `insert into auth.users`, remove the trigger-created row so each test's own fixtures stay authoritative:
`delete from public.sunners where user_id in (select id from auth.users where email like 'pgtap-%@example.test');`
(placed before the test's own sunners inserts). This also keeps the `sunner_not_found` cases valid. Plan counts unchanged.
`seed.sql` runs without auth users, so seed data is untouched; only the header comment changes: user_id stays null for seeded rows, but a Google account now gets its own row automatically (no manual linking needed to write kudos; linking is only needed to act as a seeded persona).

## Files owned
- `supabase/tests/database/kudos-like-rules.test.sql`
- `supabase/tests/database/kudos-rls-and-reads.test.sql`
- `supabase/tests/database/kudos-seed-matches-e2e-fixture.test.sql` (check whether it counts sunners or links user_id; adjust only if it fails)
- `supabase/tests/database/write-kudo-create-rules.test.sql`
- `supabase/tests/database/write-kudo-search-and-storage.test.sql`
- `supabase/tests/database/write-kudo-sender-masking.test.sql`
- `supabase/seed.sql` (comment lines 5-6 only; seed-matches test must stay green)

## Steps
1. Run `supabase test db` after Phase 1 to list real failures; fix only those files (fail open: if a count-based test shifts, adapt it, never weaken assertions).
2. Insert the delete statement per failing file; rerun.
3. Edit seed.sql comment.

## Todo
- [x] all existing files green  - [x] seed comment updated  - [x] no assertion removed or loosened (DEFINER allowlist updated exactly, per inspection)

## Success Criteria
`supabase db reset && supabase test db` exit 0 with all files, including Phase 1 test.

## Risks
Masking a real regression by deleting rows: delete is scoped to `pgtap-%` fixtures inside a rolled-back transaction. Search test may count sunners including fixtures: diff counts before/after.

## Rollback
Revert the test edits together with Phase 1 (they only make sense with the trigger).

## Next
Phase 3.
