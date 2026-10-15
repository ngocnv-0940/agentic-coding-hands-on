---
phase: 1
title: "E2E RED + mock search/create/storage routes"
feature: write-kudo
status: completed
priority: P1
effort: 6h
owner_agent: tester
track: gate
test_policy: e2e-red-first
depends_on: []
---

# Phase 01 — E2E RED (Viết Kudo modal) and mock routes

## Context Links
- `clarifications.md` (all sessions incl. planner), `momorph/write-kudo-test-cases.md` (57 TCs), `momorph/write-kudo-specs.csv`, `momorph/write-kudo-frame.png`
- Spec draft: `technical-spec.md` §3 A1–A14, §3.8 edge cases, §4.5 ALG-001..003, §5.1 SC-001..SC-007 + TC→US table; `functional-spec.md` FR-101..FR-605; `screens/SCR-write-kudo-modal/spec.md`
- **Contract: `phase-03-sql-create-kudo-storage-and-anonymity.md` §Contract** (mock implements exactly that)
- Harness: `playwright.config.ts` (app :3100, mock :54399 → cross-origin), `e2e/support/{mock-supabase-server,mock-kudos-rest-routes,mock-kudos-state,mock-kudos-board-queries,mock-kudos-fixture-people,kudos-fixture-ids,kudos-locators,kudos-board-session,login-through-stubbed-google}.ts`, `e2e/kudos-sidebar-and-modal.spec.ts`
- `.claude/skills/momorph-implement-design/references/momorph-workflow.md` (valid-RED rules)

## Overview
Durable screen-level specs for the modal + the mock Supabase extension the app will call (RPC `search_sunners`, `create_kudo`, Storage upload/remove/public GET, anonymous masking in `kudo_cards`). No app code. Valid RED = non-zero exit from screen assertions (today the pill opens Coming soon), not webServer/mock failures.

## Key Insights
- Hashtag list needs no new route: the panel uses `kudos_filter_options` (7 fixture hashtags ≥6 → cap test works). TC ID-34 "TeamWork" = pick existing `#Teamwork`.
- Uploads go **browser → mock** (`localhost:3100` → `localhost:54399`): mock must answer `OPTIONS` preflight and add `Access-Control-Allow-{Origin,Headers,Methods}` on `/storage/v1/*` (headers: authorization, apikey, content-type, x-upsert, x-client-info). Auth routes stay byte-identical.
- supabase-js upload: `POST /storage/v1/object/kudo-images/<name>`; a `File` body arrives as `multipart/form-data`, a raw body with its content-type. Parse both with zero deps: `await new Response(buf, { headers: { 'content-type': ct } }).formData()`. Success `200 {Key:'kudo-images/<name>', Id}`; wrong MIME/size → `400 {statusCode:'415'|'413', error, message}`. `remove([names])` = `DELETE /storage/v1/object/kudo-images` JSON `{prefixes:[…]}` → array of removed. Public read `GET /storage/v1/object/public/kudo-images/<name>` → stored bytes + content-type. Store owner = bearer owner id.
- Mutating state is isolated: new identity `kudos-writer` (stub code `stub-code-kudos-writer`, sunner in fixtures) gets its **own dataset copy** (full kudos + kudos it created); only `e2e/write-kudo-submit-and-anonymous.spec.ts` (serial, `beforeAll` reset) submits. Other write-kudo specs use `user` and never call create.
- Mock-only control (not app contract): `POST /__e2e/kudos/reset` also clears created kudos + stored objects; `POST /__e2e/kudos/create-control {failNext?:boolean, delayMs?:number}`; `GET /__e2e/storage/objects` → `{names:[…]}` (assert cleanup after a failed submit, and nothing stored after Hủy).
- Fixtures (people): add sunners so search TCs are real: `Nguyễn Văn An`, `NguyenVanA` (TC 13), ≥8 more `Nguyễn …` (≥11 matches → cap 10), `Trần Minh Đức` exists (đ→d check: "duc"), writer `Vũ Hải Đăng` (userId `kudos-writer`). Receiver-only rows (`userId` null) do not change F006 expectations; phase 3 mirrors them in `seed.sql`.
- Files for pickers via `setInputFiles({name, mimeType, buffer})` (no binaries in repo): tiny real PNG/JPEG/WebP (magic bytes), pdf/mp4/txt, a 5 MB+1 PNG-header buffer.
- Editor DOM (Tiptap/ProseMirror): content area `[data-testid=write-kudo-editor] .ProseMirror` (`contenteditable`); assert `strong`, `em`, `s`, `ol > li`, `blockquote`, `a[href][target=_blank][rel~=noopener]`, mention `span[data-type=mention][data-id]`; placeholder via `p[data-placeholder]` attribute (no pseudo-element reads).

