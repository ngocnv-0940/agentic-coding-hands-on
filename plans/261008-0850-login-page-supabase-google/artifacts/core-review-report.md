---
failed: 1
warnings: 8
missing: 0
result: FAIL
---

# Review Report — Rebuild-Spec Core Artifacts

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-10-08
**Scope**: 11 core artifacts (system-overview, architecture, data-model, behavior-logic, permissions, permissions-matrix, user-stories, feature-list, route-list, screen-list, screen-flow) + 0 feature specs (core-only run; `features/*/.pending` expected, not counted)
**Method**: deterministic validators PASS (route-list, screen-list, screen-flow, behavior-logic, api-map, id contiguity, feature existence) marked `[deterministic-pass]`. Semantic pass: every technology/version, route, screen, permission and `file:line` citation checked against the working tree (app/, lib/, proxy.ts, e2e/, package.json, next.config.ts, supabase/config.toml). Version facts confirmed: next 16.4.0, react 19.3.0, typescript 5.9.3, tailwindcss 4.3.3, eslint 9.39.5, Playwright ports 3100/54399. No false claims found; all e2e line citations (login/auth/language specs) are exact.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 11 core + 0 feature specs |
| Critical issues | 1 |
| Warnings | 8 |
| Missing (`.pending` markers) | 0 |
| Result | **FAIL** |

---

## Critical Issues

### C1: F002_Localization là `ui` nhưng không có SCR### nào — OPEN
- **Severity**: critical
- **Location**: `feature-list.md:96` (Related Screens của F002_Localization; Type tại `feature-list.md:88`)
- **Description**: Checklist FeatureList § "Feature type rules": `ui` yêu cầu SCR###. F002 khai `Type: ui` nhưng `Related Screens` là "No data". Bộ chọn ngôn ngữ nằm thật trong SCR001_Login (`app/login/_components/language-selector.tsx:56-102`) và US007 ánh xạ SCR001_Login, US008 ánh xạ SCR001_Login và SCR002_Todo (`user-stories.md:49-50`). Validator xác định (feature existence) không bắt luật này.
- **Fix**: Thêm `SCR001_Login: Login` (tham chiếu SCR trần, không REG) vào `Related Screens` của F002, hoặc đổi Type cho khớp với quyết định thiết kế. Nếu giữ F001 là chủ vỏ màn hình thì ghi chú F002 chỉ tham chiếu, không sở hữu (CE3 vẫn thỏa vì F001 giữ bare SCR). Cập nhật Cross-reference note ở `feature-list.md:22`.

---

## Warnings

### W1: `{POPULATED_BY_W6}` còn nguyên trong screen-flow — OPEN
- **Severity**: warning
- **Location**: `screen-flow.md:25`
- **Description**: Checklist ghi critical cho token thô này, nhưng đây là lần chạy core-only: `## Feature Entry Points` do W6/`--feature-specs` điền, và `validate_screen_flow.py` đã PASS. Hạ xuống warning, cần fix wave hoặc pass `--feature-specs` quyết định. Nếu W9 promote trước khi điền thì phải nâng thành critical.
- **Fix**: Chạy `--feature-specs` để điền mục này; không tự bịa nội dung. Nếu bỏ qua pass đó, thay bằng chú thích HTML `<!-- POPULATED_BY_W6 -->` và một câu tóm tắt F001/F002 entry points.

### W2: Checkbox cross-ref lỗi thời trong permissions-matrix — OPEN
- **Severity**: warning
- **Location**: `permissions-matrix.md:355`
- **Description**: Ô `[ ]` ghi feature-list "chưa trỏ tới mã PERM###". Sai ở trạng thái hiện tại: F001 tham chiếu đủ PERM001..PERM009 (`feature-list.md:74-82`), F002 không có PERM nào đúng thiết kế.
- **Fix**: Đánh dấu `[x]` và viết lại: "PERM001..PERM009 đều được F001_Auth tham chiếu".

### W3: Checkbox cross-ref lỗi thời trong user-stories — OPEN
- **Severity**: warning
- **Location**: `user-stories.md:427`
- **Description**: Ô `[ ]` ghi "feature-list.md chưa lập ở Wave 4". Feature-list đã có: F001 giữ US001..US006, F002 giữ US007 và US008 (`feature-list.md:53-58,99-100`), đúng dự kiến.
- **Fix**: Đánh dấu `[x]`, bỏ phần "chưa lập".

