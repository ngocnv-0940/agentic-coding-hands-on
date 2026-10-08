---
phase: 4
title: "i18n dictionary and locale cookie"
feature: F002
status: completed
priority: P1
effort: 1.5h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
---

# Phase 04 — i18n core (dictionary, getLocale, setLocale)

## Context Links
- `spec/localization/{functional-spec,technical-spec}.md` (A1–A3, BR-001/002, DEC-001/002, §4.6 config)
- `clarifications.md` (dictionary scope, EN copy authored by us, cookie 1y/path=/ /Lax)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/{cookies,refresh}.md`

## Overview
One typed vi/en dictionary owned by F002 covering every Login and /todo string; server-side locale resolution from `NEXT_LOCALE`; a Server Action that validates and writes the cookie and refreshes the route. No UI (selector is Track A), no layout edit (phase 07).

## Key Insights
- Cookies can be set only in Server Functions/Route Handlers; after `set` in a Server Action, call `refresh()` from `next/cache` so the client router re-renders with the new locale (explicit, documented in local Next docs).
- Type parity = compile-time guarantee (F002:BR-002): `en` typed as `Dictionary` derived from `vi` keys with `string` values.
- Exact, case-sensitive match on `vi` | `en`; anything else → `vi` on read, rejected on write.

## Requirements
- F002:FR-001, FR-002, FR-401, FR-403, FR-404 (lang value source), FR-601; BR-001, BR-002; US002.
- Feeds F001:FR-205 (all Login strings from dictionary) and F001 D002 (/todo strings).

## Architecture
```
lib/i18n/locale-config.ts     LOCALES=['vi','en'] as const; type Locale; DEFAULT_LOCALE='vi';
                              LOCALE_COOKIE='NEXT_LOCALE'; isLocale(x); resolveLocale(raw?) → Locale
lib/i18n/dictionary-vi.ts     export const vi = {...}; export type Dictionary = { [K in keyof typeof vi]: string }
lib/i18n/dictionary-en.ts     export const en: Dictionary = {...}
lib/i18n/get-locale.ts        async getLocale() = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
lib/i18n/get-dictionary.ts    getDictionary(locale) → vi|en
lib/i18n/set-locale-action.ts 'use server'; setLocale(raw: string): if !isLocale → return;
                              (await cookies()).set(LOCALE_COOKIE, raw, {path:'/', maxAge:31536000, sameSite:'lax'}); refresh()
```
Keys (flat, dot-namespaced): `meta.title`, `login.logoAlt`, `login.title` ("ROOT FURTHER" both), `login.subtitle`, `login.tagline`, `login.button` ("LOGIN With Google" both), `login.loading`, `login.error`, `login.footer`, `language.vi` ("VN"), `language.en` ("EN"), `language.menu`, `todo.title`, `todo.emailLabel`, `todo.logout` (vi "Đăng xuất", en "Logout"), `todo.emailMissing` ("—").
vi copy verbatim from design: "Bắt đầu hành trình của bạn cùng SAA 2025.", "Đăng nhập để khám phá!", "Đăng nhập không thành công. Vui lòng thử lại.", "Bản quyền thuộc về Sun* © 2025". EN authored (e.g. "Start your journey with SAA 2025.", "Sign in to explore!", "Sign-in failed. Please try again.", "Copyright © 2025 Sun*").

## Related Code Files
Create: the six `lib/i18n/*.ts` files above. Modify: none.

## Implementation Steps
1. `locale-config.ts` with pure helpers.
2. Dictionaries (vi source of truth for keys).
3. `get-locale.ts`, `get-dictionary.ts`.
4. `set-locale-action.ts` (validate → set → `refresh()`); no return payload, no throw on invalid input.
5. Prove parity: temporarily delete a key from `en` → `bunx tsc --noEmit` must fail; restore.
6. `bunx tsc --noEmit`, `bun run lint`.

## Todo
- [x] Config + helpers (`lib/i18n/locale-config.ts`)
- [x] vi/en dictionaries with all keys (`en` typed as `Dictionary`, so parity is compile-time)
- [x] getLocale / getDictionary (`lib/i18n/get-locale.ts`, `get-dictionary.ts`)
- [x] setLocale action (`lib/i18n/set-locale-action.ts`, validates, sets cookie, `refresh()`)
- [x] Parity check demonstrated — deleting `todo.logout` from `lib/i18n/dictionary-en.ts` gave tsc TS2741, key restored, final tsc exit 0. Evidence: phase-04 implementer handoff, controller-attested (not in `evidence/`; `evidence/temper-results.json` records only the final tsc exit 0)

## Delivery Status (reconciled 2026-10-08)
- Done: six `lib/i18n/*` files; `dictionary-en.ts` types `en: Dictionary`; `'todo.emailMissing': '—'`.
- Success criterion met: key-removal experiment fails tsc (TS2741), per controller attestation (plan F4 closed).
- Locale resolution verified E2E: unknown `NEXT_LOCALE` falls back to vi; picking EN persists and survives reload.

## MoMorph refs:

## Success Criteria
- tsc + lint exit 0; key-removal experiment fails tsc (F002:BR-002).
- Localization E2E specs stay RED only on missing UI (they flip GREEN in phase 07).

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| `refresh()` unavailable in installed 16.4 | L | M | confirm in local docs (present); fallback `revalidatePath('/', 'layout')` |
| Reading cookies in root layout vs `cacheComponents` | H | M | handled in phase 07 (`instant = false`) |

## Security Considerations
Locale cookie is non-sensitive, not httpOnly-required; value whitelisted on write and read (no injection into `lang`). No session interaction (F002:FR-601).

## Rollback
Revert commit; no consumers until 06/07.

## Next Steps
Unblocks 06 and 07.

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first
