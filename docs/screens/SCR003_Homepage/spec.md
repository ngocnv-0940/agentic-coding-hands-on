---
status: draft
authored_by: takumi
fcode: F003
created: 2026-10-08
lang: vi
---

# SCR003_Homepage — Screen Spec

**Screen**: SCR003_Homepage: Homepage SAA
**Feature**: F003_Homepage
**Type**: atomic
**Route**: /
**Generated**: 2026-10-08

## 1. Overview

**Purpose:** Người dùng đã đăng nhập dùng trang này làm cửa vào chính của ứng dụng: xem chủ đề ROOT FURTHER, đếm ngược tới sự kiện Sun* Annual Awards 2025, các hạng mục giải thưởng và phong trào Sun* Kudos, rồi đi tới các trang liên quan.
**Actors:** Người dùng đã đăng nhập, Quản trị viên
**Entry Conditions:** Có phiên đăng nhập hợp lệ (proxy chặn khách bằng 307, layout `(main)` kiểm lại); khách bị chuyển về màn Login. Người dùng tới đây ngay sau khi đăng nhập hoặc khi mở `/login` lúc đã đăng nhập.
**Exit Conditions:** Người dùng sang trang Awards Information, Sun* Kudos, Tiêu chuẩn chung, Profile, Admin Dashboard (Awards Information là SCR004_AwardsInformation, các trang còn lại hiện là trang giữ chỗ) hoặc đăng xuất về màn Login.

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
| R1 | Header | sticky | no | `SiteHeader`, `HeaderNav`, `HeaderIconButton`, `SiteHeaderContainer` |
| R2 | Hero (key visual, đếm ngược, thông tin sự kiện, CTA) | static | yes | `HomeHero`, `CountdownContainer` / `CountdownDisplay`, `EventInfo`, `HeroCtaLinks` |
| R3 | Root Further content | static | yes | `RootFurtherContent` |
| R4 | Awards | static | yes | `AwardsSection`, `AwardCard` |
| R5 | Sun* Kudos promo | static | yes | `KudosPromo` (`variant` mặc định) |
| R6 | Footer | static | yes | `SiteFooter`, `SiteFooterContainer` |
| R7 | Widget button | fixed-bottom-right | no | `WidgetButton` |
| R8 | Lớp nổi: bảng thông báo, menu ngôn ngữ, menu tài khoản | floating (dưới header) | no | `NotificationsMenu`, `AccountMenu`, `LanguageSelectorContainer` |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo Sun* Annual Awards (R1) | image | — | Hiển thị, có chữ thay thế | Always | Cuộn lên đầu trang | static | 64x60 | — | — |
| E02 | About SAA 2025 (mục đang chọn trên `/`; mục đang chọn theo trang hiện tại) | link | — | Tô nổi, gạch chân | Conditional (từ 1024px) | Cuộn lên đầu trang | static | — | — | — |
| E03 | Awards Information, Sun* Kudos (hai mục điều hướng) | link | — | Chữ thường; hover tô sáng | Conditional (từ 1024px) | Mở trang tương ứng | static | — | — | — |
| E04 | Chuông thông báo | button | — | Không có chấm đỏ | Always | Mở bảng thông báo | static | 40x40 | — | — |
| E05 | Bộ chọn ngôn ngữ (VN/EN) | button | — | VN | Always | Mở menu chọn ngôn ngữ | cookie ngôn ngữ | cờ + mã | — | F002_Localization |
| E06 | Biểu tượng tài khoản | button | — | Đóng menu | Always | Mở menu tài khoản | static | 40x40 | — | — |
| E07 | Bảng thông báo | region label | — | Đóng | Always | — | static | — | "Chưa có thông báo" | — |
| E08 | Profile (trong menu) | link | — | Menu đóng | Always | Mở trang Profile | static | — | — | — |
| E09 | Sign out (trong menu) | button | — | Menu đóng | Always | Đăng xuất | static | — | — | F001_Auth |
| E10 | Admin Dashboard (trong menu) | link | — | Menu đóng | Conditional | Mở trang Admin | computed (vai trò) | — | hidden | — |
| E11 | Hình hero ROOT FURTHER | image | — | Hiển thị | Always | — | static | phủ toàn rộng, lớp phủ tối | — | — |
| E12 | Dòng "Coming soon" | display field | — | Hiển thị | Conditional | — | computed (EVENT_START_AT) | raw | hidden | — |
| E13 | Đồng hồ đếm ngược (DAYS, HOURS, MINUTES) | display field | — | Số còn lại tới mốc | Always | — | computed (EVENT_START_AT) | hai chữ số, đệm số 0 | 00 | — |
| E14 | Thông tin sự kiện (ngày, địa điểm, Livestream) | display field | — | Hiển thị | Always | — | computed (EVENT_START_AT) và static | ngày `dd/MM/yyyy` theo Asia/Ho_Chi_Minh, không hiện giờ | dash ("—") | — |
| E15 | Nút ABOUT AWARDS | button | — | Nền vàng | Always | Mở trang Awards Information | static | — | — | — |
| E16 | Nút ABOUT KUDOS | button | — | Viền | Always | Mở trang Sun* Kudos | static | — | — | — |
| E17 | Nội dung Root Further | display field | — | Hiển thị | Always | — | static | nhiều đoạn, có câu trích | — | — |
| E18 | Tiêu đề mục giải thưởng ("Sun* annual awards 2025", "Hệ thống giải thưởng", mô tả phụ) | display field | — | Hiển thị | Always | — | static | — | — | — |
| E19 | Thẻ giải thưởng (6 thẻ: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) | link | — | Hiển thị đủ 6 | Always | Mở trang hạng mục | static | ảnh vuông, tên, mô tả cắt 2 dòng | — | — |
| E20 | Liên kết "Chi tiết" của thẻ | link | — | Hiển thị | Always | Mở trang hạng mục | static | kèm biểu tượng | — | — |
| E21 | Khối Sun* Kudos (nhãn "Phong trào ghi nhận", tiêu đề, mô tả, ảnh) | display field | — | Hiển thị | Always | — | static | — | — | — |
| E22 | Nút "Chi tiết" của Kudos | button | — | Hiển thị | Always | Mở trang Sun* Kudos | static | kèm biểu tượng | — | — |
| E23 | Nút widget (viên thuốc 105x64, nền vàng) | button | — | Hiển thị | Always | Chưa có hành động | static | bút chì, "/", biểu tượng SAA | — | — |
| E24 | Footer: logo và liên kết (About SAA 2025, Awards Information, Sun* Kudos, Tiêu chuẩn chung) | link | — | Hiển thị | Always | Mở trang tương ứng; logo về đầu trang | static | — | — | — |
| E25 | Dòng bản quyền | display field | — | "Bản quyền thuộc về Sun* © 2025" | Always | — | static | — | — | — |

