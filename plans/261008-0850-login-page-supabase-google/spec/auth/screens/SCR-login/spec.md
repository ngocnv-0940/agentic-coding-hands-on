---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

# SCR-login — Screen Spec

**Screen**: SCR-login: Login (SAA 2025)
**Feature**: F001_Auth
**Type**: atomic
**Route**: /login
**Generated**: 2026-10-08

## 1. Overview

**Purpose:** Khách chưa đăng nhập dùng màn này để đăng nhập vào ứng dụng SAA 2025 bằng tài khoản Google; đây là màn đầu tiên họ gặp.
**Actors:** Khách
**Entry Conditions:** Chưa có phiên đăng nhập hợp lệ; người đã đăng nhập không ở lại màn này.
**Exit Conditions:** Khách rời sang trang đăng nhập Google (cùng tab), hoặc (nếu đã có phiên) được đưa sang màn Todo.

## 2. Screen Layout

### Layout Sketch

Ba vùng chồng dọc: header cố định ở trên (logo bên trái, bộ chọn ngôn ngữ bên phải), vùng đăng nhập chính ở giữa (hình hero sóng màu phủ nền, khối giới thiệu và nút đăng nhập nằm bên trái), footer cố định ở đáy. Bố cục desktop giữ nguyên; dưới breakpoint `md` chỉ thu nhỏ cỡ chữ và padding (xem D001 trong functional-spec.md, § 10). Bộ chọn ngôn ngữ thuộc F002_Localization; màn này chỉ dành chỗ cho nó.