### W4: Citation lệch dòng `config.toml:68-73` — OPEN
- **Severity**: warning
- **Location**: `data-model.md:22`
- **Description**: Khối `[db.seed]` nằm ở `supabase/config.toml:67-72` (header 67, `sql_paths` dòng 72). Khẳng định đúng, chỉ lệch một dòng.
- **Fix**: Sửa thành `supabase/config.toml:67-72`.

### W5: Citation lệch dòng `config.toml:33` — OPEN
- **Severity**: warning
- **Location**: `data-model.md:23`
- **Description**: Dòng 33 là comment của `port`; header `[db]` ở dòng 32. Khẳng định "giá trị `[db]` là mặc định" đúng, trích sai dòng.
- **Fix**: Sửa thành `supabase/config.toml:32`.

### W6: Citation `layout.tsx:22-27` không phủ dòng `lang` — OPEN
- **Severity**: warning
- **Location**: `user-stories.md:371`
- **Description**: Criterion 3 nói về thuộc tính `lang` của `<html>` và tiêu đề tab. `generateMetadata` ở `app/layout.tsx:22-24`, nhưng `lang={locale}` ở dòng 30.
- **Fix**: Sửa thành `app/layout.tsx:22-30`.

### W7: Citation `get-dictionary.ts:6-8` lệch dòng — OPEN
- **Severity**: warning
- **Location**: `permissions-matrix.md:370`
- **Description**: `lib/i18n/get-dictionary.ts` có bảng `dictionaries` ở dòng 5 và hàm `getDictionary` ở dòng 7-9. Dòng 6 là dòng trống.
- **Fix**: Sửa thành `lib/i18n/get-dictionary.ts:5-9`.

### W8: Citation `proxy.ts:47` mơ hồ — OPEN
- **Severity**: warning
- **Location**: `user-stories.md:242`
- **Description**: `proxy.ts` ở gốc repo chỉ có 13 dòng, `getUser()` nằm ở `lib/supabase/proxy.ts:47`. Người đọc dễ hiểu nhầm file.
- **Fix**: Sửa thành `lib/supabase/proxy.ts:47`.

---

## Passed Checks