Mô tả E19 lấy từ từ điển trang chủ (`lib/i18n/dictionary-home-*.ts`, khoá `home.award.<slug>.description`); slug (`lib/awards/award-categories.ts:1-8`): `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`. Bản tiếng Anh của mọi chuỗi do nhóm tự soạn.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Cuộn lên đầu trang | E01, E02, E24 (logo) | click | — | Trang cuộn lên đầu | `app/(main)/_behavior/use-site-navigation.ts:18-27` |
| Mở/đóng bảng thông báo | E04 | click, Enter, Space | — | Bảng E07 mở hoặc đóng | `app/(main)/_behavior/notifications-menu.tsx:13-26`, `app/(main)/_behavior/use-dropdown-menu.ts:26-64` |
| Mở/đóng menu ngôn ngữ | E05 | click, Enter, Space | — | Menu hai mục VN/EN mở hoặc đóng | `app/login/language-selector-container.tsx` (F002) |
| Đổi ngôn ngữ | E05 | chọn một mục | — | Toàn bộ chuỗi đổi, lựa chọn được nhớ | `lib/i18n/set-locale-action.ts` (F002) |
| Mở/đóng menu tài khoản | E06 | click, Enter, Space | — | Menu E08, E09, E10 mở hoặc đóng | `app/(main)/_behavior/account-menu.tsx:15-48` |
| Đóng menu đang mở | R8 | click ra ngoài, Escape | Có menu hoặc bảng đang mở | Lớp nổi đóng | `app/(main)/_behavior/use-dropdown-menu.ts:34-50` |
| Đăng xuất | E09 | click | — | Gửi yêu cầu đăng xuất | `app/(main)/_behavior/account-menu.tsx:33-45`, `app/auth/logout/route.ts` |
| Nâng thẻ khi rê chuột | E19 | hover | — | Thẻ nhô nhẹ, viền sáng | `app/(main)/_components/award-card.tsx:13` |

