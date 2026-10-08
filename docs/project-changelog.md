# Nhật ký thay đổi

Mỗi mục ghi một thay đổi đáng kể, mới nhất ở trên.

## 2026-10-08 — Đăng nhập Google qua Supabase và chọn ngôn ngữ vi/en

**Thêm**

- F001_Auth: đăng nhập Google (OAuth PKCE cùng tab) qua Supabase Auth; `GET /auth/callback` đổi mã lấy phiên; `proxy.ts` làm mới phiên và chặn `/todo` với khách, đưa người đã đăng nhập khỏi `/login`; trang `/todo` hiện email; đăng xuất bằng `POST /auth/logout` (Route Handler, 303 về `/login`, `GET` trả 405) qua form gốc trên `/todo`.
- F002_Localization: bộ chọn VN/EN, cookie `NEXT_LOCALE`, từ điển vi/en tự viết trong `lib/i18n`.
- E2E Playwright chạy trên Supabase giả (`e2e/`, `playwright.config.ts`).
- `README.md` viết lại thành hướng dẫn cài đặt cục bộ (bun, Supabase CLI, Docker hoặc Podman, Google OAuth).

**Sửa**

- `supabase/config.toml`: file đã commit trước đó là template Go của CLI chưa được render nên `supabase start` không dùng được. Đã thay bằng đầu ra của `supabase init` 2.120.0 cộng các chỉnh sửa của dự án (`site_url = http://localhost:3000`, `additional_redirect_urls`, bật `auth.external.google` với `client_id`/`secret` lấy từ `env(...)`).

**Thay đổi thiết kế đã chốt khi cài đặt**

- Đăng xuất là `POST /auth/logout`, không phải Server Action `logoutAction` (đã xoá `app/todo/logout-action.ts`): form gốc gây điều hướng cả trang nên không còn DOM `/todo` sau khi đăng xuất hoặc bấm Back.
- `/todo` gọi `await connection()` trước `getUser()` vì Cache Components không cho `Date.now()` lúc prerender.

**Rủi ro và việc còn mở** (chi tiết: `docs/features/F001_Auth/functional-spec.md` § 11)

- Build cần `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; CI phải đặt.
- Production qua HTTPS cần `secure: true` cho cookie phiên.
- Ba mục Low hoãn: `Location` tuyệt đối trong proxy, `setAll` ghi đè header cache, `POST /auth/logout` chưa kiểm tra `Origin`.
