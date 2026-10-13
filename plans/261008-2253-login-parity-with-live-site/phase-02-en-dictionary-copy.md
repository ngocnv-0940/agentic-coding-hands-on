---
phase: 2
title: "EN dictionary copy"
status: done
owner: generic edit (main agent)
test_policy: visual-contract
---

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Language dropdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2
- Clarifications: plans/261008-2253-login-parity-with-live-site/clarifications.md
- testPolicy: visual-contract

## Overview
Figma has no EN copy → live site wins for two login strings + the homepage EN footer. Parallel-safe with phase 1.

## Owned files
`lib/i18n/dictionary-en.ts`, `lib/i18n/dictionary-home-en.ts`

## Steps
1. `login.tagline`: `'Sign in to explore!'` → `'Login to explore!'`
2. `login.footer`: `'Copyright © 2025 Sun*'` → `'Copyright © 2025 Sun* All rights reserved'`
3. `home.footer.copyright` in `dictionary-home-en.ts`: `'Copyright © 2025 Sun*'` → `'Copyright © 2025 Sun* All rights reserved'` (user, 2026-10-08: "sửa cả footer theo trang thật").
4. Leave title, subtitle, button and all VI strings untouched.

## Success criteria
- `/login` with `NEXT_LOCALE=en` shows both new strings; `npx tsc --noEmit` green.
- No e2e asserts the old EN strings (checked: none in `e2e/`).

## Risk / rollback
Trivial; revert the commit.

## Delivered

**Status: done** (2026-10-09). Verified in 3A: `NEXT_LOCALE=en` shows "Login to explore!" and "Copyright © 2025 Sun* All rights reserved"; `html lang` = en.

Scope drift (recorded): step 3 (`home.footer.copyright` on the homepage) was added at user request 2026-10-08 ("sửa cả footer theo trang thật"). It sits outside the login-only scope of this phase. Cost: homepage EN footer text changes; needs the F002 D003 note in phase 3B.

Open (deferred, from review): the 16px EN footer may wrap to 2 lines at 375. Not measured. Owner: tester, in the 3B pass or a follow-up.
