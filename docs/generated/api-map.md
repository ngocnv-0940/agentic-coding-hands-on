# API Map

## Endpoints by Domain

Ứng dụng Next.js App Router, chỉ có 2 route handler, cả hai thuộc miền Auth. Miền Kudos (F006) không có route handler: 2 Server Action và 6 hàm RPC của Postgres, xem mục Kudos bên dưới. Chúng nằm dưới `/auth/`, nên `proxy.ts` (`updateSession`, `lib/supabase/proxy.ts:21`) cho đi thẳng, không đọc hay làm mới cookie phiên. Các trang `/`, `/login`, `/todo` là trang giao diện, xem route-list.md.

### Auth

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/auth/callback` | `GET` in `app/auth/callback/route.ts` | Điểm nhận kết quả đăng nhập Google OAuth (PKCE). Lấy `code` trên query, gọi `exchangeCodeForSession` để đổi lấy phiên rồi trả 307 về `/todo`. Thiếu `code`, có `?error`, `code` dài hơn 2048 ký tự hoặc đổi mã lỗi thì trả 307 về `/login?error=auth_failed` (không chuyển tiếp nội dung lỗi của nhà cung cấp, không đọc `next`). Yêu cầu xác thực: không cần phiên để vào handler (proxy bỏ qua `/auth/`); `code` OAuth cùng cookie code verifier do trình duyệt đã giữ từ bước khởi tạo chính là bằng chứng. |
| POST | `/auth/logout` | `POST` in `app/auth/logout/route.ts` | Đăng xuất phiên hiện tại (`signOut({ scope: "local" })`), form POST gốc từ nút đăng xuất ở `/todo`. Nếu `signOut` lỗi thì xóa các cookie `sb-*-auth-token`. Luôn trả 303 về `/login`. Yêu cầu xác thực: không cần phiên để vào handler (proxy bỏ qua `/auth/`), handler tự gọi `getUser()` nhưng kết quả không chặn việc đăng xuất, nên phiên hết hạn hay không hợp lệ vẫn được dọn sạch. |

Ghi chú miền Auth:

- `/auth/logout` chỉ export `POST`. `GET` trên đường dẫn này trả 405 mặc định của Next.js, nên không có hàng riêng. Đăng xuất là Route Handler `POST /auth/logout`, không phải Server Action.
- `setLocale` (`lib/i18n/set-locale-action.ts:16`, `'use server'`) là Server Action đổi ngôn ngữ, gọi từ `app/login/language-selector-container.tsx`. Nó ghi cookie `NEXT_LOCALE` rồi `refresh()`; giá trị sai hoặc chọn lại ngôn ngữ hiện tại thì bỏ qua im lặng. Không có URL công khai nên không phải endpoint và không nằm trong bảng.

### Kudos (F006)

Server Action là endpoint POST công khai do Next.js sinh, không có đường dẫn cố định nên không phải route (xem route-list.md). Cả hai đều tự kiểm lại phiên bằng `getCurrentUser()` và kiểm đầu vào trước khi gọi Postgres bằng phiên của người dùng (RLS áp dụng).

| Kind | Name | Handler | Description |
|------|------|---------|-------------|
| Server Action | `loadMoreKudos({ cursor, hashtag, department })` | `lib/kudos/load-more-kudos-action.ts` | Trang kế tiếp của All Kudos. Chưa đăng nhập hoặc con trỏ sai dạng thì ném lỗi chung; giá trị lọc lạ bị bỏ (coi như không lọc). Trả `FeedPage`. Gọi `kudos_feed_page`. |
| Server Action | `toggleKudoLikeAction(kudoId)` | `lib/kudos/toggle-kudo-like-action.ts` | Bật/tắt tim. Trả `{ ok: true, liked, likeCount }` hoặc `{ ok: false, code }` với `code` là `self_like`, `sunner_not_found`, `kudo_not_found` hoặc `unknown`; không chuyển tiếp lỗi thô của Postgres. Gọi `toggle_kudo_like`. |
| RPC | `kudos_filter_options()` | `…441_kudos_live_board_functions.sql` | `SECURITY INVOKER`. Trả `{ hashtags: {slug,label}[], departments: {code,name}[] }`. |
| RPC | `kudos_highlight(p_hashtag, p_department)` | cùng file | `SECURITY INVOKER`. Top 5 Kudo theo số lượt tim, hoà thì mới nhất (ALG-001), sau khi lọc. |
| RPC | `kudos_feed_page(p_hashtag, p_department, p_before_created_at, p_before_id, p_limit)` | cùng file | `SECURITY INVOKER`. Một trang All Kudos theo con trỏ keyset `(created_at, id)` (ALG-004), dùng `kudos_created_at_id_idx`. |
| RPC | `kudos_spotlight()` | cùng file | `SECURITY INVOKER`. Tối đa 100 người nhận khác nhau (Kudo mới nhất của mỗi người), tổng số Kudo và 5 Kudo mới nhất cho dòng hoạt động. |
| RPC | `kudos_sidebar()` | `…944_write_kudo_sender_masking.sql`, `…16030000_latest_gifts_distinct_sunners.sql` | `SECURITY DEFINER` (đọc `kudos.sender_id` bị ẩn, chỉ trả dữ liệu đã che). `{ hasSunner, stats, latestGifts }`: số liệu của người dùng hiện tại (0 nếu không có hàng `sunners`) và 10 Sunner mở hộp gần nhất, mỗi người một dòng với hộp mới nhất (FR-312). |
| RPC | `toggle_kudo_like(p_kudo_id)` | cùng file | `SECURITY DEFINER`, đường ghi duy nhất cho tim (ALG-003). Báo lỗi `P0001` với thông điệp `sunner_not_found`, `kudo_not_found` hoặc `self_like`. Trả `{ liked, likeCount }`. |

Quyền `execute` của 6 RPC: chỉ `authenticated` (migration `…442_kudos_live_board_grants.sql`); `PUBLIC` và `anon` bị thu. Hàm trợ giúp ở schema `kudos_private` không được PostgREST phơi ra.

## Background Jobs

No data — không có tác vụ nền nào (BL inventory rỗng, 0 mục BL: không có cron, hàng đợi, worker hay lệnh CLI; xem behavior-logic.md).

## Webhooks / External Calls

Dịch vụ ngoài duy nhất là Supabase (Auth, và từ F006 là Postgres qua PostgREST/RPC), gọi qua SDK `@supabase/ssr` / `@supabase/supabase-js` (không có `fetch(` hay `axios` trong mã ứng dụng). Google chỉ xuất hiện như nhà cung cấp OAuth mà Supabase chuyển hướng tới.

| Direction | Target / Source | Event / Endpoint | Description |
|-----------|----------------|------------------|-------------|
| outgoing | Supabase Auth (qua Google OAuth) | `signInWithOAuth({ provider: "google" })` tại `lib/auth/sign-in-with-google.ts:15-18` | Chạy ở trình duyệt khi người dùng bấm nút đăng nhập: SDK lưu cookie code verifier rồi chuyển hướng cùng tab tới Google qua Supabase, với `redirectTo` là `${window.location.origin}/auth/callback`. |
| outgoing | Supabase Auth | `exchangeCodeForSession(code)` tại `app/auth/callback/route.ts:24` | Phía máy chủ, trong `GET /auth/callback`: đổi `code` OAuth lấy phiên, SDK ghi cookie phiên vào response. Lỗi hay ngoại lệ đều coi là đăng nhập thất bại. |
| outgoing | Supabase Auth | `getUser()` tại `app/auth/logout/route.ts:18` | Trong `POST /auth/logout`: kiểm tra phiên với máy chủ Auth, kết quả không quyết định việc đăng xuất. |
| outgoing | Supabase Auth | `signOut({ scope: "local" })` tại `app/auth/logout/route.ts:19` | Trong `POST /auth/logout`: hủy phiên của thiết bị hiện tại, không đụng các phiên khác. |
| outgoing | Supabase Auth | `getUser()` tại `lib/supabase/proxy.ts:47` | Guard phiên của `proxy.ts` gọi cho các trang không thuộc `/auth/`; không ảnh hưởng hai endpoint ở trên. Máy chủ Auth không phản hồi thì coi như chưa đăng nhập. |
| outgoing | Supabase Postgres (PostgREST) | `rpc('kudos_*')`, `rpc('toggle_kudo_like')` tại `lib/kudos/kudo-board-queries.ts`, `lib/kudos/toggle-kudo-like-action.ts` | Phía máy chủ, bằng phiên của người dùng: đọc dữ liệu màn Kudos và bật/tắt tim. Xem mục Kudos. |
| incoming | — | — | No data — không có webhook vào. Lượt quay lại từ OAuth chính là endpoint `GET /auth/callback` ở mục Auth, không phải webhook. |
