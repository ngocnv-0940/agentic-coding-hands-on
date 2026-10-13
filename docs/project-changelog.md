# Nhật ký thay đổi

Mỗi mục ghi một thay đổi đáng kể, mới nhất ở trên.

## 2026-10-09 — Màn Login: cập nhật kích thước theo từng khổ màn hình (SCR001, chỉ giao diện)

**Thay đổi**

- `app/login/_components/*`: khung nội dung 1152px căn giữa, padding 12/24/32; ảnh ROOT FURTHER và khoảng cách hero theo breakpoint; không thu nhỏ chữ; nền phủ viewport dưới `lg`; nút vô hiệu mờ 50%. Khổ 1440 giữ đúng Figma.
- Bộ chọn ngôn ngữ (dùng chung với header trang chủ) theo Figma `hUyaaugye2`: panel padding 6px, nền `#00070C`, viền `#998C5F`, mục cao 56px, hover `#FFEA9E1A`, mũi tên xoay khi mở.
- Từ điển en: `login.tagline` "Login to explore!"; `login.footer` và `home.footer.copyright` "Copyright © 2025 Sun* All rights reserved".
- Không đổi props, xác thực hay routing.

## 2026-10-08 — Trang chủ SAA 2025 (F003_Homepage)

**Thêm**

- Trang chủ `/` trong nhóm route `app/(main)/`: header cố định (điều hướng từ 1024px, chuông thông báo trống, VN/EN, menu tài khoản có Sign out), hero ROOT FURTHER với đếm ngược, thông tin sự kiện, lưới 6 giải thưởng, khối Sun* Kudos, nút widget và footer. Layout `(main)` kiểm lại phiên.
- Trang giữ chỗ "Coming soon": `/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin`; dùng lại header và footer.
- Biến `EVENT_START_AT` (chỉ phía máy chủ) trong `.env.example`: ISO-8601 bắt buộc kèm offset hoặc `Z`; sai thì đếm ngược 00 và ngày hiện "—". Ngày hiển thị `dd/MM/yyyy` theo Asia/Ho_Chi_Minh.
- `lib/auth/get-current-user.ts`, `lib/auth/user-role.ts`: vai trò admin chỉ từ `app_metadata.role` (không tin `user_metadata`).
- Từ điển trang chủ tách thành `lib/i18n/dictionary-home-vi.ts` và `dictionary-home-en.ts`, gộp vào từ điển vi/en.
- 6 spec E2E trang chủ; Supabase giả có thêm hai danh tính admin; `playwright.config.ts` đặt `EVENT_START_AT` và 4 worker.

**Thay đổi**

- Đích sau đăng nhập đổi từ `/todo` sang `/` (`app/auth/callback/route.ts`); `/login` khi đã đăng nhập cũng về `/`. `/todo` vẫn được bảo vệ.
- `lib/supabase/proxy.ts`: `/` (khớp đúng) và các trang giữ chỗ (kể cả đường dẫn con) cần đăng nhập; người không phải admin vào `/admin*` bị chuyển về `/`.
- `app/page.tsx` (chỉ `redirect('/login')`) đã xoá; `/` do `app/(main)/page.tsx` phục vụ.
- Spec E2E của F001 và F002 cập nhật theo đích mới `/`.

**Còn mở**

- Trang giữ chỗ chưa có nội dung thật; widget chưa có hành động; bảng thông báo chưa có nguồn dữ liệu.

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
