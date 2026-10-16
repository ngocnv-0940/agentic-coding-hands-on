---
phase: 2
title: "Write-kudo presentational UI (Track A)"
feature: write-kudo
status: completed
effort: 6h
owner_agent: momorph-ui-implementer
track: A
test_policy: e2e-red-first
depends_on: [1]
---
# Phase 02 — Viết Kudo UI (Track A)
**Screen:** Viết Kudo, fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `ihQ26W78P2`, node `520:11602`; sub-frames Addlink Box `OyDLDuSGEa`, hashtag list `p9zO-c4a4x`, recipient list `zJzaC9GgXt`, error state `5c7PkAibyD`, anonymous `p9vFVBE_tc`. Inputs: `momorph/write-kudo-{specs.csv,test-cases.md,frame.png}`, `spec/write-kudo/screens/SCR-write-kudo-modal/spec.md`, `clarifications.md`. RED read-only: `evidence/red-evidence.json`; selectors: phase-01 §Selectors.
**Goal:** Pixel-faithful, prop-driven, stateless modal sections (752 px, `min(752px,100vw-32px)`, inner scroll, rows stacked <640) plus the anonymous sender on the F006 card.
**Owned files:** `app/(main)/sun-kudos/_components/**`: new `write-kudo-view-types.ts`, `write-kudo-modal-view.tsx`, `write-kudo-field-row.tsx`, `recipient-picker-view.tsx`, `sunner-option-list-view.tsx` (recipient + mention, DRY), `kudo-editor-frame-view.tsx` (toolbar + standards link + `editorSlot` + ProseMirror content styles via Tailwind arbitrary variants, no global CSS), `add-link-dialog-view.tsx`, `hashtag-picker-view.tsx`, `image-picker-view.tsx`, `anonymous-field-view.tsx`, `write-kudo-footer-view.tsx`, `write-kudo-icons.tsx`; edits `kudo-card.tsx`, `kudo-person.tsx`, `kudos-view-types.ts`, `kudos-banner.tsx` (`composeDisabled`). Each <200 lines.
**Out of scope:** `page.tsx`, `_wiring/**`, `_behavior/**`, `lib/**`, dictionaries, Tiptap imports (editor arrives as `editorSlot`), focus trap/Esc logic, debounce, upload, router, effects/timers.
**Integration contract** (`write-kudo-view-types.ts`; strings arrive pre-translated in `labels`):
- `WriteKudoModalView({ open, labels, onBackdropClick?, dialogRef, children })` — backdrop click handler is optional and unused by wiring (FR-224).
- `WriteKudoFieldRow({ field, label, required, error: string|null, children })` → `data-field`, `data-invalid`.
- `RecipientPickerView({ query, onQueryChange, onFocus, onBlur, onKeyDown, open, selected: SunnerOptionView|null, onClear, listSlot, disabled, placeholder, inputRef })`; `SunnerOptionListView({ options: SunnerOptionView[], activeIndex, status:'idle'|'loading'|'empty'|'ready', onPick(id), emptyLabel, position?:{top,left} })`; `SunnerOptionView = {id,name,avatarUrl,department}`.
- `KudoEditorFrameView({ tools: Record<'bold'|'italic'|'strike'|'orderedList'|'link'|'quote', {active, onClick, label}>, standardsHref:'/standards', standardsLabel, editorSlot, hint, disabled, invalid })`; `AddLinkDialogView({ open, text, url, errors:{text?,url?}, onText, onUrl, onCancel, onSave, labels })`.
- `HashtagPickerView({ options:{slug,label,selected,disabled}[], open, onToggleOpen, onToggle(slug), onRemove(slug), atLimit, labels, disabled })`; `ImagePickerView({ items:{id,previewUrl}[], canAdd, onPick(files: FileList), onRemove(id), error: string|null, accept, labels, disabled, inputRef })`.
- `AnonymousFieldView({ checked, onToggle, name, onName, labels, disabled })`; `WriteKudoFooterView({ submitting, incomplete, onCancel, onSubmit, labels })` (Gửi stays clickable, `aria-disabled={incomplete}`).
- `KudoCardView.sender: PersonView | null` + `isAnonymous`, `anonymousName`; anonymous → alias or `labels.anonymousSender`, no avatar, no link, no badge (FR-401). `KudosBannerProps.composeDisabled?: boolean`.
**Checks:** `bunx tsc --noEmit`, `bun run lint`; asset coverage vs MoMorph → `evidence/asset-coverage-phase-02.md`. W stays red until phase 6. Next 16: read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/{image,link}.md` (cd into the dir) before `next/image`/`next/link`.

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/261015-0950-write-kudo-modal/clarifications.md
- testPolicy: e2e-red-first
