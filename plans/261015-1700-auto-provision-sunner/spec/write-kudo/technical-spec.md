---
status: draft
authored_by: takumi
fcode: F007
created: 2026-10-15
lang: vi
---

<!-- DELTA (run UPDATE): chỉ gồm dòng đổi của docs/features/F007_WriteKudo/technical-spec.md. Không đổi mã, không đổi mã nguồn của F007; thay đổi code nằm ở F006 (trigger auth.users). -->

## 3. Actions

### A1 · Rule (đổi lời; bảng DEC-008 giữ nguyên hai dòng, chỉ đổi dòng đầu)

**Rule** · Chỉ người xem có hàng `sunners` mới mở được modal, cùng luật với nút tim của F006. Hàng này do trigger `auth.users` của F006 tạo ở lần đăng nhập đầu (BR-012, INT-004), nên nhánh vô hiệu chỉ còn là chốt chặn dự phòng:

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-008** | render | `hasSunner = false` (hiếm: hồ sơ bị gỡ liên kết hoặc xóa) | Pill ghi nhận vô hiệu (`disabled`), không mở modal; RPC `create_kudo` vẫn là chốt chặn phía máy chủ | `app/(main)/sun-kudos/_components/kudos-banner.tsx:75` |

### 3.x Edge cases

| Action | Scenario | Behavior |
|---|---|---|
| A1 *(đổi)* | Người xem không có hàng `sunners` (chỉ khi bị gỡ liên kết hoặc xóa) | Pill vô hiệu; `create_kudo` vẫn báo `sunner_not_found` nếu bị gọi trực tiếp |

## 5. Verification & Technical Notes

### 5.1 Technical Verification

Kịch bản 2 (đổi): **Given** hồ sơ Sunner của người dùng bị gỡ liên kết hoặc xóa, **When** mở trang, **Then** pill `disabled`. Thêm kịch bản: **Given** tài khoản Google vừa đăng nhập lần đầu, **When** mở trang, **Then** pill bấm được và `create_kudo` không báo `sunner_not_found`.
