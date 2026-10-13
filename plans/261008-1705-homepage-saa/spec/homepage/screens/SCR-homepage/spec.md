---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

# SCR-homepage — Screen Spec

**Screen**: SCR-homepage: Homepage SAA
**Feature**: F000_Homepage
**Type**: atomic
**Route**: /
**Generated**: 2026-10-08

## 1. Overview

**Purpose:** Người dùng đã đăng nhập dùng trang này làm cửa vào chính của ứng dụng: xem chủ đề ROOT FURTHER, đếm ngược tới sự kiện Sun* Annual Awards 2025, các hạng mục giải thưởng và phong trào Sun* Kudos, rồi đi tới các trang liên quan.
**Actors:** Người dùng đã đăng nhập, Quản trị viên
**Entry Conditions:** Có phiên đăng nhập hợp lệ; khách bị chuyển về màn Login. Người dùng tới đây ngay sau khi đăng nhập hoặc khi mở `/login` lúc đã đăng nhập.
**Exit Conditions:** Người dùng sang trang Awards Information, Sun* Kudos, Tiêu chuẩn chung, Profile, Admin Dashboard (hiện đều là trang giữ chỗ) hoặc đăng xuất về màn Login.

## 2. Screen Layout

### Layout Sketch

Các vùng xếp dọc: header cố định ở trên (logo trái, ba mục điều hướng giữa, chuông, bộ chọn ngôn ngữ và tài khoản bên phải), hero có hình ROOT FURTHER kèm đếm ngược, thông tin sự kiện và hai nút CTA; tiếp theo là đoạn Root Further, lưới giải thưởng, khối Sun* Kudos và footer ở cuối. Nút widget dạng viên thuốc nổi cố định ở góc phải dưới. Menu tài khoản, bảng thông báo và menu ngôn ngữ là lớp nổi mở từ header.

