# Fix round 2 (after Stage 5 inspection)
- Applied the 3 Accept findings: `like 'kudo-images/%'` predicate at write_kudo_functions.sql:141 and the storage delete policy (write_kudo_columns_and_storage.sql:50); use-submit-kudo no longer removes uploads after a thrown (indeterminate) send; FOR SHARE comment corrected.
- Verified: `supabase db reset && supabase test db` PASS 263; `bunx tsc --noEmit` 0; `bun run lint` 0; `bun run test:e2e e2e/write-kudo-` exit 0, 76 passed (fix-round2-W-dev-*.txt).
