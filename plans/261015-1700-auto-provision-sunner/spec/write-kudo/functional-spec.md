---
status: draft
authored_by: takumi
fcode: F007
created: 2026-10-15
lang: vi
---

<!-- DELTA (run UPDATE): chỉ gồm dòng đổi của docs/features/F007_WriteKudo/functional-spec.md. Không thêm mã mới: hồ sơ tự tạo thuộc F006 (FR-605, BR-012). -->

## 1. Overview

Dòng Actors "Sunner gửi Kudos" (đổi mô tả):

| Actor | Description | Primary goal |
|-------|-------------|--------------|
| Sunner gửi Kudos | Nhân viên đã đăng nhập; hồ sơ Sunner được tạo tự động ở lần đăng nhập đầu (F006, FR-605) | Gửi lời cảm ơn, ghi nhận tới một đồng nghiệp, công khai hoặc ẩn danh |

## 4. Requirements

- **FR-103** *(đổi lời, mã giữ nguyên)* Người đã đăng nhập mà vì lý do hiếm (hồ sơ Sunner bị gỡ liên kết hoặc xóa) không có hồ sơ thì thấy thanh ghi nhận ở trạng thái vô hiệu. Đây là chốt chặn dự phòng: tài khoản Google mới luôn có hồ sơ ngay từ lần đăng nhập đầu (F006, FR-605), nên thanh ghi nhận dùng được ngay.
- **FR-601** *(đổi lời)* Chỉ người đã đăng nhập và có hồ sơ Sunner mới gửi được; người gửi luôn lấy từ phiên, không từ dữ liệu trình duyệt gửi lên. Việc gửi không bao giờ tự tạo hồ sơ.

## 5. Business Rules

- *(đổi lời)* Người dùng không có hồ sơ Sunner (chỉ còn khi hồ sơ bị gỡ liên kết hoặc xóa) thì thanh ghi nhận vô hiệu, cùng luật với nút tim (DEC-008)

## 8. Scenarios

### US001 — Error: chưa đăng nhập hoặc chưa có hồ sơ *(đổi lời)*

**Given** khách chưa đăng nhập, **When** mở `/sun-kudos`, **Then** bị đưa về trang đăng nhập (ID-1); **Given** người đã đăng nhập nhưng hồ sơ Sunner bị gỡ liên kết hoặc xóa (tài khoản Google mới không rơi vào trường hợp này), **When** nhìn thanh ghi nhận, **Then** nút vô hiệu và không mở được modal.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Người dùng không có hồ sơ Sunner (chỉ khi hồ sơ bị gỡ liên kết hoặc xóa) | Thanh ghi nhận vô hiệu; máy chủ vẫn từ chối nếu bị gọi trực tiếp | None — nút vô hiệu |
| Người dùng Google mới vừa đăng nhập lần đầu | Thanh ghi nhận bấm được ngay; mở được modal và gửi được | None |

## 10. Edge Behaviours to Verify

- **FR-103** → Chỉ tài khoản không có hồ sơ Sunner (hiếm) mới thấy thanh ghi nhận vô hiệu; tài khoản Google mới thì không.