✓ Universal.artifact_exists_non_empty @ system-overview
✓ Universal.artifact_exists_non_empty @ architecture
✓ Universal.artifact_exists_non_empty @ data-model
✓ Universal.artifact_exists_non_empty @ behavior-logic
✓ Universal.artifact_exists_non_empty @ permissions
✓ Universal.artifact_exists_non_empty @ permissions-matrix
✓ Universal.artifact_exists_non_empty @ user-stories
✓ Universal.artifact_exists_non_empty @ feature-list
✓ Universal.artifact_exists_non_empty @ route-list
✓ Universal.artifact_exists_non_empty @ screen-list
✓ Universal.artifact_exists_non_empty @ screen-flow
✓ Universal.no_placeholder_text @ system-overview
✓ Universal.no_placeholder_text @ architecture
✓ Universal.no_placeholder_text @ data-model
✓ Universal.no_placeholder_text @ behavior-logic
✓ Universal.no_placeholder_text @ permissions
✓ Universal.no_placeholder_text @ permissions-matrix
✓ Universal.no_placeholder_text @ user-stories
✓ Universal.no_placeholder_text @ feature-list
✓ Universal.no_placeholder_text @ route-list
✓ Universal.no_placeholder_text @ screen-list
✓ Universal.required_sections_in_order @ system-overview
✓ Universal.required_sections_in_order @ architecture
✓ Universal.required_sections_in_order @ data-model
✓ Universal.required_sections_in_order @ behavior-logic
✓ Universal.required_sections_in_order @ permissions
✓ Universal.required_sections_in_order @ permissions-matrix
✓ Universal.required_sections_in_order @ user-stories
✓ Universal.required_sections_in_order @ feature-list
✓ Universal.required_sections_in_order @ route-list
✓ Universal.required_sections_in_order @ screen-list
✓ Universal.required_sections_in_order @ screen-flow
✓ Universal.issue_location_present @ system-overview
✓ Universal.issue_location_present @ architecture
✓ Universal.issue_location_present @ data-model
✓ Universal.issue_location_present @ behavior-logic
✓ Universal.issue_location_present @ permissions
✓ Universal.issue_location_present @ permissions-matrix
✓ Universal.issue_location_present @ user-stories
✓ Universal.issue_location_present @ feature-list
✓ Universal.issue_location_present @ route-list
✓ Universal.issue_location_present @ screen-list
✓ Universal.issue_location_present @ screen-flow
✓ Universal.reg_cross_ref_rules @ screen-list (n/a: 0 REG###, vacuous)
✓ Universal.content_completeness_traceable @ system-overview
✓ Universal.content_completeness_traceable @ architecture
✓ Universal.content_completeness_traceable @ route-list
✓ Universal.content_completeness_traceable @ screen-list
✓ Universal.content_completeness_traceable @ permissions-matrix
✓ Universal.content_completeness_traceable @ data-model (No data verified against working tree)
✓ Universal.content_completeness_traceable @ behavior-logic (No data verified against working tree)
✓ SystemOverview.mermaid_present @ system-overview
✓ SystemOverview.tech_stack_matches_package_json @ system-overview
✓ SystemOverview.key_design_decisions_ctx_dec_rat @ system-overview
✓ SystemOverview.citations_accurate @ system-overview
✓ Architecture.mermaid_present @ architecture
✓ Architecture.tech_stack_matches_package_json @ architecture
✓ Architecture.deployment_view_na_line @ architecture
✓ RouteList.validate_route_list @ route-list [deterministic-pass]
✓ RouteList.routes_match_code @ route-list
✓ RouteList.owner_f_refs_in_featurelist @ route-list
✓ ScreenList.validate_screen_list @ screen-list [deterministic-pass]
✓ ScreenList.routes_in_routelist @ screen-list
✓ ScreenList.each_screen_has_us @ screen-list
✓ ScreenList.citations_accurate @ screen-list
✓ ScreenList.h6_over_merged_check @ screen-list
✓ ScreenList.signal_inferred_cap @ screen-list (0 occurrences)
✓ ScreenFlow.validate_screen_flow @ screen-flow [deterministic-pass]
✓ ScreenFlow.all_scr_present @ screen-flow
✓ ScreenFlow.transitions_match_code @ screen-flow
✓ ScreenFlow.auth_flow_documented @ screen-flow
✓ ScreenFlow.citations_accurate @ screen-flow
✓ BehaviorLogic.validate_behavior_logic @ behavior-logic [deterministic-pass]
✓ BehaviorLogic.cardinality_total_gap @ behavior-logic
✓ BehaviorLogic.category_drop @ behavior-logic
✓ BehaviorLogic.source_file_check @ behavior-logic
✓ BehaviorLogic.orphan_file @ behavior-logic
✓ BehaviorLogic.no_data_claim_true @ behavior-logic
✓ DataModel.no_data_claim_true @ data-model
✓ DataModel.no_model_or_disc_codes @ data-model
✓ Permissions.auth_system_type_valid @ permissions
✓ Permissions.no_perm_codes_or_matrix_tables @ permissions
✓ Permissions.consistent_with_matrix @ permissions
✓ PermissionsMatrix.perm_codes_unique_format @ permissions-matrix
✓ PermissionsMatrix.types_valid @ permissions-matrix
✓ PermissionsMatrix.related_routes_screens_exist @ permissions-matrix
✓ PermissionsMatrix.rules_match_code @ permissions-matrix
✓ UserStories.ui_us_ge_screens @ user-stories
✓ UserStories.single_intent_titles @ user-stories
✓ UserStories.ui_us_have_scr @ user-stories
✓ UserStories.interaction_inventory_present @ user-stories
✓ UserStories.e2e_citations_accurate @ user-stories
✓ FeatureList.codes_unique_format @ feature-list
✓ FeatureList.us_scr_route_perm_refs_exist @ feature-list
✓ FeatureList.orphan_perm_us_scr_route @ feature-list
✓ FeatureList.partial_screen_ownership_ce3 @ feature-list
✓ FeatureList.valid_feature_criteria @ feature-list

### BehaviorLogic Cardinality
- Inventory total: 0 (Next.js JS/TS: 10 loại đều `_(none found)_`; stack duy nhất)
- Artifact BL count: 0
- Gap: 0% (PASS)
- Missing categories: none
- Orphan files: none

Rule 5 (inferred ratio) và Rule 6 (exclusion-pattern leak) không kích hoạt: inventory rỗng, 0 BL, không có Source File.

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
