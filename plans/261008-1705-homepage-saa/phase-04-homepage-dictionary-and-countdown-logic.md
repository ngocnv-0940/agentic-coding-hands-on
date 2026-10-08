---
phase: 4
title: "Homepage dictionary, EVENT_START_AT, countdown logic"
feature: F003
status: completed
priority: P1
effort: 2h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
soft_depends_on: ["phase-02 step 1: momorph/homepage-copy-vi.md (VN copy only)"]
---

# Phase 04 — Dictionary keys + EVENT_START_AT + countdown

## Context Links
- `clarifications.md` (D005–D008, countdown per minute, Figma copy wins), `spec/homepage/technical-spec.md` A3, A8, §4.4 BR-002, §4.5 ALG-001
- `momorph/homepage-copy-vi.md` (verbatim VN copy, produced by phase 2 step 1), `momorph/homepage-specs.csv`
- Code: `lib/i18n/dictionary-{vi,en}.ts`, `lib/i18n/get-dictionary.ts`
- Next docs: `01-app/01-getting-started/05-server-and-client-components.md`, `08-caching.md`, `03-api-reference/04-functions/connection.md`; env vars guide (server-only, non-`NEXT_PUBLIC_`)

## Overview
Add homepage + placeholder + menu strings (vi/en), a strict `EVENT_START_AT` parser, `dd/MM/yyyy` formatter in Asia/Ho_Chi_Minh, the countdown algorithm, a client `useCountdown` hook, and the static award category list. No UI.

## Key Insights
- Parity is compile-time: `Dictionary` derives from `vi`; spreading `homeVi` into `vi` keeps it (`as const` on both).
- Keep files <200 lines: new keys in `dictionary-home-{vi,en}.ts`; main files only spread them.
- Parse strictly: regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$` then `Date.parse` not NaN. Offset-less → invalid (no server-TZ guess). Empty/undefined → invalid.
- Hydration: server computes `initial` snapshot (needs `await connection()` before `Date.now()` under cacheComponents — caller's job, phase 6); hook's first render returns `initial` verbatim, recomputes in `useEffect` immediately, then ticks aligned to the next minute boundary (`setTimeout` to boundary, then `setInterval(60_000)`), cleared on unmount.
- Invalid or reached target → `{ '00','00','00', comingSoon: false }`; hook stops ticking once reached.

## Requirements
FR-001, FR-003, FR-204, FR-205 (format), FR-208/209 data (BR-006), FR-405 (strings), BR-001, BR-002, BR-003, DEC-001, DEC-005, ALG-001, US003, US009; SC-004, SC-008.

## Architecture
```
lib/event/event-start-config.ts   (server-safe, pure)
  parseEventStart(raw?: string): Date | null
  formatEventDate(d: Date | null): string            // 'dd/MM/yyyy' Asia/Ho_Chi_Minh, null → '—'
  getCountdown(target: Date | null, nowMs: number): CountdownValue
  type CountdownValue = { days: string; hours: string; minutes: string; comingSoon: boolean }
  readEventStartFromEnv(): Date | null               // parseEventStart(process.env.EVENT_START_AT)
lib/event/use-countdown.ts        ('use client')
  useCountdown(targetIso: string | null, initial: CountdownValue): CountdownValue
lib/awards/award-categories.ts
  AWARD_SLUGS = ['top-talent','top-project','top-project-leader','best-manager','signature-2025-creator','mvp'] as const
  AWARD_CATEGORIES: { slug; imageSrc: `/images/homepage/awards/${slug}.png`; titleKey; descriptionKey }[]
  awardHref(slug?: string) → slug ? `/awards-information#${slug}` : '/awards-information'