### Happy Path

1. Người dùng mở trang và thấy hero ROOT FURTHER, đồng hồ đếm ngược ở R2.
2. Người dùng cuộn xuống đọc R3 rồi xem lưới giải thưởng ở R4; header vẫn cố định.
3. Người dùng bấm tiêu đề một thẻ giải thưởng (E19) để mở trang hạng mục.
4. Người dùng bấm logo (E01) để quay về đầu trang.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Chưa tới mốc sự kiện | Hiện "Coming soon" và số còn lại | `lib/event/event-start-config.ts:72-82` |
| Bước 1 | Đã tới mốc hoặc cấu hình mốc sai | Ba ô là 00, ẩn "Coming soon" | `lib/event/event-start-config.ts:41-43,72-76` |
| Mở menu tài khoản | Người dùng là admin | Thêm mục Admin Dashboard | `app/(main)/_behavior/account-menu.tsx:27-31` |

### Interaction Notes

- **Bấm ra ngoài hoặc nhấn Escape thì mọi menu và bảng đóng lại** — source: `app/(main)/_behavior/use-dropdown-menu.ts:34-50`
- **Bấm vào ảnh, tên hay "Chi tiết" của một thẻ cho cùng kết quả** — source: `app/(main)/_components/award-card.tsx:10-14`
- **Mở bảng thông báo khi đang mở menu tài khoản thì menu kia đóng** — source: `app/(main)/_behavior/use-dropdown-menu.ts:36-38` (bấm ngoài vùng bao của menu này thì menu kia đóng)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Trang đang dựng | Trang được dựng sẵn, đồng hồ có sẵn giá trị đầu tiên, không có màn chờ | none | `app/(main)/page.tsx:12-18`, `lib/event/use-countdown.ts:15-17` |
| empty | Bấm chuông, chưa có thông báo | Bảng với "Chưa có thông báo", chuông không có chấm đỏ | Đóng bảng | `app/(main)/_behavior/notifications-menu.tsx:19-24` |
| empty | Mốc sự kiện thiếu hoặc sai | Ba ô 00, ẩn "Coming soon", ngày sự kiện "—" | Dùng trang bình thường | `lib/event/event-start-config.ts:41-43,65-67,72-76` |
| error | Không xác minh được phiên | Không hiện trang; chuyển về màn Login | Đăng nhập lại | `app/(main)/layout.tsx:32-33`, `lib/supabase/proxy.ts:82` |
| saving | Đang đổi ngôn ngữ hoặc đang đăng xuất | Menu đóng, trang làm mới | none | `app/(main)/_behavior/account-menu.tsx:33-45` |
| success | Đổi ngôn ngữ xong | Chuỗi đổi sang ngôn ngữ mới | Tiếp tục dùng trang | `lib/i18n/set-locale-action.ts` |
| ended | Đã tới mốc sự kiện (tab đang mở) | Ba ô về 00, ẩn "Coming soon" | Dùng trang bình thường | `lib/event/use-countdown.ts:23-41` |

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
| SCR001_Login | Đăng nhập Google thành công | Có phiên hợp lệ | `app/auth/callback/route.ts:4,40` |
| SCR001_Login | Mở màn Login khi đã đăng nhập | Có phiên hợp lệ | `lib/supabase/proxy.ts:83` |
| external | Gõ địa chỉ trang chủ | Có phiên hợp lệ (khách bị chuyển về SCR001_Login) | `lib/supabase/proxy.ts:82`, `app/(main)/layout.tsx:32-33` |
| Các trang giữ chỗ | Bấm logo hoặc About SAA 2025 trong header, footer dùng lại | Có phiên hợp lệ | `app/(main)/_behavior/coming-soon-content.tsx:22-28`, `app/(main)/layout.tsx:27-76` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Awards Information | E03, E15, E19, E20, E24 | — | SCR004_AwardsInformation (`/awards-information`, kèm `#<slug>` từ thẻ) | redirect | `app/(main)/_wiring/build-home-screen-props.ts:6,32`, `app/(main)/_components/award-card.tsx:10-14`, `lib/awards/award-categories.ts:27-29` |
| Mở Sun* Kudos | E03, E16, E22, E24 | — | Trang giữ chỗ `/sun-kudos` | redirect | `app/(main)/_wiring/build-home-screen-props.ts:7,33,53-60` |
| Mở Tiêu chuẩn chung | E24 | — | Trang giữ chỗ `/standards` | redirect | `app/(main)/layout.tsx:63-70` |
| Mở Profile | E08 | — | Trang giữ chỗ `/profile` | redirect | `app/(main)/_behavior/account-menu.tsx:24-26` |
| Mở Admin Dashboard | E10 | Là admin (người khác mở `/admin` bị chuyển về `/`) | Trang giữ chỗ `/admin` | redirect | `app/(main)/_behavior/account-menu.tsx:27-31`, `lib/supabase/proxy.ts:85-87` |
| Đăng xuất | E09 | — | SCR001_Login | redirect | `app/(main)/_behavior/account-menu.tsx:33`, `app/auth/logout/route.ts` |
| Đổi ngôn ngữ | E05 | — | (stays on screen) | làm mới trang | `app/login/language-selector-container.tsx`, `lib/i18n/set-locale-action.ts` |

