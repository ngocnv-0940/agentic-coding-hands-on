# TC mapping — Viết Kudo (phase 1, e2e-red-first)

Source: `momorph/write-kudo-test-cases.md` (57 TCs, ID-0..ID-56). Every row maps to a test in
`e2e/write-kudo-*.spec.ts`. Titles carry the TC id. `R` = reinterpreted (reason given).
The phase-1 RED run lives in `evidence/e2e-red-write-kudo-output.txt`. Phase 6 GREEN: `evidence/final-W-dev-output.txt` (76/76, exit 0) and `evidence/final-W-prod-output.txt` (76/76, exit 0); all 57 TC rows PASS in both modes.

| TC | Spec file | Test (title prefix) | Note | Final (phase 6) |
|----|-----------|---------------------|------|-----------------|
| ID-0 | write-kudo-modal-access-and-layout | TC ID-0 / FR-101 | | PASS (dev + prod) |
| ID-1 | write-kudo-modal-access-and-layout | TC ID-1 / FR-106 | guest guard, already green | PASS (dev + prod) |
| ID-2 | write-kudo-modal-access-and-layout | TC ID-2 / ID-3 / FR-201 | | PASS (dev + prod) |
| ID-3 | write-kudo-modal-access-and-layout | TC ID-2 / ID-3 / FR-201 | order and footer | PASS (dev + prod) |
| ID-4 | write-kudo-modal-access-and-layout | TC ID-4 / FR-202 | | PASS (dev + prod) |
| ID-5 | write-kudo-modal-access-and-layout | TC ID-5 / FR-206 | placeholder read from `data-placeholder` | PASS (dev + prod) |
| ID-6 | write-kudo-modal-access-and-layout | TC ID-6 | | PASS (dev + prod) |
| ID-7 | write-kudo-submit-and-anonymous | TC ID-7 / ID-50 | recipient error, not submitted | PASS (dev + prod) |
| ID-8 | write-kudo-recipient-and-mention | TC ID-8 | exactly 10 of 13 matches (cap) | PASS (dev + prod) |
| ID-9 | write-kudo-recipient-and-mention | TC ID-9 | R: "no result" branch (literal special chars, nothing matches) | PASS (dev + prod) |
| ID-10 | write-kudo-recipient-and-mention | TC ID-10 | same list as "Nguyễn" after trim | PASS (dev + prod) |
| ID-11 | write-kudo-submit-and-anonymous | TC ID-11 / ID-51 | | PASS (dev + prod) |
| ID-12 | write-kudo-recipient-and-mention | TC ID-12 / ID-33 | | PASS (dev + prod) |
| ID-13 | write-kudo-recipient-and-mention | TC ID-13 | | PASS (dev + prod) |
| ID-14 | write-kudo-hashtags-images-anonymous | TC ID-14 | | PASS (dev + prod) |
| ID-15 | write-kudo-hashtags-images-anonymous | TC ID-15 | chip only; "submit succeeds" is ID-47 | PASS (dev + prod) |
| ID-16 | write-kudo-hashtags-images-anonymous | TC ID-16 | R: "+ Hashtag still shown or disabled (per spec)" asserted as visible; the limit state is ID-17 | PASS (dev + prod) |
| ID-17 | write-kudo-hashtags-images-anonymous | TC ID-17 / ID-53 | aria-disabled options, limit text, sixth refused | PASS (dev + prod) |
| ID-18 | write-kudo-hashtags-images-anonymous | TC ID-18 / ID-21 | 1 jpg thumbnail; "+ Image" visible | PASS (dev + prod) |
| ID-19 | write-kudo-hashtags-images-anonymous | TC ID-19 / ID-20 / ID-54 | 5 thumbnails hide "+ Image" | PASS (dev + prod) |
| ID-20 | write-kudo-hashtags-images-anonymous | TC ID-19 / ID-20 / ID-54 | sixth pick ignored | PASS (dev + prod) |
| ID-21 | write-kudo-hashtags-images-anonymous | TC ID-18 / ID-21 | jpg | PASS (dev + prod) |
| ID-22 | write-kudo-hashtags-images-anonymous | TC ID-22 (png) and TC ID-22 (webp) | | PASS (dev + prod) |
| ID-23 | write-kudo-hashtags-images-anonymous | TC ID-23 | R: "not uploaded" = not added and zero `/storage/v1/` requests during the pick | PASS (dev + prod) |
| ID-24 | write-kudo-hashtags-images-anonymous | TC ID-24 | R: as ID-23 (mp4) | PASS (dev + prod) |
| ID-25 | write-kudo-recipient-and-mention | TC ID-25 | | PASS (dev + prod) |
| ID-26 | write-kudo-recipient-and-mention | TC ID-26 | | PASS (dev + prod) |
| ID-27 | write-kudo-editor-and-link | TC ID-27 | `strong`, aria-pressed | PASS (dev + prod) |
| ID-28 | write-kudo-editor-and-link | TC ID-28 | `em` | PASS (dev + prod) |
| ID-29 | write-kudo-editor-and-link | TC ID-29 | `s` | PASS (dev + prod) |
| ID-30 | write-kudo-editor-and-link | TC ID-30 | `ol > li` x2 | PASS (dev + prod) |
| ID-31 | write-kudo-editor-and-link | TC ID-31 | link dialog inserts `a[target=_blank][rel~=noopener]` | PASS (dev + prod) |
| ID-32 | write-kudo-editor-and-link | TC ID-32 | `blockquote` | PASS (dev + prod) |
| ID-33 | write-kudo-recipient-and-mention | TC ID-12 / ID-33 | | PASS (dev + prod) |
| ID-34 | write-kudo-hashtags-images-anonymous | TC ID-34 | R: "TeamWork" = existing `#Teamwork` option (clarifications, no free text) | PASS (dev + prod) |
| ID-35 | write-kudo-hashtags-images-anonymous | TC ID-35 | | PASS (dev + prod) |
| ID-36 | write-kudo-hashtags-images-anonymous | TC ID-36 | | PASS (dev + prod) |
| ID-37 | write-kudo-hashtags-images-anonymous | TC ID-37 | real file chooser via "+ Image" | PASS (dev + prod) |
| ID-38 | write-kudo-hashtags-images-anonymous | TC ID-38 | five picks through the button | PASS (dev + prod) |
| ID-39 | write-kudo-hashtags-images-anonymous | TC ID-39 | | PASS (dev + prod) |
| ID-40 | write-kudo-hashtags-images-anonymous | TC ID-40 | | PASS (dev + prod) |
| ID-41 | write-kudo-hashtags-images-anonymous | TC ID-41 / ID-42 | | PASS (dev + prod) |
| ID-42 | write-kudo-hashtags-images-anonymous | TC ID-41 / ID-42 | | PASS (dev + prod) |
| ID-43 | write-kudo-hashtags-images-anonymous | TC ID-43 / ID-44 | alias maxlength 50 | PASS (dev + prod) |
| ID-44 | write-kudo-hashtags-images-anonymous | TC ID-43 / ID-44 | | PASS (dev + prod) |
| ID-45 | write-kudo-modal-access-and-layout + write-kudo-submit-and-anonymous | TC ID-45 (both) | modal discards data; storage side: picked then Hủy is never uploaded | PASS (dev + prod) |
| ID-46 | write-kudo-submit-and-anonymous | TC ID-46 | spinner, disabled inputs and Hủy, toast, new kudo first, 2 images | PASS (dev + prod) |
| ID-47 | write-kudo-submit-and-anonymous | TC ID-47 | | PASS (dev + prod) |
| ID-48 | write-kudo-submit-and-anonymous | TC ID-48 | R: "Gửi disabled" = `aria-disabled="true"`, still clickable (clarifications) | PASS (dev + prod) |
| ID-49 | write-kudo-submit-and-anonymous | TC ID-49 | R: title added to the required set (clarifications, Danh hiệu) | PASS (dev + prod) |
| ID-50 | write-kudo-submit-and-anonymous | TC ID-7 / ID-50 | | PASS (dev + prod) |
| ID-51 | write-kudo-submit-and-anonymous | TC ID-11 / ID-51 | | PASS (dev + prod) |
| ID-52 | write-kudo-submit-and-anonymous | TC ID-52 | | PASS (dev + prod) |
| ID-53 | write-kudo-hashtags-images-anonymous | TC ID-17 / ID-53 | same behaviour as ID-17 | PASS (dev + prod) |
| ID-54 | write-kudo-hashtags-images-anonymous | TC ID-19 / ID-20 / ID-54 | | PASS (dev + prod) |
| ID-55 | write-kudo-hashtags-images-anonymous | TC ID-55 (loop with ID-23, ID-24) | txt; R: as ID-23 | PASS (dev + prod) |
| ID-56 | write-kudo-submit-and-anonymous | TC ID-56 / US003 | errors on recipient, title, content, hashtags; `create_kudo` count unchanged | PASS (dev + prod) |