```
┌──────────────────────────────────────────────────────┐
│ R1: Header (fixed-top)                               │
│ [Logo SAA 2025]                      [VN ▾ — F002]   │
├──────────────────────────────────────────────────────┤
│ R2: Main Login Section (static) — hero visual nền    │
│  ROOT FURTHER                                        │
│  Bắt đầu hành trình của bạn cùng SAA 2025.           │
│  Đăng nhập để khám phá!                              │
│  [ G  LOGIN With Google ]                            │
│  Đăng nhập không thành công. Vui lòng thử lại.  ←(chỉ khi lỗi)
├──────────────────────────────────────────────────────┤
│ R3: Footer (fixed-bottom)  Bản quyền thuộc về Sun* © 2025 │
└──────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | TBD (draft) |
| R2 | Main Login Section | static | no | TBD (draft) |
| R3 | Footer | fixed-bottom | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo Sun* Annual Awards 2025 | image | — | Hiển thị | Always | — | static | — | — | N/A |
| E02 | Bộ chọn ngôn ngữ (cờ + "VN" + mũi tên) | select | no | VN | Always | — | static | ISO 639-1 | — | Thuộc F002_Localization; hành vi không đặc tả ở đây |
| E03 | Hình hero sóng màu (vàng, cam, xanh lá, xanh dương, tím trên nền tối) | image | — | Hiển thị | Always | — | static | — | — | N/A |
| E04 | Tiêu đề "ROOT FURTHER" | display field | — | Hiển thị | Always | — | static | raw | — | N/A |
| E05 | Subtitle "Bắt đầu hành trình của bạn cùng SAA 2025." | display field | — | Hiển thị | Always | — | static | raw | — | N/A |
| E06 | Tagline "Đăng nhập để khám phá!" | display field | — | Hiển thị | Always | — | static | raw | — | N/A |
| E07 | LOGIN With Google | button | — | Enabled | Always | Bắt đầu đăng nhập Google | static | chữ đậm, nền vàng nhạt, biểu tượng Google | — | N/A |
| E08 | Chỉ báo đang tải trong nút | display field | — | Ẩn | Conditional | — | computed | — | hidden | N/A |
| E09 | Thông báo lỗi dưới nút | message | — | Ẩn | Conditional | — | route param | cố định "Đăng nhập không thành công. Vui lòng thử lại." | hidden | N/A |
| E10 | Footer "Bản quyền thuộc về Sun* © 2025" | display field | — | Hiển thị | Always | — | static | raw | — | N/A |

Mọi chuỗi chữ (E04–E07, E09, E10) lấy từ từ điển theo ngôn ngữ đang chọn do F002_Localization cung cấp; bản tiếng Việt ở trên là bản mặc định `[EXPECTED]`. Logo, hero, các dòng giới thiệu và footer không tương tác được.

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Bắt đầu đăng nhập Google | E07 | click | Nút đang sẵn sàng (không bị vô hiệu hoá) | Nút bị vô hiệu hoá, E08 hiện, E09 (nếu đang hiện) ẩn đi | TBD (draft) |
| Xem phản hồi khi rê chuột | E07 | hover | Nút sẵn sàng | Nút nổi bóng | TBD (draft) |

### Happy Path

1. Khách thấy header ở trên, hero và lời giới thiệu ở giữa, nút "LOGIN With Google" bên dưới lời giới thiệu, footer ở đáy.
2. Khách rê chuột lên nút — nút nổi bóng.
3. Khách bấm nút — nút bị vô hiệu hoá và hiện chỉ báo đang tải.
4. Trình duyệt rời màn này để sang Google (bàn giao cho luồng đăng nhập).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Khi vào màn | Địa chỉ có cờ lỗi | E09 hiện ngay, nút sẵn sàng | TBD (draft) |
| Bước 3 | Không khởi động được luồng đăng nhập | E08 ẩn, nút bật lại, E09 hiện | TBD (draft) |
| Bước 3 | Khách bấm khi nút đã bị vô hiệu hoá | Không có phản ứng | TBD (draft) |

### Interaction Notes

- **Bấm lại sau lỗi — thông báo lỗi cũ biến mất khi bắt đầu lượt đăng nhập mới** `[EXPECTED]` — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| default | Mở màn, không có cờ lỗi | Đủ E01–E07, E10; E08 và E09 ẩn | Bấm E07, mở bộ chọn ngôn ngữ (F002) | TBD (draft) |
| hover | Rê chuột lên E07 | Bóng nổi quanh nút | Bấm | TBD (draft) |
| loading | Đã bấm E07, chờ trình duyệt chuyển sang Google | E07 vô hiệu hoá, E08 hiện | Không | TBD (draft) |
| saving | Không áp dụng — màn không ghi dữ liệu | — | — | TBD (draft) |
| error (callback) | Quay về màn với cờ lỗi (đăng nhập thất bại hoặc huỷ) | E09 hiện dưới nút; nút sẵn sàng | Bấm lại E07 | TBD (draft) |
| error (khởi động) | Không bắt đầu được luồng ngay trên màn | E08 ẩn, nút bật lại, E09 hiện | Bấm lại E07 | TBD (draft) |
| success | Đăng nhập xong | Người dùng không còn ở màn này; trình duyệt được đưa sang màn Todo | Không | TBD (draft) |

Empty: N/A — màn không có vùng hiển thị dữ liệu động.

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E09 | Hiện khi địa chỉ có cờ lỗi khác rỗng; nội dung cờ không bao giờ được in ra | "Đăng nhập không thành công. Vui lòng thử lại." | server response |
| E09 | Hiện khi không khởi động được luồng đăng nhập | "Đăng nhập không thành công. Vui lòng thử lại." | submit |
| E07 | Không cho bấm lần hai khi đang chờ | Nút vô hiệu hoá kèm chỉ báo tải | submit |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Chỉ báo tải xuất hiện khi đăng nhập đang được khởi động | auth | E08 | Đã bấm E07 và chưa rời trang | Mặc định hoặc khi khởi động lỗi | Nút E07 vô hiệu hoá cùng lúc |
| Thông báo lỗi xuất hiện khi lượt đăng nhập trước thất bại | auth | E09 | Địa chỉ có cờ lỗi, hoặc khởi động lỗi | Không có cờ lỗi; hoặc vừa bấm lại E07 | Nội dung cố định, không phụ thuộc cờ |

## 8. Navigation

> `screen-flow.md` chưa được tạo; các dòng dưới là đường đi đã chốt trong `clarifications.md`, cần đối chiếu khi bản as-built sinh `screen-flow.md`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| external | Mở địa chỉ `/login` hoặc mở ứng dụng | Chưa có phiên hợp lệ | TBD (draft) |
| SCR-todo | Bấm Logout | Luôn | TBD (draft) |
| external | Google/Supabase quay về sau khi huỷ hoặc lỗi, kèm cờ lỗi | Đăng nhập thất bại hoặc bị huỷ | TBD (draft) |
| SCR-todo | Mở `/todo` khi chưa đăng nhập | Không có phiên hợp lệ | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Bắt đầu đăng nhập Google | E07 | Nút sẵn sàng | external (trang đăng nhập Google qua Supabase) | redirect (cùng tab) | TBD (draft) |
| Mở màn khi đã có phiên | — | Có phiên hợp lệ | SCR-todo | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | E07 là nút có tên truy cập "LOGIN With Google"; E08 có `role="status"`; E09 có `role="alert"` |
| Keyboard navigation | [EXPECTED] | Tab theo thứ tự: bộ chọn ngôn ngữ (F002) rồi E07; Enter/Space kích hoạt E07; logo và footer không nhận focus |
| Focus management | [EXPECTED] | Không có bẫy focus; khi khởi động lỗi, focus quay lại E07 |
| Screen reader compatibility | [EXPECTED] | Dùng landmark header, main, footer; ảnh hero trang trí ẩn khỏi trình đọc màn hình |
| Error announcement | [EXPECTED] | E09 được đọc ngay khi xuất hiện (vùng alert) |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| từ `md` trở lên | toàn màn | Bố cục desktop theo thiết kế | clarifications.md, 2026-10-08 |
| dưới `md` | R1 (E01, E02) | Logo giữ góc trên trái, bộ chọn ngôn ngữ giữ góc trên phải; thu nhỏ cỡ chữ và padding | clarifications.md, 2026-10-08 |
| dưới `md` | R2 | Cùng bố cục, thu nhỏ cỡ chữ và padding; không có cuộn ngang | clarifications.md, 2026-10-08 |
| mọi kích thước cửa sổ | R3 | Footer cố định ở đáy, không đổi khi cuộn | TBD (draft) |
