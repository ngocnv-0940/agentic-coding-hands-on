---
name: project-supabase-data-and-mock-rpc-design-calls
description: Kudos live board plan (2026-10-14) calls for any Supabase-data screen here — read RPCs over PostgREST embeds, per-identity mock datasets, Next 16 action/Activity gotchas
metadata:
  type: project
---

First DB feature (plans/261014-0900-kudos-live-board) settled:
1. Reads = SECURITY INVOKER SQL functions returning camelCase jsonb, called via `supabase.rpc`; the e2e mock (`e2e/support/mock-supabase-server.ts`, node:http) then only serves `/rest/v1/rpc/<fn>` instead of PostgREST filter grammar. Contract lives in one phase file; mock, SQL, lib types, view props match it.
2. Playwright runs `fullyParallel` against ONE mock process: isolate mutable state by stub identity (per-identity datasets, e.g. empty board) and keep mutating tests in one serial spec with mock-only `/__e2e/*` control routes.
3. SQL verified with pgTAP (`supabase test db`, CLI built-in, no npm dep); docker + supabase CLI exist in ~/.local/bin, psql does not.
4. Next 16.4: Server Actions dispatch sequentially per client (`02-guides/server-actions.md`); Activity preserves client state across `router.replace` → key filter-dependent containers (`02-guides/preserving-ui-state.md`).
5. Existing specs may assert a route is a placeholder (`e2e/homepage-access-and-landing.spec.ts`) — grep e2e for the route before replacing a Coming soon page.

**Why:** found while planning; none of it was in the spec drafts.
**How to apply:** reuse for the next Supabase-backed screen (kudo detail, profile, secret box). See [[project-plan-md-format-conventions]], [[project-next-docs-access-and-cache-components]].
