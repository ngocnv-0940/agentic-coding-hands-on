---
status: draft
authored_by: takumi
created: 2026-10-08
---

# Feature List

**Project**: SAA 2025 Login (Next.js + Supabase Google OAuth)
**Generated**: 2026-10-08
**Analysis Scope**: Màn hình `/login`, trang bảo vệ `/todo`, route `/auth/callback`, chuyển ngôn ngữ VN/EN (nguồn: MoMorph GzbNeVGJHz, `clarifications.md`)

**Code Format**: All codes MUST follow `F###_NameSlug` format (e.g., F001_Auth, F002_UserProfile)
**Screen Code Format**: All screen codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm)
**User Story Code Format**: All US codes MUST follow `US###_NameSlug` format (e.g., US001_Login)
**Background Logic Code Format**: All BL codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport)
**Permission Code Format**: All PERM codes MUST follow `PERM###_NameSlug` format (e.g., PERM001_ViewReports)

**Feature Types**:
- `ui` - Feature has UI screens (SCR###)
- `background` - Feature only has background logic (BL###, no SCR###)
- `mixed` - Feature has both UI screens and background logic

**Related Screens column format**: Accepts `SCR###`, `SCR###/REG###`, or mixed comma-separated (e.g., `SCR001, SCR002/REG003`). Tokenizer splits on `,` then on `/`. No intra-screen shorthand (`SCR###/REG001+REG002` invalid) — enumerate each ref explicitly.

**Partial-screen ownership note**: A feature with only a `SCR###/REG###` ref owns the region, NOT the parent SCR. The screen shell (`SCR###`) must be owned by a separate F### with a bare `SCR###` ref (typically a layout/dashboard feature).

**Cross-reference**: See ScreenList Regions subsection for region definitions and the `REG###_NameSlug` registry.

## Feature Hierarchy

**Note**: Features are sorted by priority from highest to lowest (P0 → P1 → P2 → P3). Priority levels:
- **P0**: Core functionality, blocking issues, or essential features
- **P1**: High priority, significant features
- **P2**: Medium priority, standard features
- **P3**: Low priority, nice-to-have features

| Code | Name | Type | Language | Workspace | Priority |
|------|------|------|----------|-----------|----------|
| F001_Auth | Auth | ui | TypeScript | Next.js app (root) | P0 |
| F002_Localization | Localization | ui | TypeScript | Next.js app (root) | P1 |

## Feature Details

### F001_Auth: Auth

**Type**: ui
**Description**: Khách đăng nhập bằng Google qua Supabase OAuth (chuyển hướng cùng tab, PKCE code exchange tại `/auth/callback`), có phiên đăng nhập, route được bảo vệ (`/todo` chưa đăng nhập thì về `/login`; `/login` đã đăng nhập thì về `/todo`) và đăng xuất. Luồng: bấm LOGIN With Google → chuyển sang Supabase → callback đổi code lấy phiên → vào `/todo` (lỗi/huỷ → `/login?error=...` hiện thông báo lỗi dưới nút). `/todo` tối thiểu: hiện email người dùng + nút Logout (về `/login`). Mọi tài khoản Google đều được phép.

**Workspace**: Next.js app (root)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft): màn Login `/login` (MoMorph GzbNeVGJHz)
- TBD (draft): trang `/todo` (tối thiểu, bảo vệ)

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft): `/auth/callback` (đổi PKCE code lấy phiên), logout, middleware/proxy bảo vệ route

**Related Data Models**:
- TBD (draft): phiên/user do Supabase Auth quản lý (không có bảng riêng dự kiến)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft): guest vs người dùng đã đăng nhập (truy cập `/todo`, `/login`)

---

### F002_Localization: Localization

**Type**: ui
**Description**: Mọi khách truy cập đổi ngôn ngữ giao diện VN/EN bằng bộ chọn ngôn ngữ trên header; lựa chọn lưu trong cookie `NEXT_LOCALE`, render phía server theo locale (mặc định `vi`), từ điển vi/en tự viết cho chuỗi của màn login, không dùng thư viện i18n. Luồng: chọn VN/EN → ghi cookie → render lại toàn bộ chuỗi theo ngôn ngữ đã chọn (giữ qua các lần tải lại).

**Workspace**: Next.js app (root)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft): vùng bộ chọn ngôn ngữ trên header của màn Login (chỉ sở hữu vùng; vỏ màn thuộc F001_Auth)

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft): cơ chế ghi cookie `NEXT_LOCALE` (server action hoặc route)

**Related Data Models**:
- TBD (draft): không có (chỉ cookie)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft): công khai, không cần đăng nhập

---

## Summary

- **Total Features**: 2
- **Total Screens**: TBD (draft)
- **Total User Stories**: TBD (draft)
- **Total Routes**: TBD (draft)
- **Total Data Models**: TBD (draft)
- **Total Background Logic**: TBD (draft)
- **Total Permissions**: TBD (draft)
- **Languages Detected**: TypeScript

## Cross-Reference Validation

- [x] All F### codes are unique
