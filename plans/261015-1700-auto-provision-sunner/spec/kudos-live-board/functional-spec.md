---
status: draft
authored_by: takumi
fcode: F006
created: 2026-10-15
lang: vi
---

<!-- DELTA (run UPDATE): chỉ gồm các dòng/mục đổi của docs/features/F006_KudosLiveBoard/functional-spec.md. Khi promote, thay đúng dòng cùng mã; dòng "MỚI" thì thêm vào cuối nhóm tương ứng. Nguồn: plans/261015-1700-auto-provision-sunner/clarifications.md -->

## 1. Overview

Dòng Actors "Sunner" thay bằng (mô tả đổi: mỗi tài khoản Google tự có hồ sơ):

| Actor | Description | Primary goal |
|-------|-------------|--------------|
| Sunner | Bất kỳ tài khoản Google đã đăng nhập; hồ sơ Sunner được tạo tự động ở lần đăng nhập đầu, không lọc theo tên miền; có thể là người gửi hoặc người nhận kudo; "người dùng hiện tại" là hàng `sunners` có `user_id` trùng tài khoản | Xem các lời cảm ơn nổi bật và mới nhất, tìm theo hashtag, phòng ban, thả tim, chia sẻ liên kết và xem số liệu của mình |

## 2. Functional Capabilities

CAP-06 (đổi hai ô Requirements và Business Rules; các ô khác giữ nguyên):

| ID | Capability | Requirements | Business Rules |
|----|------------|--------------|----------------|
| CAP-06 | Xem số liệu cá nhân và người nhận quà mới nhất | FR-310, FR-311, FR-312, FR-313, FR-605 | BR-006, BR-012, DEC-006 |

## 3. Open Decisions

D013 thay bằng:

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D013 | Người đăng nhập chưa có hàng `sunners` | **Đã chốt (đổi, 2026-10-15):** mọi tài khoản Google tự được tạo hồ sơ Sunner ở lần đăng nhập đầu, không lọc tên miền; tài khoản cũ chưa có hồ sơ được tạo bù một lần; không nối với hàng seed theo tên (bảng không có email, khớp tên không an toàn). Đường "chưa có hồ sơ" (số liệu 0, tim và thanh ghi nhận vô hiệu, RPC `sunner_not_found`) giữ làm chốt chặn cho hồ sơ bị gỡ liên kết hoặc xóa. Thay quyết định cũ "không tự tạo hàng" | Đăng nhập Google mà không gửi hay tim được là lỗi trải nghiệm; tạo ở đúng một chỗ (lúc tài khoản ra đời) thì mọi người đọc đều thấy hồ sơ ngay | no |

## 4. Requirements

### Security (6xx)

- **FR-603** *(đổi lời)* Người đăng nhập không có hồ sơ Sunner gọi thả tim thì bị từ chối; lệnh thả tim không bao giờ tự tạo hồ sơ (hồ sơ chỉ được tạo lúc tài khoản ra đời, FR-605).
- **FR-605** *(MỚI)* Khi một tài khoản Google đăng nhập lần đầu (tài khoản được tạo), hệ thống tạo cho tài khoản đó đúng một hồ sơ Sunner, không phụ thuộc tên miền email; tài khoản đã có từ trước mà chưa có hồ sơ được tạo bù một lần khi triển khai.

### Kudos Live board — Spotlight, All Kudos, sidebar (3xx)

- **FR-311** *(đổi lời)* Người đăng nhập chưa có hồ sơ Sunner (chỉ còn khi hồ sơ bị gỡ liên kết hoặc xóa) thì cả năm số hiển thị 0.

## 5. Business Rules

- *(MỚI)* Hồ sơ Sunner tự tạo mang tên và ảnh đại diện lấy từ tài khoản Google (tên đầy đủ, nếu thiếu thì tên hiển thị, nếu thiếu thì phần trước "@" của email, cuối cùng là "Sunner", tối đa 100 ký tự; ảnh chỉ nhận địa chỉ https, còn lại để trống); không có phòng ban và danh hiệu. Tạo lặp cho cùng một tài khoản không sinh thêm hàng (BR-012)
- *(đổi lời)* Sidebar: không có hồ sơ Sunner (chỉ còn khi hồ sơ bị gỡ liên kết hoặc xóa) thì số liệu là 0; nút "Mở Secret Box" vô hiệu khi chưa mở bằng 0; danh sách nhận quà rỗng hiện "Chưa có dữ liệu" (DEC-006)

## 7. User Stories

Không thêm US mới (không đổi hành vi nhìn thấy được ở màn này ngoài việc người mới đã có hồ sơ). US008 không đổi.

## 8. Scenarios

### US008 — Error: không có hồ sơ Sunner *(đổi lời)*

**Given** người đăng nhập không có hàng `sunners` (hồ sơ bị gỡ liên kết hoặc xóa; tài khoản Google mới luôn có hồ sơ), **When** mở trang, **Then** năm số bằng 0 và nút "Mở Secret Box" vô hiệu.

### US008 — Happy Path: tài khoản Google mới *(MỚI, gắn vào US008)*

**Given** một tài khoản Google chưa từng đăng nhập, **When** đăng nhập lần đầu rồi mở `/sun-kudos`, **Then** năm số bằng 0 vì chưa có kudo, nhưng thả tim và thanh ghi nhận dùng được ngay.

## 9. Edge Cases

Dòng "Người đăng nhập chưa có hồ sơ Sunner bấm tim" đổi:

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Người đăng nhập chưa có hồ sơ Sunner bấm tim (chỉ khi hồ sơ bị gỡ liên kết hoặc xóa) | Từ chối, trạng thái về như trước | Toast lỗi ngắn (chuỗi chờ xác nhận, D016) |

Dòng mới:

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Tài khoản Google thiếu tên hoặc ảnh | Tên rơi về phần trước "@" của email rồi "Sunner"; ảnh để trống | "None" |
| Tài khoản mới có tên giống hàng seed | Vẫn là hồ sơ riêng, không nối với hàng seed; hàng seed giữ nguyên không có tài khoản | "None" |

## 10. Edge Behaviours to Verify

- **FR-605** → Tài khoản Google mới đăng nhập xong là thả tim và gửi kudo được, không cần thao tác nào khác.
- **FR-311** → Chỉ khi hồ sơ không còn mới thấy năm số 0 và nút Secret Box vô hiệu.
