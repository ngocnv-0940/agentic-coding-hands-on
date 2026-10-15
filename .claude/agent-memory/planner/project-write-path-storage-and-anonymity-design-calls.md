---
name: project-write-path-storage-and-anonymity-design-calls
description: Write-kudo plan (2026-10-15) calls for any Supabase write/upload/privacy feature here — column grants for hidden columns, storage RLS gotchas, unaccent under empty search_path, E2E CORS, feed refresh keying
metadata:
  type: project
---

First write path + Storage (plans/261015-0950-write-kudo-modal) settled:
1. Hide an identity column from clients with column-level SELECT grants (revoke table select, re-grant other columns); every INVOKER fn touching it must turn narrow SECURITY DEFINER or it 42501s at runtime. PostgREST then can't select/filter/embed on it.
2. Uploads go browser → Storage: Server Action body limit is 1 MB (`serverActions.md`) and the proxy buffers bodies (`proxyClientMaxBodySize`). E2E app :3100 and mock :54399 differ in port → mock must answer CORS/OPTIONS for `/storage/v1/*`; supabase-js sends a File as multipart (parse with `new Response(buf,{headers}).formData()`).
3. Storage upload/remove use RETURNING → an owner-only SELECT policy is needed; verify `owner_id` is set at INSERT check time with a real local upload probe.
4. `unaccent(text)` fails under `search_path = ''`; use `extensions.unaccent('extensions.unaccent'::regdictionary, s)`.
5. F006 `use-infinite-kudos-feed` seeds state once from props, so `router.refresh()` alone won't show a new item: key the container by `filtersKey|firstItemId`.

**Why:** none of these were in the spec drafts; each would surface only at GREEN or on the real stack.
**How to apply:** check them when planning profile edit, secret box open, or any new upload/write screen. See [[project-supabase-data-and-mock-rpc-design-calls]], [[project-plan-md-format-conventions]].
