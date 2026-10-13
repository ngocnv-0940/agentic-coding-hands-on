---
phase: 4
title: "Category nav behavior: click, scroll-spy, hash"
feature: awards-information
status: completed
priority: P1
effort: 2h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
---

# Phase 04 — Category menu behavior (A2, A3, A4)

## Context Links
- `clarifications.md` (click + scroll-spy + deep link; D007 replaceState on click only)
- Spec: `technical-spec.md` §3.2 A2–A4, §3.4 edge cases, §4.4 BR-002 state table, §4.5 ALG-001; `functional-spec.md` FR-401..405, DEC-001
- Next docs: `01-app/01-getting-started/04-linking-and-navigating.md` ("Native History API"), `03-api-reference/02-components/link.md` ("Scrolling to an id"), `05-server-and-client-components.md`
- Precedent hook: `app/(main)/_behavior/use-site-navigation.ts` (reduced-motion handling)
- RED: `evidence/red-evidence.json` (`awards-information-category-navigation.spec.ts`)

## Overview
Client-only behavior for the category menu: one active slug driven by click, scroll-spy and URL hash, with no flicker during programmatic smooth scroll. No UI markup.

## Key Insights
- First render returns `slugs[0]` on server and client → no hydration mismatch; hash read happens in `useEffect`.
- Next 16 integrates `window.history.replaceState(null, '', '#slug')` with its router (docs: Native History API). `replaceState` fires no `hashchange` → no feedback loop.
- Offset line = computed `scroll-margin-top` of the section (Track A sets it responsively) + small tolerance → one source for header (+ tab row) height; `scrollIntoView({ block: 'start' })` honors the same margin.
- Suppression: on click set `lockRef = slug`; IntersectionObserver callbacks ignore updates while locked; release on window `scrollend` or a ~1000 ms fallback timer (`scrollend` support varies). After release keep the clicked slug (US002 error scenario); next user scroll recomputes.
- Section never reaching the line (last card near page bottom): clamp — when `scrollY + innerHeight >= scrollHeight - 2`, pick the last slug.
- Horizontal tab row: keep the active tab visible via `list.scrollTo({ left })` on the list element only — never `scrollIntoView` on the tab (it can cancel the page smooth scroll).
- `prefers-reduced-motion: reduce` → `behavior: 'auto'` (precedent).

## Requirements
FR-401, FR-403, FR-404, FR-405, BR-002, DEC-001, ALG-001, D007; US002, US003; SC-003, SC-004, SC-005. Unknown/garbled hash (`#abc`, `#%E0`) → no throw, no scroll, active unchanged.

## Architecture
```
_behavior/award-hash.ts            (pure)
  parseAwardHash(hash: string, slugs: readonly AwardSlug[]): AwardSlug | null   // strips '#', safe decode (try/catch), membership check
_behavior/use-award-category-spy.ts   ('use client')
  useAwardCategorySpy(slugs): { activeSlug: AwardSlug; select(slug, e?: MouseEvent): void }
    select   → e?.preventDefault(); setActive; lock; scrollIntoView(smooth|auto); replaceState(null,'',`#${slug}`)
    mount    → parseAwardHash(location.hash) → valid: setActive + lock + scrollIntoView(auto)
    hashchange listener → same as mount
    IntersectionObserver(rootMargin `-${line}px 0px -60% 0px`) on section#slug → if !locked: ALG-001 over getBoundingClientRect
    cleanup  → disconnect, remove listeners, clear timer
_behavior/use-keep-active-tab-in-view.ts   ('use client')
  useKeepActiveTabInView(listRef, activeSlug): void   // no-op when list does not overflow horizontally
```
ALG-001: `current = slugs[0]; for s of slugs: if rect(s).top <= line → current = s; bottom clamp → last`.

## Related Code Files
Create: `app/(main)/_behavior/award-hash.ts`, `app/(main)/_behavior/use-award-category-spy.ts`, `app/(main)/_behavior/use-keep-active-tab-in-view.ts`.
Modify: none. Read-only: `lib/awards/award-categories.ts` (`AWARD_SLUGS`, `AwardSlug`).

## Implementation Steps
1. Read listed Next docs (`cd node_modules/next/dist/docs`).
2. `award-hash.ts`; self-check in a throwaway `bun -e` (not committed): `#mvp`→`mvp`, `#abc`→null, `''`→null, `#%E0`→null.
3. `use-award-category-spy.ts` per Architecture; no `Date.now()`/random in render.
4. `use-keep-active-tab-in-view.ts`.
5. `bunx tsc --noEmit`, `bun run lint`.

## Todo List
- [ ] `award-hash.ts` + scratch check — OPEN: `award-hash.ts` exists; scratch run not preserved in evidence (plan.md drift 9). Behavior covered indirectly by E2E ID-13 (`#abc`)
- [x] `use-award-category-spy.ts` (click, lock/unlock, hash mount + hashchange, cleanup). Drift: scroll listener + rAF + `scrollend`/deadline lock, not IntersectionObserver (plan.md drift 1); lock split into `award-scroll-lock.ts` (drift 2)
- [x] `use-keep-active-tab-in-view.ts`
- [x] tsc 0, lint 0 (`evidence/tsc-final2-output.txt`, `evidence/lint-final2-output.txt`)

## Success Criteria
tsc/lint 0, scratch checks pass, each file <200 lines. Navigation E2E goes GREEN only after phase 5 wiring.

## Scope Contract
- **Changed:** three new `_behavior` files (no existing file touched).
- **Impacted:** none until wired (phase 5).
- **Will verify:** tsc, lint, scratch parser check.
- **Deliberately skipped:** E2E (no consumer yet).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Active flickers through intermediate sections | H | M | lock during click scroll; release on `scrollend`/timer; E2E MutationObserver record |
| `scrollend` unsupported → lock stuck | M | M | fallback timer always armed; cleared on `scrollend` |
| Hash scroll lands under sticky header | M | M | `scroll-margin-top` on sections; programmatic re-scroll on mount |
| `replaceState` desyncs Next router | L | M | `null` state per Next docs; hash-only URL; E2E asserts header `aria-current="page"` stays after click |
| Last section never active by scroll | M | L | bottom-of-page clamp |

## Security Considerations
Hash is untrusted input: decoded in try/catch, matched against the fixed slug list, never used as a selector or HTML.

## Rollback
Revert commit; files unused until phase 5.

## Next Steps
Phase 5 container consumes both hooks.

## MoMorph refs:
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/261013-0720-awards-information-page/clarifications.md
- testPolicy: e2e-red-first