## Additional requirement tests (FR/DEC, not TC rows)
- FR-103 outsider pill disabled; FR-104 focus back; FR-105 standards link; FR-202/206/209 copy; FR-224 Esc and backdrop; FR-225 Tab trap; FR-226 EN no raw keys; FR-227 768/375 no overflow and 1440 width 752.
- FR-307..309 (diacritics, clear, Esc layering), FR-306 viewer never listed, FR-404 aria-pressed toggle, FR-503..505 link validation, FR-605 paste.
- FR-603 limit, FR-704 seven at once, FR-706 oversize, DEC-005 alias clear, FR-604 anonymous card alias, FR-802 empty alias default, FR-903 failed submit cleanup.
- Edited F006 case: `kudos-sidebar-and-modal.spec.ts` TC FUNCTION 19 (compose pill now opens the write-kudo modal).

## Partial or not automated here
- FR-227 "rows stack under 640 px": asserted only as "recipient input spans >= 60% of the modal at 375". Exact stacking is for the visual phase (phase 6).
- Title counter, mention hint copy: not in clarifications, so no copy assertion beyond visibility (mention hint only in the selector contract).
- Visual parity with `momorph/write-kudo-frame.png`: phase 6 (visual-contract step), not this phase.
- Real SQL behaviour (search, create_kudo rules, storage RLS, masking): pgTAP in phase 3; the mock mirrors the contract only.


## Phase 6 test-side corrections (tester owns e2e/)
- Modal heading assertion: Figma title "Gửi lời cám ơn và ghi nhận đến đồng đội" (was "Viết Kudo"); ID-0 title updated.
- ID-13 types "Cảm ơn @Nguyen" before picking NguyenVanA (orchestrator decision; assertion unchanged).
- Clicks on `aria-disabled` controls use `{ force: true }` (Playwright refuses them otherwise); the assertions stay.
- Hashtag listbox is closed (heading click) before any Gửi click; `submitKudo` helper for successful submits.
- ID-34 retries the first "+ Hashtag" click (`toPass`): a prod-only click before handler attach was dropped.
- Settle click on the heading before the hashtag open and the standards link (recipient blur shifts controls).
- ID-46 kudo-image assertion uses `href` (the link carries the Storage URL; the `<img>` carries `src`).
- Mock upload parser reads the multipart file part by hand (supabase-js sends it with an empty field name, which `FormData` drops).
- Mock resets split: `/__e2e/kudos/reset-likes` (like spec) and `/__e2e/kudos/reset-writes` (write specs); the full reset stays for compatibility.
- FR-404 and FR-405 raise the test timeout to 90 s (two browser contexts under dev-mode load); no assertion changed.