## Selectors (contract consumed read-only by phases 2/6)
Modal: `write-kudo-modal` (`role=dialog`, `aria-modal`, `aria-labelledby`), `write-kudo-backdrop`, `write-kudo-heading`. Rows: `write-kudo-field` (attr `data-field=recipient|title|content|hashtags|images|anonymous`, in DOM order), `write-kudo-field-error` (inside its row; text "Không được để trống"; row has `data-invalid="true"`).
Recipient: `write-kudo-recipient-input` (`role=combobox`, `aria-expanded`), `write-kudo-recipient-selected` (name + avatar), `write-kudo-recipient-clear`. Shared list (recipient and mention): `sunner-option-list`, `sunner-option` (`role=option`, `data-sunner-id`, `aria-selected`), `sunner-option-empty` ("Không tìm thấy kết quả").
Title: `write-kudo-title-input` (`maxlength=100`), `write-kudo-title-hint`. Editor: `write-kudo-tool-{bold,italic,strike,ordered-list,link,quote}` (`aria-pressed`), `write-kudo-standards-link`, `write-kudo-editor`, `write-kudo-mention-hint`. Link dialog: `write-kudo-link-dialog`, `write-kudo-link-text`, `write-kudo-link-url`, `write-kudo-link-error` (`data-for=text|url`), `write-kudo-link-cancel`, `write-kudo-link-save`.
Hashtag: `write-kudo-hashtag-add`, `write-kudo-hashtag-panel`, `write-kudo-hashtag-option` (`role=option`, `data-slug`, `aria-selected`, `aria-disabled`), `write-kudo-hashtag-limit` ("Tối đa 5 hashtag"), `write-kudo-hashtag-chip` (`data-slug`), `write-kudo-hashtag-chip-remove`.
Images: `write-kudo-image-add`, `write-kudo-image-input` (`type=file`, `multiple`, `accept`), `write-kudo-image-thumb`, `write-kudo-image-remove`, `write-kudo-image-error`. Anonymous: `write-kudo-anonymous-checkbox`, `write-kudo-anonymous-name` (`maxlength=50`). Footer: `write-kudo-cancel`, `write-kudo-submit` (`aria-disabled`, `aria-busy` while sending), `write-kudo-submit-spinner`.
Board (F006 ids reused): `kudo-person[data-role=sender][data-anonymous=true]` (alias text, no `img`, no `a`), `kudos-compose-pill` (`disabled` for no-sunner), `kudos-toast`, `coming-soon-modal`.