```
┌────────────────────────────────────────────────────────────────┐
│ R1: Header (sticky)                                            │
│ [Logo]   About SAA 2025 | Awards Information | Sun* Kudos      │
│                               [Bell] [VN ▾] [Account]          │
│                                  ┌ ─ ─ ─ ─ ─ ─ ┐ R8 (floating) │
├────────────────────────────────────────────────────────────────┤
│ R2: Hero (static) — hình ROOT FURTHER                          │
│   Coming soon                                                  │
│   [DAYS] [HOURS] [MINUTES]                                     │
│   Thời gian / Địa điểm / Tường thuật Livestream                │
│   [ABOUT AWARDS]  [ABOUT KUDOS]                                │
├────────────────────────────────────────────────────────────────┤
│ R3: Root Further content (static)                              │
├────────────────────────────────────────────────────────────────┤
│ R4: Awards (static) — tiêu đề + lưới 6 thẻ (3 cột desktop)     │
├────────────────────────────────────────────────────────────────┤
│ R5: Sun* Kudos promo (static)                                  │
├────────────────────────────────────────────────────────────────┤
│ R6: Footer (static): [Logo]  links ...        Bản quyền ...    │
└────────────────────────────────────────────────────────────────┘
                                                       ┌────────┐
                                  R7: Widget (fixed)   │ ✎ / SAA│
                                                       └────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | sticky | no | TBD (draft) |
| R2 | Hero (key visual, đếm ngược, thông tin sự kiện, CTA) | static | yes | TBD (draft) |
| R3 | Root Further content | static | yes | TBD (draft) |
| R4 | Awards | static | yes | TBD (draft) |
| R5 | Sun* Kudos promo | static | yes | TBD (draft) |
| R6 | Footer | static | yes | TBD (draft) |
| R7 | Widget button | fixed-bottom-right | no | TBD (draft) |
| R8 | Lớp nổi: bảng thông báo, menu ngôn ngữ, menu tài khoản | floating (dưới header) | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo Sun* Annual Awards (R1) | image | — | Hiển thị, có chữ thay thế | Always | Cuộn lên đầu trang | static | 64x60 | — | TBD (draft) |
| E02 | About SAA 2025 (mục đang chọn trên `/`; mục đang chọn theo trang hiện tại) | link | — | Tô nổi, gạch chân | Always | Cuộn lên đầu trang | static | — | — | TBD (draft) |
| E03 | Awards Information, Sun* Kudos (hai mục điều hướng) | link | — | Chữ thường; hover tô sáng | Always | Mở trang tương ứng | static | — | — | TBD (draft) |
| E04 | Chuông thông báo | button | — | Không có chấm đỏ | Always | Mở bảng thông báo | static | 40x40 | — | TBD (draft) |
| E05 | Bộ chọn ngôn ngữ (VN/EN) | button | — | VN | Always | Mở menu chọn ngôn ngữ | cookie ngôn ngữ | cờ + mã | — | F002_Localization |
| E06 | Biểu tượng tài khoản | button | — | Đóng menu | Always | Mở menu tài khoản | static | 40x40 | — | TBD (draft) |
| E07 | Bảng thông báo | region label | — | Đóng | Always | — | static | — | "Chưa có thông báo" | TBD (draft) |
| E08 | Profile (trong menu) | link | — | Menu đóng | Always | Mở trang Profile | static | — | — | TBD (draft) |
| E09 | Sign out (trong menu) | button | — | Menu đóng | Always | Đăng xuất | static | — | — | F001_Auth |
| E10 | Admin Dashboard (trong menu) | link | — | Menu đóng | Conditional | Mở trang Admin | computed (vai trò) | — | hidden | TBD (draft) |
| E11 | Hình hero ROOT FURTHER | image | — | Hiển thị | Always | — | static | phủ toàn rộng, lớp phủ tối | — | TBD (draft) |
| E12 | Dòng "Coming soon" | display field | — | Hiển thị | Conditional | — | computed (EVENT_START_AT) | raw | hidden | TBD (draft) |
| E13 | Đồng hồ đếm ngược (DAYS, HOURS, MINUTES) | display field | — | Số còn lại tới mốc | Always | — | computed (EVENT_START_AT) | hai chữ số, đệm số 0 | 00 | TBD (draft) |
| E14 | Thông tin sự kiện (ngày, địa điểm, Livestream) | display field | — | Hiển thị | Always | — | computed (EVENT_START_AT) và static | ngày `dd/MM/yyyy` theo Asia/Ho_Chi_Minh, không hiện giờ | dash ("—") | TBD (draft) |
| E15 | Nút ABOUT AWARDS | button | — | Nền vàng | Always | Mở trang Awards Information | static | — | — | TBD (draft) |
| E16 | Nút ABOUT KUDOS | button | — | Viền | Always | Mở trang Sun* Kudos | static | — | — | TBD (draft) |
| E17 | Nội dung Root Further | display field | — | Hiển thị | Always | — | static | nhiều đoạn, có câu trích | — | TBD (draft) |
| E18 | Tiêu đề mục giải thưởng ("Sun* annual awards 2025", "Hệ thống giải thưởng", mô tả phụ) | display field | — | Hiển thị | Always | — | static | — | — | TBD (draft) |
| E19 | Thẻ giải thưởng (6 thẻ: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) | link | — | Hiển thị đủ 6 | Always | Mở trang hạng mục | static | ảnh vuông, tên, mô tả cắt 2 dòng | — | TBD (draft) |
| E20 | Liên kết "Chi tiết" của thẻ | link | — | Hiển thị | Always | Mở trang hạng mục | static | kèm biểu tượng | — | TBD (draft) |
| E21 | Khối Sun* Kudos (nhãn "Phong trào ghi nhận", tiêu đề, mô tả, ảnh) | display field | — | Hiển thị | Always | — | static | — | — | TBD (draft) |
| E22 | Nút "Chi tiết" của Kudos | button | — | Hiển thị | Always | Mở trang Sun* Kudos | static | kèm biểu tượng | — | TBD (draft) |
| E23 | Nút widget (viên thuốc 105x64, nền vàng) | button | — | Hiển thị | Always | Chưa có hành động | static | bút chì, "/", biểu tượng SAA | — | TBD (draft) |
| E24 | Footer: logo và liên kết (About SAA 2025, Awards Information, Sun* Kudos, Tiêu chuẩn chung) | link | — | Hiển thị | Always | Mở trang tương ứng; logo về đầu trang | static | — | — | TBD (draft) |
| E25 | Dòng bản quyền | display field | — | "Bản quyền thuộc về Sun* © 2025" | Always | — | static | — | — | TBD (draft) |

Mô tả E19 lấy nguyên văn từ node Figma của từng thẻ (điền khi triển khai); slug: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`. Bản tiếng Anh của mọi chuỗi do nhóm tự soạn.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Cuộn lên đầu trang | E01, E02, E24 (logo) | click | — | Trang cuộn lên đầu | TBD (draft) |
| Mở/đóng bảng thông báo | E04 | click, Enter, Space | — | Bảng E07 mở hoặc đóng | TBD (draft) |
| Mở/đóng menu ngôn ngữ | E05 | click, Enter, Space | — | Menu hai mục VN/EN mở hoặc đóng | TBD (draft) |
| Đổi ngôn ngữ | E05 | chọn một mục | — | Toàn bộ chuỗi đổi, lựa chọn được nhớ | TBD (draft) |
| Mở/đóng menu tài khoản | E06 | click, Enter, Space | — | Menu E08, E09, E10 mở hoặc đóng | TBD (draft) |
| Đóng menu đang mở | R8 | click ra ngoài, Escape | Có menu hoặc bảng đang mở | Lớp nổi đóng | TBD (draft) |
| Đăng xuất | E09 | click | — | Gửi yêu cầu đăng xuất | TBD (draft) |
| Nâng thẻ khi rê chuột | E19 | hover | — | Thẻ nhô nhẹ, viền sáng | TBD (draft) |

