---
failed: 0
warnings: 3
missing: 0
result: PASS
---

# Review Report — Process Flow FLOW001_SiteLaunchGate (Wave FL.3)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-10-15
**Scope**: 1 process-flow draft (`artifacts/flows/site-launch-gate.md`, `depth: thin`), ProcessFlow rules PF-S1..PF-S7 only

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 1 process-flow (thin) |
| Critical issues | 0 |
| Warnings | 3 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

Method: all 10 Guard & Cascade rows, the Derived Condition table, the Features table and all 3 Open Questions were checked by reading every cited `file:line`. The validator skips thin files, so none of these citations were machine-checked. No cited line was wrong or unrelated.

---

## Critical Issues

_(none)_

---

## Warnings

### W1: "F002_Localization không bị chặn" is only half true — OPEN
- **Severity**: warning
- **Location**: `site-launch-gate.md:49`
- **Description**: The draft says the language selector sits only on `/login`, which is exempt from the lock. The selector component is also mounted in the shared header of the gated `(main)` pages: `app/(main)/_wiring/site-header-container.tsx:3` imports `LanguageSelectorContainer` and `:46` passes it as `languageSelector`. On `/`, `/awards-information` and `/sun-kudos` before the launch, that surface is unreachable. `docs/generated/feature-list.md:101` also says only that F002 references SCR001. The "not blocked" claim is correct for the `/login` surface and misleading for F002 as a whole.
- **Fix**: Reword to "F002 chỉ mở được ở `/login`; bộ chọn ngôn ngữ trong header của các trang `(main)` bị khóa cùng các trang đó". Optionally add F002 to the Features table as "blocked (phần header)".

### W2: Rule 3 says the auth callback "luôn trả 307 về `/`" — OPEN
- **Severity**: warning
- **Location**: `site-launch-gate.md:59`
- **Description**: Only the success branch lands on `/` (`app/auth/callback/route.ts:4`, `:40`). Failure, a provider error and a missing or oversized `code` redirect to `/login?error=auth_failed` (`route.ts:6`, `:36-37`, `:40`). The cited lines support "success always lands on `/`", not "always". Both targets are 307. `/login` stays open while locked, so the conclusion (a successful pre-launch login ends at `/prelaunch`) still holds.
- **Fix**: "Đăng nhập thành công luôn trả 307 về `/`; thất bại về `/login?error=auth_failed` (vẫn mở trước mốc)". Cite `route.ts:6` too.

### W3: Two Trigger Sequence arrows are less precise than their row tags (PF-S7) — OPEN
- **Severity**: warning
- **Location**: `site-launch-gate.md:79` and `site-launch-gate.md:89`
- **Description**: (a) `Proxy->>Proxy: getUser làm mới phiên (hàng 1)` is tagged to row 1, but row 1's Source covers `lib/supabase/proxy.ts:73-82` and `:85-86`. The `getUser()` call is at `lib/supabase/proxy.ts:66-70`, before the decision at `:85`. The behavior is real, but no row cites that line. (b) `Proxy->>Gate: quyết định lại (hàng 6)` assumes the unlocked outcome. Row 9 says the server may still return `lock` (row 1) and the cycle repeats, so the re-decision arrow should reference rows 1 and 6.
- **Fix**: Add `lib/supabase/proxy.ts:66-70` to row 1's Source (or to the arrow). Change the arrow tag to "hàng 1 hoặc 6".

---

## Passed Checks

✓ PF-S1 @ site-launch-gate
✓ PF-S2 @ site-launch-gate
✓ PF-S3 @ site-launch-gate
✓ PF-S4 @ site-launch-gate (n/a, no system-flow)
✓ PF-S5 @ site-launch-gate (n/a, no stored states)
✓ PF-S6 @ site-launch-gate (n/a, no SM overlap)
✓ PF-S7 @ site-launch-gate
✓ Trap5.fabricated_states @ site-launch-gate
✓ ProcessFlow.plain_language @ site-launch-gate
✓ ProcessFlow.flow_code_regex @ site-launch-gate [deterministic-pass]
✓ ProcessFlow.completed_marker @ site-launch-gate [deterministic-pass]
✓ ProcessFlow.sequence_diagram_present @ site-launch-gate [deterministic-pass]

---

## Metrics

| Metric | Value |
|--------|-------|
| Guard & Cascade rows verified against code | 10/10 |
| Features-table claims | 4/5 gated claims true (F001, F003, F004, F006, F007 all true); F002 non-gated claim partial (W1) |
| Open Questions supported | 3/3 |
| Plain-language regex hits outside fences | 0 |