lib/i18n/dictionary-home-vi.ts / -en.ts  → spread into vi / en
```
Formatter: `Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })`.
ALG-001: `m = floor((t - now)/60000)`; `days = floor(m/1440)`, `hours = floor(m%1440/60)`, `minutes = m%60`; `padStart(2,'0')`; days ≥ 100 shows 3 digits (no truncation).
Key groups (names indicative): `home.meta.title`, `home.nav.{about,awards,kudos}`, `home.header.{notifications,account,logoAlt}`, `home.notifications.{title,empty}`, `home.account.{profile,signOut,admin}`, `home.hero.{comingSoon,days,hours,minutes}`, `home.event.{dateLabel,venueLabel,venue,livestream}`, `home.cta.{awards,kudos}`, `home.rootFurther.{p1..pN,quote}`, `home.awards.{caption,title,subtitle,detail}`, `home.award.<slug>.{title,description}`, `home.kudos.{eyebrow,title,body,detail,imageAlt}`, `home.footer.{standards,copyright}`, `home.widget.label`, `comingSoon.title`.

## Related Code Files
Create: `lib/event/event-start-config.ts`, `lib/event/use-countdown.ts`, `lib/awards/award-categories.ts`, `lib/i18n/dictionary-home-vi.ts`, `lib/i18n/dictionary-home-en.ts`.
Modify: `lib/i18n/dictionary-vi.ts`, `lib/i18n/dictionary-en.ts` (spread only).

## Implementation Steps
1. Read listed Next docs.
2. `event-start-config.ts` + `use-countdown.ts` per Architecture.
3. `award-categories.ts`.
4. Dictionaries: keys + EN authored copy first; VN values verbatim from `momorph/homepage-copy-vi.md` (if absent → status NEEDS_CONTEXT for VN long copy only; never invent). Copyright VN per Figma ("Bản quyền thuộc về Sun* © 2025"; CSV typo "vè" is not copied — confirm against Figma node).
5. `bunx tsc --noEmit` (parity), `bun run lint`.
6. Self-check parser in a throwaway `bun -e` (not committed): `2025-12-26T18:30:00+07:00` → `26/12/2025`; `2025-12-26T18:30` → null; `not-a-date`, `''` → null; `getCountdown` at 2d5h9m → `02/05/09/true`.

## Todo List
- [x] parser/formatter/countdown (`lib/event/event-start-config.ts`)
- [x] useCountdown hook (snapshot-first, minute-aligned) (`lib/event/use-countdown.ts`)
- [x] award categories (`lib/awards/award-categories.ts`)
- [x] vi/en dictionaries (parity tsc 0) (`lib/i18n/dictionary-home-{vi,en}.ts`)

## Scope Drift (sync-back)
- Strict calendar check added on top of the planned regex (rejects `2025-02-30`, `T24:00`). Reason: review finding (Low, accepted). Cost: a few lines in the parser.
- Minute-lag fix: hook re-arms at the floor change. Reason: countdown lagged a minute. Cost: one bug fix, covered by `evidence/countdown-minute-lag-probe-output.txt`.

## Success Criteria
tsc 0 (proves parity), lint 0, scratch checks above pass. E2E countdown/i18n specs go GREEN only after phase 6.

## Scope Contract
- **Changed:** `lib/i18n/**` (additive keys), `lib/event/**`, `lib/awards/**`.
- **Impacted:** login/todo pages consume the same `Dictionary` type (additive only — no existing key changed).
- **Will verify:** tsc parity, lint, scratch parser check; `e2e/language-selector-localization.spec.ts` (existing locale behavior intact).
- **Deliberately skipped:** homepage E2E (not wired yet; phase 6).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Copy artifact late | M | M | keys + EN first; VN fill last |
| Timezone drift server vs client date | L | M | date formatted on server only with explicit TZ |
| Timer leak / hydration warning | M | M | snapshot-first, cleanup in effect, no `Date.now()` during render |
| Dictionary file >200 lines | M | L | split files per Architecture |

## Security Considerations
`EVENT_START_AT` is non-secret but stays server-only (passed as prop). No user input parsed.

## Rollback
Revert commit; additive keys only, no consumer until phase 5/6.

## Next Steps
Phase 5 (menu/placeholder strings), phase 6 (wiring countdown + content).

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/261008-1705-homepage-saa/clarifications.md
- testPolicy: e2e-red-first
