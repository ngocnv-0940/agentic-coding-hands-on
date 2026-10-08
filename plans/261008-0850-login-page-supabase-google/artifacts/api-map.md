# API Map

## Endpoints by Domain

Ứng dụng Next.js App Router, chỉ có 2 route handler, cả hai thuộc miền Auth. Chúng nằm dưới `/auth/`, nên `proxy.ts` (`updateSession`, `lib/supabase/proxy.ts:21`) cho đi thẳng, không đọc hay làm mới cookie phiên. Các trang `/`, `/login`, `/todo` là trang giao diện, xem route-list.md.

### Auth

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/auth/callback` | `GET` in `app/auth/callback/route.ts` | Điểm nhận kết quả đăng nhập Google OAuth (PKCE). Lấy `code` trên query, gọi `exchangeCodeForSession` để đổi lấy phiên rồi trả 307 về `/todo`. Thiếu `code`, có `?error`, `code` dài hơn 2048 ký tự hoặc đổi mã lỗi thì trả 307 về `/login?error=auth_failed` (không chuyển tiếp nội dung lỗi của nhà cung cấp, không đọc `next`). Yêu cầu xác thực: không cần phiên để vào handler (proxy bỏ qua `/auth/`); `code` OAuth cùng cookie code verifier do trình duyệt đã giữ từ bước khởi tạo chính là bằng chứng. |
| POST | `/auth/logout` | `POST` in `app/auth/logout/route.ts` | Đăng xuất phiên hiện tại (`signOut({ scope: "local" })`), form POST gốc từ nút đăng xuất ở `/todo`. Nếu `signOut` lỗi thì xóa các cookie `sb-*-auth-token`. Luôn trả 303 về `/login`. Yêu cầu xác thực: không cần phiên để vào handler (proxy bỏ qua `/auth/`), handler tự gọi `getUser()` nhưng kết quả không chặn việc đăng xuất, nên phiên hết hạn hay không hợp lệ vẫn được dọn sạch. |

Ghi chú miền Auth:

- `/auth/logout` chỉ export `POST`. `GET` trên đường dẫn này trả 405 mặc định của Next.js, nên không có hàng riêng. Đăng xuất là Route Handler `POST /auth/logout`, không phải Server Action.
- `setLocale` (`lib/i18n/set-locale-action.ts:16`, `'use server'`) là Server Action đổi ngôn ngữ, gọi từ `app/login/language-selector-container.tsx`. Nó ghi cookie `NEXT_LOCALE` rồi `refresh()`; giá trị sai hoặc chọn lại ngôn ngữ hiện tại thì bỏ qua im lặng. Không có URL công khai nên không phải endpoint và không nằm trong bảng.

## Background Jobs

No data — không có tác vụ nền nào (BL inventory rỗng, 0 mục BL: không có cron, hàng đợi, worker hay lệnh CLI; xem behavior-logic.md).

## Webhooks / External Calls

Dịch vụ ngoài duy nhất là Supabase Auth, gọi qua SDK `@supabase/ssr` / `@supabase/supabase-js` (không có `fetch(` hay `axios` trong mã ứng dụng). Google chỉ xuất hiện như nhà cung cấp OAuth mà Supabase chuyển hướng tới.

| Direction | Target / Source | Event / Endpoint | Description |
|-----------|----------------|------------------|-------------|
| outgoing | Supabase Auth (qua Google OAuth) | `signInWithOAuth({ provider: "google" })` tại `lib/auth/sign-in-with-google.ts:15-18` | Chạy ở trình duyệt khi người dùng bấm nút đăng nhập: SDK lưu cookie code verifier rồi chuyển hướng cùng tab tới Google qua Supabase, với `redirectTo` là `${window.location.origin}/auth/callback`. |
| outgoing | Supabase Auth | `exchangeCodeForSession(code)` tại `app/auth/callback/route.ts:24` | Phía máy chủ, trong `GET /auth/callback`: đổi `code` OAuth lấy phiên, SDK ghi cookie phiên vào response. Lỗi hay ngoại lệ đều coi là đăng nhập thất bại. |
| outgoing | Supabase Auth | `getUser()` tại `app/auth/logout/route.ts:18` | Trong `POST /auth/logout`: kiểm tra phiên với máy chủ Auth, kết quả không quyết định việc đăng xuất. |
| outgoing | Supabase Auth | `signOut({ scope: "local" })` tại `app/auth/logout/route.ts:19` | Trong `POST /auth/logout`: hủy phiên của thiết bị hiện tại, không đụng các phiên khác. |
| outgoing | Supabase Auth | `getUser()` tại `lib/supabase/proxy.ts:47` | Guard phiên của `proxy.ts` gọi cho các trang không thuộc `/auth/`; không ảnh hưởng hai endpoint ở trên. Máy chủ Auth không phản hồi thì coi như chưa đăng nhập. |
| incoming | — | — | No data — không có webhook vào. Lượt quay lại từ OAuth chính là endpoint `GET /auth/callback` ở mục Auth, không phải webhook. |