### Happy Path

1. Người dùng mở trang và thấy hero ROOT FURTHER, đồng hồ đếm ngược ở R2.
2. Người dùng cuộn xuống đọc R3 rồi xem lưới giải thưởng ở R4; header vẫn cố định.
3. Người dùng bấm tiêu đề một thẻ giải thưởng (E19) để mở trang hạng mục.
4. Người dùng bấm logo (E01) để quay về đầu trang.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Chưa tới mốc sự kiện | Hiện "Coming soon" và số còn lại | TBD (draft) |
| Bước 1 | Đã tới mốc hoặc cấu hình mốc sai | Ba ô là 00, ẩn "Coming soon" | TBD (draft) |
| Mở menu tài khoản | Người dùng là admin | Thêm mục Admin Dashboard | TBD (draft) |

### Interaction Notes

- **Bấm ra ngoài hoặc nhấn Escape thì mọi menu và bảng đóng lại** — source: TBD (draft)
- **Bấm vào ảnh, tên hay "Chi tiết" của một thẻ cho cùng kết quả** — source: TBD (draft)
- **Mở bảng thông báo khi đang mở menu tài khoản thì menu kia đóng** — source: TBD (draft) [EXPECTED]

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Trang đang dựng | Trang được dựng sẵn, đồng hồ có sẵn giá trị đầu tiên, không có màn chờ | none | TBD (draft) |
| empty | Bấm chuông, chưa có thông báo | Bảng với "Chưa có thông báo", chuông không có chấm đỏ | Đóng bảng | TBD (draft) |
| empty | Mốc sự kiện thiếu hoặc sai | Ba ô 00, ẩn "Coming soon", ngày sự kiện "—" | Dùng trang bình thường | TBD (draft) |
| error | Không xác minh được phiên | Không hiện trang; chuyển về màn Login | Đăng nhập lại | TBD (draft) |
| saving | Đang đổi ngôn ngữ hoặc đang đăng xuất | Menu đóng, trang làm mới | none | TBD (draft) |
| success | Đổi ngôn ngữ xong | Chuỗi đổi sang ngôn ngữ mới | Tiếp tục dùng trang | TBD (draft) |
| ended | Đã tới mốc sự kiện (tab đang mở) | Ba ô về 00, ẩn "Coming soon" | Dùng trang bình thường | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Mục Admin Dashboard chỉ dành cho người dùng có vai trò admin | auth | E10 | Người dùng là admin | Người dùng thường | Ẩn mục không thay cho việc chặn truy cập; người không phải admin mở thẳng `/admin` bị chặn phía máy chủ và chuyển về `/` |
| "Coming soon" chỉ hiện trước mốc sự kiện | configuration | E12 | Mốc hợp lệ và chưa tới | Đã tới mốc, hoặc mốc thiếu/sai | Mốc lấy từ biến cấu hình sự kiện |

