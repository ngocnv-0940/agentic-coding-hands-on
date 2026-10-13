---
passed: true
issues: 0
warnings: 1
---

# Review: data-model.md

## Passed Checks
✓ Entity completeness (vacuous: 0 entity blocks; "No data" verified against working tree)
✓ DISC-### scope (vacuous: no DISC codes)
✓ MODEL### uniqueness (vacuous: no MODEL codes)
✓ DISC-### orphan check (vacuous: no DISC codes)
✓ Relationship completeness (vacuous: 0 relationships)

## Independent "No data" verification
- Grep of app/, lib/, proxy.ts, supabase/, e2e/: no `.from(`, `.rpc(`, ORM, `CREATE TABLE`, `.sql`, migrations, schema.prisma or drizzle config. supabase/ holds only config.toml. The "No data" claim is true; nothing is hidden.
- Type definitions found are UI props, locale types and e2e stub types only, not persisted entities.

## Warnings
1. Citation off by one: line 25 cites `app/auth/logout/route.ts:18` for `signOut`. The call is at `route.ts:19`; line 18 is `getUser()`. The claim is true, only the line is wrong. Fix: cite `:19`.

All other file:line citations checked and accurate: package.json:13-14, config.toml:33/61-66/68-73, client.ts:5, server.ts:9, sign-in-with-google.ts:15, lib/supabase/proxy.ts:47, app/todo/page.tsx:27-28 and :37.
