---
phase: 5
title: "Client behaviour hooks + Tiptap editor (Track B)"
feature: write-kudo
status: completed
priority: P1
effort: 5h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [4]
---

# Phase 05 — `app/(main)/sun-kudos/_behavior/**` (write-kudo) + editor dependency

## Context Links
- `technical-spec.md` A2–A13, SM-001, DEC-001..007, §3.8 edge cases; phase-04 files; phase-02 view prop types (read-only, hook return shapes)
- Existing patterns: `_behavior/kudo-feedback-provider.tsx` (toast `show`), `app/(main)/_behavior/use-dropdown-menu.ts` (outside click/Esc)
- Tiptap 3.32 docs: `https://tiptap.dev/docs/editor/getting-started/install/nextjs`, StarterKit config, Mention + Suggestion `render` lifecycle, Link `isAllowedUri`
- Next 16 (cd into `node_modules/next/dist/docs/01-app/`): `03-api-reference/04-functions/use-router.md` (`refresh`), `02-guides/preserving-ui-state.md` (`useLayoutEffect` cleanup closes transient UI when Activity hides)

## Overview
All interaction state for the modal; no markup beyond what Tiptap's `EditorContent` needs (rendered by phase 6 into `editorSlot`). Proven by W in phase 6.

## Dependency (owned here)
`bun add --exact @tiptap/react@3.32.0 @tiptap/pm@3.32.0 @tiptap/core@3.32.0 @tiptap/starter-kit@3.32.0 @tiptap/extension-mention@3.32.0 @tiptap/suggestion@3.32.0 @tiptap/extensions@3.32.0` (peers React ^19 → OK with 19.3.0; core/pm/suggestion are peers, pinned explicitly so versions never skew). No floating-ui/tippy: the suggestion popup is a React list positioned from `clientRect()`. Re-check `bun run build` bundle: Tiptap must only be in the lazy modal chunk (phase 6 `next/dynamic`).

## Requirements / files (each <200 lines, `'use client'`)
- `kudo-editor-extensions.ts` — `StarterKit.configure({ heading:false, bulletList:false, codeBlock:false, code:false, horizontalRule:false, underline:false, dropcursor:false, gapcursor:false, link:{ openOnClick:false, autolink:false, linkOnPaste:false, protocols:['http','https'], isAllowedUri: isLinkUrlValid, HTMLAttributes:{ target:'_blank', rel:'noopener noreferrer' } } })` + `Placeholder` (from `@tiptap/extensions`) + `Mention.configure({ renderText: '@'+label, suggestion: bridge })`. Schema = whitelist in phase-03 §Contract, so pasted HTML outside it becomes text (A5, FR-605).
- `use-kudo-editor.ts` — `useEditor({ extensions, immediatelyRender:false, editable: !disabled })`; exposes `editor`, tool states (`isActive`) + commands (`toggleBold/Italic/Strike/OrderedList/Blockquote`), `insertLink({text,url})` (apply to selection or insert text with mark), `plainText()` = `editor.getText({ blockSeparator:'\n' })` (ALG-002 via Mention `renderText`), `json()`, `isEmptyText`, `setEditable`; touched/blur callback for DEC-002.
- `use-mention-suggestion.ts` — bridge object for `suggestion.render()` → React state `{open, query, items, activeIndex, rect, command}`; `items` from `use-sunner-search`; `onKeyDown` handles ArrowUp/Down/Enter/Escape (returns true so ProseMirror consumes it) and marks the event handled for the modal Esc guard.
- `use-sunner-search.ts` — `(query) → {status, options}`; trim; '' → idle without call; 250 ms debounce; request sequence number, stale responses dropped (§3.8); error → empty.
- `use-recipient-picker.ts` — open/close, query, keyboard (Arrow/Enter/Esc), `select(option)` → closes, `clear()` → back to search + refocus input; outside click closes.
- `use-hashtag-picker.ts` — open/close (outside click, Esc closes panel only), `toggle(slug)` ignored when at 5 and not selected, `remove(slug)`, `atLimit`.
- `use-image-attachments.ts` — `add(FileList)`: per file `sniffImageMime` on first 12 bytes (`file.slice(0,12).arrayBuffer()`) must equal an allowed mime, size ≤5 MB; invalid → error text key (format vs size), not added; keep first `5 - count`; `URL.createObjectURL` preview, revoked on remove/unmount; `canAdd`.
- `use-add-link-dialog.ts` — open (prefill Text from selection), validate with `isLinkTextValid`/`isLinkUrlValid`, save → `insertLink`, Esc/Hủy close dialog only, focus back to the link tool.
- `use-modal-focus-trap.ts` — on open focus the recipient input (FR-225), Tab/Shift+Tab cycle inside `dialogRef`, Esc → `onEscape` unless `event.defaultPrevented`, a nested layer (link dialog, mention list, hashtag panel, recipient list) is open, or submitting; on close return focus to the opener (FR-104).
- `use-write-kudo-form.ts` — field state (receiver, title, anonymous, alias), `touched` set, `showAllErrors` flag; derives `errors` and `incomplete` from `requiredFieldErrors` (+ hashtag/editor state passed in); unchecking anonymous clears alias (DEC-005).
- `use-submit-kudo.ts` — SM-001: `submit()` → if incomplete: `showAllErrors`, return (no network); else `submitting` (inputs, Hủy, Esc locked; second click ignored) → `uploadKudoImages(files)` → `createKudoAction(payload)` → ok: `onClose()`, `show(success)`, `router.refresh()` · fail: `removeKudoImages(names)`, `show(errorFor(code))`, back to editing with data kept (BR-010, FR-223).

## Implementation Steps
1. Install deps (exact), confirm `bun.lock` diff is the Tiptap family only.
2. Read the Next docs above and Tiptap Next.js install page.
3. Write hooks; dispose every listener/timer/object URL/editor (`editor.destroy` via `useEditor` cleanup).
4. `bunx tsc --noEmit`, `bun run lint` exit 0.

## Todo List
- [x] Tiptap 3.32.0 family installed exact
- [x] Editor extensions + editor hook + mention bridge
- [x] Search, recipient, hashtag, image, link dialog hooks
- [x] Focus trap + form + submit hooks
- [x] tsc + lint exit 0

## Success Criteria
tsc/lint clean; no data literals; no `dangerouslySetInnerHTML`; every listener/timer/object URL disposed; hook returns match phase-02 props.

## Risk Assessment
- Esc closes the whole modal while closing the mention list/link dialog → layered guard in the focus-trap hook; W asserts.
- Hydration warning from Tiptap → `immediatelyRender:false` and the modal only mounts client-side.
- MIME spoofing by extension → magic-byte sniff + bucket `allowed_mime_types`.

## Security Considerations
Links limited to http/https at input, paste and server. Mentions carry ids only from search results; server checks they exist. No HTML rendered from user input.

## Next Steps
Phase 6 composes hooks with Track A views.

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/261015-0950-write-kudo-modal/clarifications.md
- testPolicy: e2e-red-first
