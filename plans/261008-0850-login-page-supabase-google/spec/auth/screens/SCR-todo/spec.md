---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

# SCR-todo — Screen Spec

**Screen**: SCR-todo: Todo (tối thiểu, được bảo vệ)
**Feature**: F001_Auth
**Type**: atomic
**Route**: /todo
**Generated**: 2026-10-08

## 1. Overview

**Purpose:** Người dùng đã đăng nhập thấy mình đang dùng tài khoản nào và đăng xuất khi xong; đây là điểm đến sau khi đăng nhập thành công.
**Actors:** Người dùng đã đăng nhập
**Entry Conditions:** Có phiên đăng nhập hợp lệ; khách chưa đăng nhập bị đưa về màn Login.
**Exit Conditions:** Người dùng đăng xuất và về màn Login.

## 2. Screen Layout

### Layout Sketch

Một trang đơn giản: vùng nội dung chiếm cả trang, trong đó một khối thông tin người dùng gồm email và nút Logout. Chưa có danh sách todo thật (ngoài phạm vi của tính năng này). Kiểu dáng chi tiết `TBD (draft)`.

```
┌─────────────────────────────────────────┐
│ R1: Page Container (static)             │
│  ┌───────────────────────────────────┐  │
│  │ R2: User Panel (static)           │  │
│  │ nguyen@example.com   [ Logout ]   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Container | static | no | TBD (draft) |
| R2 | User Panel | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Email người dùng | display field | — | Email của tài khoản đang đăng nhập | Always | — | store state | raw | dash | N/A |
| E02 | Logout | button | — | Enabled | Always | Đăng xuất | static | — | — | N/A |

Nhãn email và nhãn "Logout" (vi: "Đăng xuất") lấy từ từ điển `lib/i18n` do F002_Localization sở hữu (D002 trong functional-spec.md, đã chốt). Logout gọi `signOut({ scope: 'local' })` — chỉ thiết bị hiện tại.

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đăng xuất | E02 | click | Nút sẵn sàng | Nút bị vô hiệu hoá trong lúc xử lý `[EXPECTED]` | TBD (draft) |

### Happy Path

1. Người dùng thấy email của mình trong khối thông tin.
2. Người dùng bấm Logout.
3. Nút bị vô hiệu hoá trong lúc xử lý, rồi bàn giao sang màn khác.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Phiên đã hết hạn trước khi bấm | Không hiện lỗi; xử lý như đăng xuất bình thường | TBD (draft) |

N/A — single-action screen with one conditional outcome noted above.

### Interaction Notes

N/A — no non-trivial interaction patterns detected (only standard form input bindings).

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| default | Mở trang khi có phiên | E01 hiện email, E02 sẵn sàng | Bấm Logout | TBD (draft) |
| empty | Tài khoản không có email | E01 hiện dấu "—" | Bấm Logout | TBD (draft) |
| saving | Đã bấm Logout, đang xử lý | E02 vô hiệu hoá `[EXPECTED]` | Không | TBD (draft) |
| success | Đăng xuất xong | Người dùng không còn ở trang này | Không | TBD (draft) |
| error | Đăng xuất báo lỗi | Không hiện lỗi; vẫn xoá phiên và rời trang | Không | TBD (draft) |

Loading: N/A — trang dựng sẵn phía máy chủ, không có thao tác bất đồng bộ ở trình duyệt khi mở.

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

> `screen-flow.md` chưa được tạo; các dòng dưới là đường đi đã chốt trong `clarifications.md`, cần đối chiếu khi bản as-built sinh `screen-flow.md`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-login | Đăng nhập Google thành công | Luôn | TBD (draft) |
| SCR-login | Mở `/login` khi đã có phiên | Có phiên hợp lệ | TBD (draft) |
| external | Mở địa chỉ `/todo` | Có phiên hợp lệ | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đăng xuất | E02 | Luôn | SCR-login | redirect | TBD (draft) |
| Mở trang khi không có phiên hợp lệ | — | Phiên mất hoặc hết hạn | SCR-login | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | E02 là nút có tên truy cập là nhãn Logout |
| Keyboard navigation | [EXPECTED] | Tab tới E02; Enter/Space kích hoạt |
| Focus management | [EXPECTED] | Không có bẫy focus |
| Screen reader compatibility | [EXPECTED] | Dùng landmark main; email đọc như văn bản thường |
| Error announcement | [EXPECTED] | Không áp dụng — màn không hiện lỗi |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
