---
failed: 0
warnings: 1
missing: 0
result: PASS
---

# Review Report — Rebuild-Spec Core Artifacts (re-verify after fix cycle 1)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-10-08
**Scope**: 5 core artifacts that had OPEN issues (feature-list, permissions-matrix, user-stories, data-model, screen-flow); other core artifacts had no OPEN issues and were not re-reviewed (0 feature specs; `features/*/.pending` expected in core-only run, not counted)

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 5 core (re-verify) + 0 feature specs |
| Critical issues | 0 |
| Warnings | 1 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

---

## Critical Issues

### C1: F002_Localization là `ui` nhưng không có SCR### nào — FIXED
- **Severity**: critical
- **Location**: `feature-list.md:95-96` (Related Screens của F002), `feature-list.md:22` (Cross-reference)
- **Description**: F002 nay liệt kê `SCR001_Login: Login` (SCR trần) làm tham chiếu, kèm ghi chú F002 không sở hữu vỏ màn hình; `ui` có SCR### nên thỏa luật. CE3 vẫn thỏa: F001_Auth giữ SCR001_Login và SCR002_Todo bằng SCR trần, không có REG### nào nên không có chuyện hai feature cùng sở hữu một vỏ theo nghĩa phân vùng. Cross-reference note (dòng 22) đã cập nhật khớp. Không còn lý do coi là critical.
- **Fix**: Không cần thêm.

---

## Warnings

### W1: `{POPULATED_BY_W6}` còn nguyên trong screen-flow — OPEN (resolved by W9 pre-promote stub)
- **Severity**: warning
- **Location**: `screen-flow.md:25`
- **Description**: Token vẫn còn, chủ ý giữ lại: orchestrator thay đúng token này bằng chú thích HTML `<!-- Feature Entry Points: run /tkm:rebuild-spec --feature-specs to populate -->` trong bản nháp ngay trước khi promote (pipeline-w7-w9.md), nên không token thô nào lên `docs/`. Không tính critical.
- **Fix**: Không cần sửa tay; W9 pre-promote stub xử lý.

### W2: Checkbox cross-ref lỗi thời trong permissions-matrix — FIXED
- **Severity**: warning
- **Location**: `permissions-matrix.md:355`
- **Description**: Đã `[x]`, nêu PERM001..PERM009 do F001_Auth tham chiếu, F002 không có PERM theo thiết kế.
- **Fix**: Không cần.

### W3: Checkbox cross-ref lỗi thời trong user-stories — FIXED
- **Severity**: warning
- **Location**: `user-stories.md:427`
- **Description**: Đã `[x]`, F001 giữ US001..US006, F002 giữ US007, US008; khớp `feature-list.md`.
- **Fix**: Không cần.

### W4: Citation lệch dòng `config.toml` ở data-model — FIXED
- **Severity**: warning
- **Location**: `data-model.md:22`
- **Description**: Nay `supabase/config.toml:67-72`; xác nhận `[db.seed]` dòng 67, `sql_paths` dòng 72.
- **Fix**: Không cần.

### W5: Citation lệch dòng `config.toml:33` — FIXED
- **Severity**: warning
- **Location**: `data-model.md:23`
- **Description**: Nay `supabase/config.toml:32`; xác nhận header `[db]` dòng 32.
- **Fix**: Không cần.

### W6: Citation `layout.tsx` không phủ dòng `lang` — FIXED
- **Severity**: warning
- **Location**: `user-stories.md:371`
- **Description**: Nay `app/layout.tsx:22-30`; xác nhận `generateMetadata` dòng 22-24 và `lang={locale}` dòng 30.
- **Fix**: Không cần.

### W7: Citation `get-dictionary.ts` lệch dòng — FIXED
- **Severity**: warning
- **Location**: `permissions-matrix.md:370`
- **Description**: Nay `lib/i18n/get-dictionary.ts:5-9`; xác nhận bảng `dictionaries` dòng 5, hàm dòng 7-9.
- **Fix**: Không cần.

### W8: Citation `proxy.ts:47` mơ hồ — FIXED
- **Severity**: warning
- **Location**: `user-stories.md:242`
- **Description**: Nay `lib/supabase/proxy.ts:47`; xác nhận `getUser()` ở dòng 47.
- **Fix**: Không cần.

---

## Regression Spot-Check

Các chỉnh sửa không đưa vào placeholder mới (grep `TODO|TBD|POPULATED` chỉ trúng `TODO` là tên route trong mermaid và token W1 có chủ ý), bảng markdown còn nguyên cột, các tham chiếu chéo (SCR001_Login, SCR002_Todo, US007, US008, PERM001..PERM009) đều tồn tại.

---

## Passed Checks

✓ Universal.artifact_exists_non_empty @ feature-list
✓ Universal.artifact_exists_non_empty @ permissions-matrix
✓ Universal.artifact_exists_non_empty @ user-stories
✓ Universal.artifact_exists_non_empty @ data-model
✓ Universal.artifact_exists_non_empty @ screen-flow
✓ Universal.no_placeholder_text @ feature-list
✓ Universal.no_placeholder_text @ permissions-matrix
✓ Universal.no_placeholder_text @ user-stories
✓ Universal.no_placeholder_text @ data-model
✓ Universal.required_sections_in_order @ feature-list
✓ Universal.required_sections_in_order @ permissions-matrix
✓ Universal.required_sections_in_order @ user-stories
✓ Universal.required_sections_in_order @ data-model
✓ Universal.required_sections_in_order @ screen-flow
✓ Universal.issue_location_present @ feature-list
✓ Universal.issue_location_present @ permissions-matrix
✓ Universal.issue_location_present @ user-stories
✓ Universal.issue_location_present @ data-model
✓ Universal.issue_location_present @ screen-flow
✓ FeatureList.us_scr_route_perm_refs_exist @ feature-list
✓ FeatureList.partial_screen_ownership_ce3 @ feature-list
✓ FeatureList.ui_type_has_scr @ feature-list
✓ PermissionsMatrix.crossref_checkboxes_current @ permissions-matrix
✓ UserStories.crossref_checkboxes_current @ user-stories
✓ UserStories.citations_accurate @ user-stories
✓ DataModel.citations_accurate @ data-model

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | 0 (core-only; `.pending` expected) |
| User Stories | 8 |
| Screens | 2 |
| Background Logic Items | 0 |
| Permissions | 9 |
| Backend Route Rows | 2 |
| Frontend Pages | 3 |
| Data Model Entities | 0 |