## Specs (title prefixed with TC/FR id; untagged → part of D)
- `e2e/write-kudo-modal-access-and-layout.spec.ts` — ID-0..6, ID-45; FR-101 (other pills still Coming soon), FR-103 (outsider pill disabled), FR-104 focus back to pill, FR-201 field order, FR-202/206/209 copy, FR-105 standards link `target=_blank` `/standards`, FR-224 Esc closes / backdrop does not, FR-225 Tab cycles inside, FR-226 EN cookie (no raw `writeKudo.` keys), FR-227 768/375 no horizontal scroll + stacked rows; guest `/sun-kudos` → `/login` (ID-1).
- `e2e/write-kudo-recipient-and-mention.spec.ts` — ID-8, 9, 10, 25, 26, 12, 13, 33; ≤10 options, viewer never listed, "duc" finds "Trần Minh Đức", clear button restores search; mention inserts node + text "@NguyenVanA"; Esc closes list without closing modal.
- `e2e/write-kudo-editor-and-link.spec.ts` — ID-27..32; `aria-pressed` toggles; link dialog: empty Text / `javascript:alert(1)` / `ftp://x` → errors, no insert; Esc closes dialog only; pasted `<h1><script>` → plain text only (FR-605).
- `e2e/write-kudo-hashtags-images-anonymous.spec.ts` — ID-14..24, 34..44, 53..55; chip removal keeps others; 5 selected → other options `aria-disabled` + limit text; images: 3 → add visible, 5 → hidden, remove → visible, pdf/mp4/txt → "Định dạng file không hợp lệ", >5 MB → "Ảnh vượt quá 5 MB", 7 picked at once → 5 kept; anonymous toggle shows/hides + clears alias (DEC-005).
- `e2e/write-kudo-submit-and-anonymous.spec.ts` — `test.describe.configure({mode:'serial'})`, identity `kudos-writer`, `beforeAll` reset. ID-7, 11, 48..52, 56 (aria-disabled yet clickable → all errors, `create_kudo` never hit: assert via request listener), errors on blur / clear when valid, US003 title required; ID-49 enabled; ID-46 (2 tags + 2 images: spinner, inputs + Hủy disabled during `delayMs`, toast "Đã gửi Kudos thành công!", first `kudo-card` in `kudos-feed` has the title, 2 images from mock public URL); ID-47 (1 tag, 0 images); anonymous submit → sender block shows alias (and "Người gửi ẩn danh" when empty), no avatar/link; failure (`failNext`) → error toast, modal + data kept, `/__e2e/storage/objects` empty again.
- Edit `e2e/kudos-sidebar-and-modal.spec.ts` TC FUNCTION 19: compose pill now opens `write-kudo-modal` (Hủy returns focus); keep the profile-search / Secret Box Coming soon cases unchanged.
- Helpers: `e2e/support/write-kudo-locators.ts`, `e2e/support/write-kudo-test-files.ts`, `e2e/support/write-kudo-session.ts` (open board as identity + open modal).
- Mock (each <200 lines): `mock-kudos-sunner-search.ts` (ALG-001 over the dataset: NFD strip marks, đ→d, lower, `includes`, ≤10, ≠viewer, by name), `mock-kudos-create-rules.ts` (INT-002 rules + error codes, writes into the writer dataset), `mock-storage-routes.ts` (upload/remove/public GET/CORS/control, in-memory map name → {owner, mime, bytes}), edits to `mock-kudos-rest-routes.ts` (2 RPCs, control routes, writer dataset), `mock-kudos-state.ts` (`MockKudo.isAnonymous/anonymousName/contentDoc`, writer dataset, reset), `mock-kudos-board-queries.ts` (card: `isAnonymous`, `anonymousName`, `sender:null` when anonymous; image url `kudo-images/…` passed through), `mock-kudos-fixture-people.ts` + `kudos-fixture-ids.ts` (new sunners), `mock-supabase-server.ts` (writer identity + one `/storage/v1/` and `/__e2e/storage/` delegation line; stays <200).

## Implementation Steps
1. Map 57 TCs → spec/test in `evidence/tc-mapping.md` (reasons where a TC is reinterpreted: ID-16 "+ Hashtag still shown or disabled" → panel limit state; ID-48 "disabled" → `aria-disabled` per clarifications; ID-23/24/55 "not uploaded" → not added, nothing in `/__e2e/storage/objects`).
2. Fixtures + mock files; extend server and login helper additively.
3. Probe with `curl` against `bun run e2e/support/start-mock-supabase.ts`: `search_sunners` shape, `create_kudo` errors, OPTIONS preflight headers, upload (raw + multipart) → public GET bytes, 401 without bearer.
4. Write the five specs + helpers + TC 19 edit.
5. Regression first: `bun run test:e2e --grep-invert "write-kudo|TC FUNCTION 19"` exit 0 (mock edits broke nothing; K included).
6. W `bun run test:e2e e2e/write-kudo-` → non-zero; confirm failures are locator/assertion failures on the modal.
7. Record `evidence/red-evidence.json`: `redTestFiles`, `redCommand`, `redExitCode`, `redFailure` (first 3 lines), timestamp, step-5 exit code.

## Todo List
- [x] TC mapping (`evidence/tc-mapping.md`)
- [x] Fixtures, identities, mock RPC + storage + control routes
- [x] Five specs + helpers; TC 19 case updated
- [x] Regression (non-write-kudo) recorded (1 expected red: TC 19, then green in phase 6)
- [x] Valid RED recorded (`evidence/red-evidence.json`)

## Success Criteria
Step 5 exit 0; W non-zero on screen assertions only; all 57 TCs mapped; no file >200 lines; `bunx tsc --noEmit` clean for e2e.

## Risk Assessment
- Mock re-implements SQL → keep to array logic; pgTAP (phase 3) is the authority; codes and shapes from phase-03 §Contract only.
- Created kudos leak into parallel specs → writer dataset only, serial spec, reset.
- Timing (debounce 250 ms, toast 3 s, spinner) → web-first assertions; `delayMs` control for the loading state instead of racing.

## Security Considerations
Control endpoints exist only in the mock. Fixtures hold no secrets. Mock enforces the same owner rule on image names so a forged name is rejected in E2E too.

## Next Steps
Hand `evidence/red-evidence.json` + §Selectors read-only to phases 2 and 6.

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/261015-0950-write-kudo-modal/clarifications.md
- testPolicy: e2e-red-first
