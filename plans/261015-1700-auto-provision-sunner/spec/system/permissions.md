---
status: draft
authored_by: takumi
created: 2026-10-15
lang: vi
---

<!-- FORWARD-DRAFT (delta): chỉ các đoạn đổi của docs/system/permissions.md. Khi promote, thay đúng dòng/đoạn tương ứng. Không có mã PERM###; lý do thiết kế (trigger thay vì tạo ở /auth/callback hay tạo lười trong RPC) thuộc ADR, không ghi ở đây. -->

## Analysis Scope (thêm vào cuối đoạn hiện có)

Từ thay đổi tự tạo hồ sơ Sunner: trigger `after insert` trên `auth.users` (hàm `SECURITY DEFINER` ở schema `kudos_private`) tạo hàng `sunners` cho mọi tài khoản Google ở lần đăng nhập đầu, và migration tạo bù cho tài khoản đã có.

## Identified Roles (đổi dòng "Người dùng hiện tại của Kudos")

- **Người dùng hiện tại của Kudos** (không phải vai trò mới) — hàng `sunners` có `user_id = auth.uid()`. Hàng này được tạo tự động ở lần đăng nhập đầu của mọi tài khoản Google (không lọc tên miền). Dùng để biết ai là người gửi/nhận, số liệu sidebar là của ai, và ai đang bấm tim.

## Curated View (đổi dòng "Người dùng không có hàng `sunners`")

- **Tài khoản Google mới**: ngay lần đăng nhập đầu đã có hồ sơ Sunner (tên và ảnh lấy từ tài khoản Google, không có phòng ban hay danh hiệu), nên bấm tim, gửi Kudo và nhận Kudo được ngay; mọi tài khoản Google đều được, như ở phần vai trò `authenticated`. Hồ sơ này hiện trong ô tìm người nhận của mọi Sunner khác.
- **Người dùng không có hàng `sunners`** (hiếm: hồ sơ bị gỡ liên kết hoặc xóa, hoặc tài khoản tạo khi trigger chưa tồn tại và chưa được tạo bù): xem được màn Kudos, số liệu sidebar hiện 0, không thích và không gửi Kudo được: nút tim và thanh ghi nhận vô hiệu, các RPC `toggle_kudo_like` và `create_kudo` báo lỗi `sunner_not_found` làm chốt chặn phía máy chủ. Hai RPC này không bao giờ tự tạo hàng `sunners`; chỉ trigger tạo.

## Access Boundaries (thêm một lớp; số lớp do bước reconcile đánh)

- **Lớp 9, tạo hồ sơ Sunner khi tài khoản ra đời (mới, trigger trên `auth.users`)**: hàm trigger `SECURITY DEFINER`, `search_path` cố định, mọi tên viết đủ schema, đặt ở `kudos_private` (PostgREST không phơi ra), không ai gọi trực tiếp được ngoài trigger.
  - Danh tính lấy từ dòng tài khoản vừa tạo (`new.id`), không từ tham số hay trình duyệt, nên không ai tạo được hồ sơ cho tài khoản khác.
  - Không có đường ghi `sunners` mới cho trình duyệt: client vẫn chỉ `select` theo cột; `INSERT`, `UPDATE`, `DELETE` vẫn không có policy.
  - Hàng mới chỉ có `user_id`, tên, ảnh (https hoặc trống); `user_id` vẫn bị che khỏi client (Lớp 5), nên việc tạo hồ sơ cho mọi tài khoản không làm lộ tài khoản nào là người gửi của Kudo ẩn danh. Tên và ảnh thì hiện công khai với mọi người đã đăng nhập (như mọi hồ sơ Sunner khác).
  - `on conflict (user_id) do nothing`: tạo lặp không sinh thêm hàng; hàng seed (`user_id` null) không bao giờ bị khớp hay sửa.
  - Lỗi trong trigger không bị nuốt, nên lỗi thật chặn việc tạo tài khoản thay vì để lại tài khoản không có hồ sơ trong im lặng.

## Open Gaps (đổi dòng "Người dùng đăng nhập nhưng chưa có hàng `sunners`")

- Người dùng đăng nhập nhưng chưa có hàng `sunners`: đã chốt tự tạo ở lần đăng nhập đầu bằng trigger; chốt chặn `sunner_not_found` giữ cho trường hợp hiếm. Không còn bước gán `user_id` thủ công cho tài khoản mới (hướng dẫn trong `supabase/seed.sql` chỉ còn dùng khi muốn một tài khoản thành chính hàng seed).
- **Mới:** không lọc tên miền, nên mọi tài khoản Google, kể cả ngoài công ty, đều có hồ sơ và xuất hiện trong ô tìm người nhận của người khác; hiện chưa có cơ chế duyệt hay gỡ hồ sơ.
