---
phase: 4
title: "Data layer, server actions, image storage, i18n (Track B)"
feature: write-kudo
status: completed
priority: P1
effort: 3h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [3]
---

# Phase 04 — `lib/kudos/**`, actions, browser storage helper, dictionaries

## Context Links
- Phase-03 §Contract (types key for key); `technical-spec.md` A3, A9, A10, A13, A14, BR-001..010, ALG-002/003, INT-001..003, §4.6 config
- Existing: `lib/kudos/{kudo-board-types,kudo-board-queries,kudo-input-validation,toggle-kudo-like-action}.ts`, `lib/supabase/{server,client,config}.ts`, `lib/auth/get-current-user.ts`, `lib/i18n/dictionary-{vi,en,kudos-vi,kudos-en}.ts`
- Next 16 (cd into `node_modules/next/dist/docs/01-app/`): `02-guides/server-actions.md` (public endpoints, sequential dispatch, return values), `03-api-reference/05-config/01-next-config-js/serverActions.md` (bodySizeLimit 1 MB default), `03-api-reference/01-directives/use-server.md`, `02-guides/data-security.md`

## Overview
Typed wrappers + pure rules shared by client and server, two Server Actions, a browser-side Storage helper, image URL resolution, VI/EN strings. Proven by W GREEN (phase 6) + tsc; no unit runner (no new dep).

## Requirements / files (each <200 lines)
- `kudo-board-types.ts` — `KudoCard` + `isAnonymous`, `anonymousName`, `sender: Person | null` (phase-03 §Contract).
- `kudo-write-types.ts` — `SunnerOption {id,name,avatarUrl,department}`, `CreateKudoInput {receiverId,title,content,contentDoc,hashtagSlugs,imagePaths,isAnonymous,anonymousName}`, `CreateKudoErrorCode` (9 RPC codes + `'unauthenticated'|'invalid_input'|'unknown'`), `CreateKudoResult = {ok:true,kudoId}|{ok:false,code}`, `SearchSunnersResult = {ok:true,options}|{ok:false}`.
- `kudo-write-rules.ts` — constants (`TITLE_MAX=100`, `CONTENT_MAX=2000`, `HASHTAGS_MIN/MAX=1/5`, `IMAGES_MAX=5`, `IMAGE_MAX_BYTES=5*1024*1024`, `IMAGE_MIME` map → ext, `ANON_NAME_MAX=50`, `LINK_TEXT_MAX=100`, `LINK_URL_MIN/MAX=5/2048`, `SEARCH_QUERY_MAX=100`, `SEARCH_DEBOUNCE_MS=250`) and pure checks: `isTitleValid`, `isContentValid(plain)`, `isHashtagSelectionValid`, `isLinkTextValid`, `isLinkUrlValid` (`^https?://` via `URL` parse + length), `sniffImageMime(bytes: Uint8Array)` (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`) → mime|null, `requiredFieldErrors(state)` (BR-001). Same rules the RPC enforces (DRY between hook and action guards).
- `search-sunners-action.ts` — `'use server'`; `searchSunnersAction(query: unknown)`: `getCurrentUser()` else `{ok:false}`; string, trim, 1..100 else `{ok:true,options:[]}`; `rpc('search_sunners',{p_query})`; error → `{ok:false}` (UI shows empty text, INT-003).
- `create-kudo-action.ts` — `'use server'`; auth check; `parseCreateKudoInput(unknown)` (uuid via `isUuid`, strings, arrays of strings ≤5, boolean, `contentDoc` plain object, `JSON.stringify` ≤ 64 KB; unknown keys dropped) else `invalid_input`; `rpc('create_kudo', {...})`; map PostgREST `message` to code (never forward raw text); no `refresh()` (client calls `router.refresh()`).
- `kudo-image-storage.ts` — browser-only (uses `lib/supabase/client.ts`): `newKudoImageName(mime)` → `${crypto.randomUUID()}.${ext}` (neutral, ALG-003 superseded); `uploadKudoImages(files)` → names (sequential, `upsert:false`, `contentType`; first failure → remove already uploaded, throw); `removeKudoImages(names)` (best effort, swallow errors).
- `resolve-kudo-image-url.ts` — `kudo-images/<name>` → `${supabaseUrl}/storage/v1/object/public/kudo-images/<name>`; `/images/…` and `https://…` unchanged; anything else → dropped (closes F006 L7 on read).
- `kudo-board-queries.ts` — apply `resolveKudoImageUrl` to `images` in `getHighlight`/`getFeedPage` (one place; load-more inherits); wrap `getSidebar` in React `cache()` (page + sidebar block both read it).
- `lib/i18n/dictionary-write-kudo-vi.ts` / `-en.ts` (`writeKudoVi`/`writeKudoEn`, keys `writeKudo.*`): heading, field labels, placeholders ("Tìm kiếm", Danh hiệu placeholder + 2 hint lines, editor placeholder), tool labels (aria), "Tiêu chuẩn cộng đồng", mention hint, "Không tìm thấy kết quả", link dialog (title, Text, Link, Hủy, Lưu, errors), "+ Hashtag"/"Tối đa 5"/"Tối đa 5 hashtag", "+ Image", "Định dạng file không hợp lệ", "Ảnh vượt quá 5 MB", anonymous label + "Tên ẩn danh" + default "Người gửi ẩn danh", Hủy/Gửi, "Không được để trống", success "Đã gửi Kudos thành công!", error toasts per code group, clear-recipient label. VI = Figma verbatim; EN authored (plan follow-up 1). New file per feature (convention), spread in `dictionary-{vi,en}.ts`.

## Implementation Steps
1. Read the Next docs above.
2. Types → rules → URL resolver + queries edit → actions → storage helper → dictionaries.
3. `bunx tsc --noEmit`, `bun run lint` exit 0; local probe (if Docker): call `create_kudo` via the action path with a linked local user → `evidence/phase4-local-probe.txt`.

## Todo List
- [x] Types + rules + URL resolver (queries edit, `getSidebar` cached)
- [x] `searchSunnersAction`, `createKudoAction` (auth + input guards + code map)
- [x] Browser storage helper (upload/rollback/remove)
- [x] Dictionaries VI/EN merged (EN copy still awaiting user confirmation, plan follow-up 1)
- [x] tsc + lint exit 0

## Success Criteria
tsc/lint clean; actions reject guests and malformed input without calling the RPC; no raw DB text reaches the UI; image bytes never pass through a Server Action.

## Risk Assessment
- Client forges payload → action guards + RPC (authority) re-check.
- Sequential action dispatch: a search queued behind a pending submit → irrelevant (inputs disabled while submitting).
- `crypto.randomUUID` needs a secure context → localhost and HTTPS both qualify.

## Security Considerations
Session-bound clients only. Upload happens with the user's own JWT (Storage RLS decides). Action inputs whitelisted; errors mapped to codes.

## Next Steps
Phase 5 hooks call these.

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/261015-0950-write-kudo-modal/clarifications.md
- testPolicy: e2e-red-first