Các trang giữ chỗ (trừ `/awards-information`, đã có SCR004_AwardsInformation) chưa có đặc tả màn riêng; chúng dùng lại header và footer này (qua layout `app/(main)/layout.tsx`) và chỉ dành cho người đã đăng nhập.

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
| desktop (từ 1024px) | R4 / E19 | Lưới giải thưởng 3 cột | `app/(main)/_components/awards-section.tsx:30-33` |
| tablet, mobile (dưới 1024px) | R4 / E19 | Lưới giải thưởng 2 cột | `app/(main)/_components/awards-section.tsx:30-33` |
| từ 1024px | R1 / E02, E03 | Ba mục điều hướng hiện trong header | `app/(main)/_components/header-nav.tsx:16` |
| dưới 1024px | R1 / E02, E03 | Header không có mục điều hướng (`hidden lg:flex`); logo, ngôn ngữ, chuông, tài khoản vẫn hiện; footer vẫn đủ liên kết | `app/(main)/_components/header-nav.tsx:16` |
| mọi kích thước | R1 | Header cố định khi cuộn | `app/(main)/_components/site-header.tsx:18` |
| mọi kích thước | R7 | Nút widget cố định ở góc phải dưới | `app/(main)/_components/widget-button.tsx:12` |
| màn nhỏ | R2, R3 | Chữ tự xuống dòng và co lại; các dòng thông tin sự kiện xuống hàng, không tràn | `app/(main)/_components/home-screen.tsx:15,33` |
