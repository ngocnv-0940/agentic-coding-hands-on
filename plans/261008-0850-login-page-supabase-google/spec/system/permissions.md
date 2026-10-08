---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

# Permissions

> Bản nháp thiết kế trước khi code. Mã `PERM###`/`SCR###`/`ROUTE###` đều là `TBD (draft)`; mã thật được cấp khi reconcile. Lý do chọn mô hình quyền nằm ở ADR.

## Authorization System Type

**System Type**: `other` — chỉ phân biệt đã đăng nhập hay chưa, không có RBAC, không có ownership.

**Identified Roles**:
- `anonymous` — chưa có phiên Supabase hợp lệ
- `authenticated` — có phiên hợp lệ (đăng nhập bằng Google; mọi tài khoản Google đều được phép, không giới hạn domain)

## Curated View

- **anonymous** xem được `/login` (kể cả đổi ngôn ngữ VN/EN) và bắt đầu đăng nhập Google; vào `/todo` thì bị chuyển về `/login`.
- **authenticated** xem được `/todo` (email của mình + nút Logout) và đăng xuất; vào `/login` thì bị chuyển sang `/todo`.
- Không có vai trò admin, không có quyền theo từng bản ghi.

## Route Access Matrix

| Route | Mã | anonymous | authenticated |
|-------|----|-----------|---------------|
| `/login` | `TBD (draft)` | Cho phép | Redirect `/todo` |
| `/todo` | `TBD (draft)` | Redirect `/login` | Cho phép |
| `/auth/callback` | `TBD (draft)` | Cho phép (bước đổi code), proxy bỏ qua | Cho phép, proxy bỏ qua |
| `/` | `TBD (draft)` | TBD (draft) | TBD (draft) |

`/` hiện còn là trang mặc định của Create Next App; hành vi truy cập (chuyển hướng hay giữ nguyên) chưa được clarifications chốt.

## Enforcement Points

| Tầng | Cách kiểm | Phạm vi |
|------|-----------|---------|
| `proxy.ts` | `supabase.auth.getUser()` (hỏi máy chủ xác thực) | `/todo*` chưa đăng nhập → `/login`; `/login` đã đăng nhập → `/todo`; bỏ qua `/auth/*` và file tĩnh |
| Trang `/todo` (server) | Kiểm lại bằng `getUser()` phía server, không tin proxy một mình | Chặn truy cập nếu proxy bị bỏ sót |
| Logout Server Action | Kiểm lại bằng `getUser()` trước khi `signOut({ scope: 'local' })` | Server Action là POST vào route trang, có thể lọt matcher của proxy |
| `/auth/callback` | Không cần phiên; chỉ chấp nhận `code` PKCE hợp lệ | Lỗi/huỷ → `/login?error=...` |

Tuỳ chọn kiểm lại bằng `getUser()` (hỏi Auth server, phát hiện phiên bị thu hồi) cho `/todo`: `TBD (draft)`.

`getSession()` phía server KHÔNG dùng để quyết định quyền (dữ liệu cookie chưa xác minh).

## Session Cookie Handling

- Cookie phiên do `@supabase/ssr` quản lý (dạng `sb-<ref>-auth-token`, có thể chia chunk); không tự đọc/ghi thủ công.
- Chỉ Server Action và Route Handler mới ghi/xoá được cookie. Server Component không ghi được, nên `proxy.ts` phải làm mới phiên.
- Redirect tạo trong proxy phải copy cookie đã làm mới sang response redirect, nếu không phiên bị rơi.
- Server client tạo mới mỗi lần gọi, không giữ ở biến global.
- Logout xoá cookie phiên qua `signOut({ scope: 'local' })` (chỉ thiết bị hiện tại) trong Server Action rồi redirect `/login`.
- Cookie `NEXT_LOCALE` chỉ chứa ngôn ngữ, công khai, không liên quan quyền truy cập.
- Tham số `next` (nếu dùng) phải bắt đầu bằng `/` để tránh open redirect.

## Special Conditions

- Môi trường local dùng một host duy nhất (`localhost`) để cookie PKCE verifier khớp.
- Không có điều kiện theo thời gian, IP hay feature flag.
