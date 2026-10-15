# Real-stack smoke — Viết Kudo (phase 6, step 5)

Stack: local Supabase (`supabase status`, API 127.0.0.1:54321, DB 54322) after `supabase db reset`. App: `bun run dev -p 3000` with the project `.env.local` (real Supabase, no mock). No mock server in this run.

## Setup
- Auth user `smoke-writer@example.test` created through the local admin API, then linked to seeded sunner `00000000-0000-4000-8000-000000000101` (E2E User) with `update public.sunners set user_id = ...` (the seed comment's procedure).
- Session: password sign-in against `/auth/v1/token`, then the SSR cookie `sb-127-auth-token` (base64url with the `base64-` prefix) injected into a Chromium context at `localhost:3000`.
- Browser: the repo's installed Playwright Chromium, driven from a scratch script (the MCP browser's Chrome was not installed here). Scripts were kept outside the repo.

## Steps and results
| # | Step | Result |
|---|------|--------|
| 1 | Board loads for the linked user; compose pill enabled | PASS (`composePillEnabled: true`) |
| 2 | Open modal, pick recipient "Phạm Thu Hà", title, content, hashtag #Teamwork, two images (jpg + png), anonymous on with alias "Người bí ẩn", Gửi | PASS, toast "Đã gửi Kudos thành công!", modal closed |
| 3 | Storage uploads (browser to Storage) | PASS, two `POST /storage/v1/object/kudo-images/…` → 200 |
| 4 | New kudo first on the board | PASS. Second run: new card first after 511 ms (poll). First run read before `router.refresh()` landed; the reload afterwards showed it first |
| 5 | Anonymous card shows alias, no real name | PASS: sender text "Người bí ẩn" |
| 6 | Image loads from local Storage | PASS: both `<img>` `currentSrc` = `http://127.0.0.1:54321/storage/v1/object/public/kudo-images/<uuid>.(jpg|png)`, naturalWidth 88 and 52; link `href` same URL |
| 7 | DB row | PASS: `kudos` row with `sender_id` = linked sunner 101, `is_anonymous` = true, `anonymous_name` = "Người bí ẩn", `receiver_id` = 102; `kudo_images` has both `kudo-images/…` urls |
| 8 | PostgREST as the user (access token) | PASS: `GET /rest/v1/kudos?select=sender_id` → HTTP 403, code 42501 "permission denied for table kudos"; `…?sender_id=eq.…` → 403/42501; `select=*` → 403/42501; `GET /rest/v1/sunners?select=user_id` → 403/42501. Control `select=id,title` → 200 |
| 9 | PostgREST as anon | PASS: `select=sender_id` → HTTP 401, code 42501 |

Expected by the phase file: "401/42501 for `sender_id`". Observed: 403 for the authenticated user (the role has no table grant, so PostgREST answers 403 with 42501) and 401 for anon. The 42501 code is the same in both cases.

## Console
- One React hydration warning ("A tree hydrated but some attributes of the server rendered HTML didn't match the client properties") appeared during the modal flow in the first smoke run. A board reload afterwards logged no console errors or warnings. Not traced to a source; logged as a concern in the phase report.

## Cleanup (after the run)
- Deleted the 2 smoke kudos and their 4 `kudo_images` rows (both smoke runs); deleted the 4 Storage objects in `kudo-images` (HTTP 200 each); `kudo-images` now holds 0 objects.
- Cleared `sunners.user_id` for sunner 101 (0 linked sunners remain); deleted auth user `smoke-writer@example.test` (HTTP 200).
- The session cookie and token JSON stayed in the scratch directory, not in evidence.

## Verdict
Real-stack smoke PASS for the write path (submit, two uploads, row with masked sender, image URLs resolving to the real bucket, PostgREST lock-down).
