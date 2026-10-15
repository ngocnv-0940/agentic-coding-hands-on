# Track A (phase 02) handoff: Viết Kudo presentational UI

Mode screen, testPolicy e2e-red-first (RED evidence `evidence/red-evidence.json`, status valid-red, validated). No GREEN here: the W specs stay red until phase 6 wires the modal. Nothing committed.

## Files (all under `app/(main)/sun-kudos/_components/`)
New: write-kudo-view-types.ts 190, write-kudo-modal-view.tsx 45, write-kudo-field-row.tsx 88 (also `WriteKudoTitleInputView`, `FIELD_BOX`, `FIELD_TEXT`, `MODAL_FOCUS_RING`), recipient-picker-view.tsx 86, sunner-option-list-view.tsx 70, kudo-editor-frame-view.tsx 99, add-link-dialog-view.tsx 99, hashtag-picker-view.tsx 96, image-picker-view.tsx 77, anonymous-field-view.tsx 43, write-kudo-footer-view.tsx 45, write-kudo-icons.tsx 120.
Edited: kudo-card.tsx (141), kudo-person.tsx (77), kudos-view-types.ts, kudos-banner.tsx (`composeDisabled`). No public assets were exported (every icon is inline SVG).

## Checks
- `bunx tsc --noEmit` exit 0; `bun run lint` exit 0.
- Asset coverage `validate_coverage.py` exit 0; see `evidence/asset-coverage-phase-02.md`.
- Visual evidence: reference `momorph/write-kudo-frame.png` (+ Addlink Box and hashtag list images pulled from MoMorph). NO actual screenshot yet: the components are not mounted anywhere (wiring is phase 6) and I have no browser. Phase 6 / tester must capture the modal at 1440x1024 with the same state (open, empty) and compare. Not DONE-grade visual evidence.

## Integration notes for phase 5/6 (wiring)
1. Added beyond the contract: `WriteKudoTitleInputView` (the contract had no title component; props in write-kudo-view-types.ts), `SUNNER_LIST_ID` / `sunnerOptionId(index)` exports in sunner-option-list-view.tsx (use `sunnerOptionId(activeIndex)` as `activeOptionId` of the recipient picker), optional `RecipientPickerViewProps.invalid | clearLabel | activeOptionId`, `WriteKudoFieldRowProps.align`.
2. `KudoEditorFrameView` owns `data-testid="write-kudo-editor"` (wraps `editorSlot`). The Tiptap `EditorContent` must NOT repeat it (strict-mode duplicate). The frame fixes the box at 200px with inner scroll and carries the ProseMirror content styles (list, quote, link, mention, `p[data-placeholder]::before` placeholder) as Tailwind variants; Tiptap Placeholder must write `data-placeholder` on the first empty `p`.
3. Toolbar buttons call `preventDefault` on mousedown so the editor selection survives; Gửi calls `onSubmit` unless `submitting` (still clickable while `aria-disabled`).
4. Image picker: "+ Image" is a `<label>` for the hidden file input (`inputRef`), so the native chooser opens without script; `onPick` receives the live `FileList`, copy it before resetting `input.value`. Pass `error` to the picker only; leave the images FieldRow `error` null or the message shows twice.
5. Recipient picker hides the input (`hidden`) while `selected` is set; after `onClear` the wiring focuses `inputRef`. The list renders only while `open`. `SunnerOptionListView` stops `mousedown` default so field blur does not close the list before a click; with `position` it is `absolute` at top/left inside the nearest positioned ancestor (mention).
6. Card: `sender` may be `null`; `isAnonymous` / `anonymousName` optional and `KudoCardLabels.anonymousSender` optional so `_wiring/**` (not mine) still compiles. Phase 6 must pass `labels.anonymousSender` ("Người gửi ẩn danh"), `isAnonymous`, `anonymousName`, and `to-kudo-card-view.ts` must map a null sender. Anonymous sender renders `data-anonymous="true"`, an aria-hidden svg silhouette (no `img`, no `a`) and the alias text.
7. `KudosBanner` gets `composeDisabled?`: pass `true` for a viewer without a sunner row (native `disabled`). The profile pill's hover rule became `enabled:hover:` only.
8. Link dialog renders its own `fixed z-[60]` mask inside the modal DOM (focus trap stays inside `write-kudo-modal`); its inputs have no `maxlength` so the wiring can show the 1 to 100 / URL errors. Title input has `maxlength=100`, anonymous alias `maxlength=50`.

## Deviations / judgment calls (no Figma value exists)
- Hashtag chips, the hashtag limit line, the alias input, the picker clear button, loading skeleton and spinner are not drawn in the frames; they reuse the field chrome and design tokens.
- Hashtag selected tick uses the Material check-circle (node 1002:13204 has no export). Recipient list reuses the dark Dropdown-list styling (the recipient dropdown frame has no image or style data in MoMorph).
- Sub-frames "Lỗi chưa điền đủ" (5c7PkAibyD) and "Ẩn danh" (p9vFVBE_tc) have no image or style data in MoMorph; error uses #cf1322 (the asterisk red in the frame) for border and message; Gửi dims with opacity 60.
- Responsive (derived, per clarifications): card `w-full max-w-[752px]` inside a 16px-padded backdrop, `max-h-full overflow-y-auto`, rows stack below 640px, padding 20px under sm.
- The toolbar/editor borders are not merged (Figma stacks two 1px borders); revisit if the tester sees a thicker line than the PNG.

**Status:** DONE_WITH_CONCERNS
**Summary:** All twelve new components and the four card/banner edits are in place, tsc and lint exit 0, asset coverage exit 0; selectors match the contract. The RED specs stay red until phase 6 mounts the modal.
**Concerns/Blockers:** No actual-vs-reference screenshot (components unmounted, no browser for this agent). Title input component and a few optional props were added beyond the stated contract. Card anonymity fields are optional until phase 6 updates `_wiring`.