## 8. Navigation

> **D3 — the DRY statement that MUST appear verbatim in the template and the contract:**
>
> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`.
> It is not a second source of truth. Every row here MUST be derivable from a path in
> `screen-flow.md`; every path in `screen-flow.md` touching this SCR### MUST appear here.
> Two-way consistency is a reviewer rule (`screen.nav_flow_skew`), not a Python check.
> `## 4. User Actions § Happy Path` narrative keeps its v27 scope rule unchanged: **prose still
> must not narrate cross-screen navigation**; only the § Exits *table* may name destinations.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR001_Login | Đăng nhập Google thành công | Có phiên hợp lệ | TBD (draft) |
| SCR001_Login | Mở màn Login khi đã đăng nhập | Có phiên hợp lệ | TBD (draft) |
| external | Gõ địa chỉ trang chủ | Có phiên hợp lệ (khách bị chuyển về SCR001_Login) | TBD (draft) |
| Các trang giữ chỗ | Bấm logo hoặc About SAA 2025 trong header, footer dùng lại | Có phiên hợp lệ | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Awards Information | E03, E15, E19, E20, E24 | — | Trang giữ chỗ `/awards-information` (kèm `#<slug>` từ thẻ) | redirect | TBD (draft) |
| Mở Sun* Kudos | E03, E16, E22, E24 | — | Trang giữ chỗ `/sun-kudos` | redirect | TBD (draft) |
| Mở Tiêu chuẩn chung | E24 | — | Trang giữ chỗ `/standards` | redirect | TBD (draft) |
| Mở Profile | E08 | — | Trang giữ chỗ `/profile` | redirect | TBD (draft) |
| Mở Admin Dashboard | E10 | Là admin (người khác mở `/admin` bị chuyển về `/`) | Trang giữ chỗ `/admin` | redirect | TBD (draft) |
| Đăng xuất | E09 | — | SCR001_Login | redirect | TBD (draft) |
| Đổi ngôn ngữ | E05 | — | (stays on screen) | làm mới trang | TBD (draft) |

Các trang giữ chỗ chưa có đặc tả màn riêng và chưa có trong `screen-flow.md`; chúng dùng lại header và footer này và chỉ dành cho người đã đăng nhập.

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Nút biểu tượng (chuông, tài khoản, ngôn ngữ, widget) có nhãn đọc được; logo có chữ thay thế; mục đang chọn đánh dấu trang hiện tại |
| Keyboard navigation | [EXPECTED] | Mọi liên kết và nút focus được bằng Tab; Enter hoặc Space mở dropdown; Escape đóng; focus hiển thị rõ |
| Focus management | [EXPECTED] | Đóng menu thì trả focus về nút đã mở nó |
| Screen reader compatibility | [EXPECTED] | Dùng vùng chuẩn (header, main, footer); thẻ giải thưởng đọc thành một liên kết có tên hạng mục |
| Error announcement | [EXPECTED] | Chưa có thông báo lỗi trên màn này; nếu có thì dùng vùng thông báo tự đọc |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop | R4 / E19 | Lưới giải thưởng 3 cột | TBD (draft) |
| tablet, mobile | R4 / E19 | Lưới giải thưởng 2 cột | TBD (draft) |
| mọi kích thước | R1 | Header cố định khi cuộn | TBD (draft) |
| mọi kích thước | R7 | Nút widget cố định ở góc phải dưới | TBD (draft) |
| màn nhỏ | R2, R3 | Chữ tự xuống dòng và co lại; các dòng thông tin sự kiện xuống hàng, không tràn | TBD (draft) |
