---
passed: true
issues: 0
warnings: 0
---

# Feature List Review (greenfield subset)

Target: `spec/feature-list.md` (2 features: F001_Auth, F002_Localization)

## Scope Contract
- Changed: n/a (spec-stage review, read-only)
- Impacted: downstream plan and spec stages that consume the F### codes
- Will verify: Checks 4, 6, 7, 8, 9 on the feature-list text alone
- Deliberately skipped: Checks 1-3 (no user-stories/screen-list yet); Check 5 is a pointer slot, not a gate

## Results

| Check | Result | Note |
|-------|--------|------|
| 4 F-code uniqueness | PASS | F001, F002 unique; the Cross-Reference line is accurate |
| 6 Clear Flow | PASS | F001: click Login With Google -> Supabase -> `/auth/callback` code exchange -> `/todo`; error path -> `/login?error=...`; logout -> `/login`. F002: pick VN/EN -> write `NEXT_LOCALE` -> server re-render |
| 7 Vague naming | PASS | "Auth" and "Localization" are generic, but the project has <= 5 features, so the rule exempts them |
| 8 Scope overlap | PASS | The two descriptions share almost no keywords (login/OAuth/session vs locale/cookie/dictionary), well below 50% |
| 9 Grouping coherence | PASS | F001: login, session, route guard, logout and minimal `/todo` are one auth outcome. F002: the language selector and dictionary are one localization outcome |
| 1-3 | SKIPPED | No upstream artifacts (by instruction) |
| 5 | NOT A GATE | See code-formats.md |

## Observations (non-blocking, not counted as warnings)
- The `TBD (draft)` placeholders in US/SCR/API fields are expected at this stage. Fill them when downstream artifacts exist.
- F002 correctly owns only the header region of the Login screen. The `REG###` code must be defined in ScreenList, and the `SCR###` shell must stay with F001 (the partial-screen ownership note).
- The F001 description says "exchange the code" in Vietnamese prose but uses a mixed English/Vietnamese style. This is cosmetic.
- The F001 `/todo` page is minimal and tied to auth (shows email + Logout), so there is no need to split it into a separate Todo feature now. If `/todo` later grows its own CRUD behavior, split it into its own F###.

No features need merging or splitting.
