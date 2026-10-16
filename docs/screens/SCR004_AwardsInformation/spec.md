---
status: draft
authored_by: takumi
fcode: F004
created: 2026-10-13
lang: vi
---

# SCR004_AwardsInformation — Screen Spec

**Screen**: SCR004_AwardsInformation: Hệ thống giải (Awards Information)
**Feature**: F004_AwardsInformation
**Type**: composite
**Route**: /awards-information
**Generated**: 2026-10-13

## 1. Overview

**Purpose:** Người dùng đã đăng nhập đọc hệ thống giải SAA 2025: 6 hạng mục với ảnh, mô tả, số lượng và giá trị giải, nhảy nhanh giữa các hạng mục bằng menu, rồi sang phong trào Sun* Kudos.
**Actors:** Người dùng đã đăng nhập
**Entry Conditions:** Có phiên đăng nhập hợp lệ; khách bị chuyển về màn Login. Người dùng tới từ mục "Award Information" trên header, từ thẻ giải ở trang chủ (kèm `#<slug>`) hoặc từ liên kết ở footer.
**Exit Conditions:** Người dùng sang Sun* Kudos qua nút "Chi tiết", hoặc sang trang khác qua header và footer.

## 2. Screen Layout

### Layout Sketch

Header cố định (dùng chung) ở trên cùng. Bên dưới là hero keyvisual rồi khối tiêu đề. Phần thân gồm menu hạng mục bên trái (desktop từ 1024px, dính dưới header) và cột 6 thẻ giải ở giữa; mỗi thẻ có ảnh một bên, nội dung bên kia; từ 768px ảnh so le (thẻ 1, 3, 5 ảnh bên trái; thẻ 2, 4, 6 ảnh bên phải, như Figma D.2, D.4, D.6). Cuối trang là khối Sun* Kudos (`KudosPromo variant="wide"`) rồi footer dùng chung. Dưới 1024px menu thành một hàng tab cuộn ngang ghim phía trên các thẻ; dưới 768px mỗi thẻ xếp dọc (ảnh trên, nội dung dưới; D009, Figma chỉ có desktop).

```
┌──────────────────────────────────────────────────────┐
│ R1: Header (fixed-top, dùng chung)                   │
├──────────────────────────────────────────────────────┤
│ R2: Keyvisual hero (static)                          │
├──────────────────────────────────────────────────────┤
│ R3: Tiêu đề hệ thống giải (static)                   │
├───────────────┬──────────────────────────────────────┤
│ R4: Menu      │ R5: Thẻ giải D.1 … D.6 (scrollable)  │
│ (sticky)      │  [ảnh 336x336] [tên, mô tả,          │
│ Top Talent    │   (so le từ 768px) số lượng, giá trị]│
│ Top Project   │                                      │
│ …  MVP        │                                      │
├───────────────┴──────────────────────────────────────┤
│ R6: Khối Sun* Kudos (static)                         │
├──────────────────────────────────────────────────────┤
│ R7: Footer (dùng chung)                              │
└──────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | Header dùng chung của layout `(main)` |
| R2 | Keyvisual | static | no | `AwardsInformationHero` (ảnh `/images/homepage/keyvisual.png`, `object-cover`) |
| R3 | Tiêu đề hệ thống giải | static | no | `AwardsInformationHero` (dòng phụ `awards-caption`, `h1`) |
| R4 | Menu hạng mục | sticky | no | `AwardsCategoryMenu` (qua `AwardsCategoryMenuContainer`) |
| R5 | Danh sách thẻ giải | static | yes | 6 `AwardDetailCard` |
| R6 | Khối Sun* Kudos | static | no | `KudosPromo variant="wide"` |
| R7 | Footer | static | no | Footer dùng chung của layout `(main)` |

## 3. UI Elements

Văn bản tiếng Việt nguyên văn từ Figma/MoMorph (screen `zFYDgyj_pD`, node `313:8436`); phần mô tả dài của 6 giải: nguyên văn từ node Figma D.1.2 tới D.6, không tự bịa. Cột `Source` ghi tệp (thư mục `app/(main)/_components/awards-information/`, `_behavior/`, `_wiring/`) và dòng; `Cross-ref` ghi mã mục của CSV MoMorph.

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Keyvisual "ROOT FURTHER – Sun* Annual Award 2025" (ảnh nền 1200x871, cover, căn giữa); alt "Keyvisual Sun* Annual Award 2025" | image | — | Hiện | Always | — (trang trí, không bấm) | `awards-information-hero.tsx:12-60` | raw | — | MoMorph 3 (`313:8437`) |
| E02 | Tiêu đề phụ "Sun* Annual Awards 2025" (`awards.hero.caption`) | display field | — | Hiện | Always | — | `awards-information-hero.tsx:12-60` | raw | — | MoMorph A (`313:8453`) |
| E03 | Tiêu đề chính "Hệ thống giải thưởng SAA 2025" (lớn, vàng) | display field | — | Hiện | Always | — | `awards-information-hero.tsx:12-60` | raw | — | MoMorph A (`313:8453`) |
| E04 | Menu hạng mục (vùng chứa 6 mục) | list | — | Mục 1 active | Always | — | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C (`313:8459`) |
| E05 | Mục "Top Talent" (có biểu tượng đầu dòng) | link | — | Active mặc định | Always | Cuộn tới E12, đặt active | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C.1 (`313:8460`) |
| E06 | Mục "Top Project" | link | — | Không active | Always | Cuộn tới E13, đặt active | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C.2 (`313:8461`) |
| E07 | Mục "Top Project Leader" | link | — | Không active | Always | Cuộn tới E14, đặt active | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C.3 (`313:8462`) |
| E08 | Mục "Best Manager" | link | — | Không active | Always | Cuộn tới E15, đặt active | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C.4 (`313:8463`) |
| E09 | Mục "Signature 2025 - Creator" | link | — | Không active | Always | Cuộn tới E16, đặt active | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C.5 (`313:8464`) |
| E10 | Mục "MVP" | link | — | Không active | Always | Cuộn tới E17, đặt active | `awards-category-menu.tsx:21-53` | raw | — | MoMorph C.6 (`313:8465`) |
| E11 | Vùng danh sách giải thưởng (chứa 6 thẻ) | region label | — | Hiện | Always | — | `awards-information-screen.tsx:22-27` | raw | — | MoMorph B (`313:8458`), 3.2 (`313:8466`) |
| E12 | Thẻ Top Talent: ảnh 336x336, tên "Top Talent", mô tả, "Số lượng giải thưởng: 10 Cá nhân", "Giá trị giải thưởng: 7.000.000 VNĐ cho mỗi giải thưởng" | display field | — | Hiện | Always | — | `award-detail-card.tsx:57-115`, `award-details.ts:17-63` | raw | — | MoMorph D.1 (`313:8467`), D.1.1, D.1.2 |
| E13 | Thẻ Top Project: ảnh, tên, mô tả, số lượng "02 Tập thể", giá trị "15.000.000 VNĐ mỗi giải" | display field | — | Hiện | Always | — | `award-detail-card.tsx:57-115`, `award-details.ts:17-63` | raw | — | MoMorph D.2 (`313:8468`) |
| E14 | Thẻ Top Project Leader: ảnh, tên, mô tả, "03 Cá nhân", "7.000.000 VNĐ" | display field | — | Hiện | Always | — | `award-detail-card.tsx:57-115`, `award-details.ts:17-63` | raw | — | MoMorph D.3 (`313:8469`) |
| E15 | Thẻ Best Manager: ảnh, tên, mô tả, "01 Cá nhân", "10.000.000 VNĐ" | display field | — | Hiện | Always | — | `award-detail-card.tsx:57-115`, `award-details.ts:17-63` | raw | — | MoMorph D.4 (`313:8470`) |
| E16 | Thẻ Signature 2025 - Creator: ảnh, tên, mô tả, "01", đơn vị "Cá nhân hoặc tập thể", hai giá trị "5.000.000 VNĐ" (cho giải cá nhân) và "8.000.000 VNĐ" (cho giải tập thể), ngăn bằng dòng "Hoặc" | display field | — | Hiện | Always | — | `award-detail-card.tsx:57-115`, `award-details.ts:17-63` | raw | — | MoMorph D.5 (`313:8471`) |
| E17 | Thẻ MVP (Most Valuable Person): ảnh, tên "MVP (Most Valuable Person)", mô tả, "01", "15.000.000 VNĐ" | display field | — | Hiện | Always | — | `award-detail-card.tsx:57-115`, `award-details.ts:17-63` | raw | — | MoMorph D.6 (`313:8510`) |
| E18 | Khối Sun* Kudos: nhãn "Phong trào ghi nhận", tiêu đề "Sun* Kudos", mô tả, hình minh hoạ (phải); dùng `KudosPromo variant="wide"` (khối 1152px, nội dung tối đa 553px) | display field | — | Hiện | Always | — | `kudos-promo.tsx:23-68` | raw | — | MoMorph D1 (`335:12023`), D2 |
| E19 | Nút "Chi tiết" (liên kết dạng chữ) | link | — | Enabled | Always | Mở trang Sun* Kudos | `kudos-promo.tsx:23-68` | raw | — | MoMorph D2.1 (`I335:12023;313:8426`) |

## 4. User Actions

> **Scope:** within-screen interactions only. Điều hướng sang màn khác nằm ở `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn hạng mục | E05–E10 | click | — | Cuộn mượt tới thẻ tương ứng (E12–E17), mục vừa bấm active (vàng, gạch chân), mục trước mất active | `use-award-category-spy.ts:61-69` |
| Rê chuột lên mục menu | E05–E10 | hover | — | Mục sáng lên (nền `white/10`, chữ vàng) | `awards-category-menu.tsx:18` |
| Theo dõi cuộn | E04, E12–E17 | scroll | Người dùng tự cuộn | Mục menu của thẻ đang xem trở thành active | `use-award-category-spy.ts:27-38,93-96` |
| Mở thẳng hạng mục | E04, E12–E17 | tải trang với `#<slug>` | Slug hợp lệ | Cuộn tới thẻ đó và đặt mục active tương ứng | `use-award-category-spy.ts:84-91` |

### Happy Path

1. Người dùng mở trang và thấy tiêu đề (R3) cùng menu (R4) với "Top Talent" active.
2. Người dùng cuộn xuống R5; mục menu của thẻ đang xem được tô vàng theo.
3. Người dùng bấm "MVP" trong R4; trang cuộn mượt tới thẻ MVP và chỉ "MVP" active.
4. Người dùng cuộn tới R6, đọc khối Sun* Kudos rồi bấm "Chi tiết".

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở trang | `#<slug>` hợp lệ | Cuộn tới thẻ đó, mục tương ứng active | `use-award-category-spy.ts:84-91` |
| Mở trang | `#` không khớp hạng mục | Trang ở đầu, "Top Talent" active, không lỗi | `award-hash.ts:8-18` |
| Bấm mục lúc đang cuộn mượt | Cuộn chưa xong | Mục vừa bấm giữ active tới khi cuộn xong; khoá nhả khi thẻ đích tới đường chuẩn, tối đa 1500ms | `award-scroll-lock.ts:66-128` |
| Cuộn tay lúc đang cuộn mượt | Lăn chuột, chạm, phím cuộn hoặc nhấn thanh cuộn (trừ cử chỉ ngang trên hàng tab dưới 1024px) | Khoá nhả ngay, mục active theo vị trí người dùng | `use-award-category-spy.ts:98-124`, `award-scroll-lock.ts:138-154` |
| Bấm mục kèm Ctrl, Meta, Shift, Alt hoặc nút không phải chuột chính | Mở tab mới, cửa sổ mới… | Không chặn: trình duyệt tự theo liên kết, trang này không cuộn | `award-scroll-lock.ts:132-136` |

### Interaction Notes

- **Cuộn tới thẻ không bị header cố định che mất tiêu đề thẻ** — source: `award-detail-card.tsx:66` (`scroll-mt-[152px]`, `lg:scroll-mt-28`)
- **Menu desktop dính dưới header trong lúc R5 cuộn** — source: `awards-category-menu.tsx:28` (`lg:top-24`); `prefers-reduced-motion` thì cuộn tức thì (`use-award-category-spy.ts:20-25`)
- **Bấm mục ghi `#<slug>` vào thanh địa chỉ bằng `history.replaceState`, không thêm mục lịch sử; cuộn tay không đổi URL (D007)** — source: `use-award-category-spy.ts:68`

## 5. UI States

> Trang gần như tĩnh (dữ liệu giải là hằng trong mã), không có lời gọi dữ liệu riêng.

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Vỏ `(main)` đang xác thực phiên | Nền xanh đậm trống (phần dự phòng của vỏ dùng chung), chưa có nội dung | none | `awards-information/page.tsx:14-16` |
| default | Đã xác thực | Mục đầu active, đủ 6 thẻ và khối Sun* Kudos | Mọi hành động ở § 4 | `awards-information-screen.tsx:16-37` |
| empty | — | N/A — 6 thẻ là dữ liệu cố định, không có trạng thái rỗng | — | `lib/awards/award-details.ts:17-63` |
| error | `#` không khớp hạng mục | Không báo lỗi; trang ở đầu, mục đầu active | Dùng menu bình thường | `award-hash.ts:8-18` |
| error | Nút "Chi tiết" tới trang không có | Trang 404 mặc định của ứng dụng | Quay lại | `build-kudos-promo-props.ts:5` |
| saving | — | N/A — trang không ghi dữ liệu | — | `awards-information/page.tsx:20-33` |
| success | Bấm mục menu | Mục đó active, trang cuộn tới thẻ | Tiếp tục cuộn hoặc chọn mục khác | `use-award-category-spy.ts:61-69` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E04 | Hạng mục trong `#` phải là một trong 6 hạng mục có sẵn | Không hiện thông báo; trang ở đầu và mục đầu active | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Cửa sổ từ 1024px trở lên | responsive | E04, E05–E10 | Menu dọc bên trái, dính dưới header | Dưới 1024px | Theo clarifications.md (2026-10-13) |
| Cửa sổ dưới 1024px | responsive | E04, E05–E10 | Một hàng tab cuộn ngang ghim phía trên các thẻ, cùng kiểu active | Từ 1024px trở lên | Figma chỉ có desktop; quyết định ở clarifications.md |
| Cửa sổ từ 768px trở lên | responsive | E12–E17 | Ảnh và nội dung nằm ngang, so le trái/phải | Dưới 768px (xếp dọc) | D009; Figma chỉ có desktop |
| Ngôn ngữ người dùng chọn (vi hoặc en) | configuration | E02–E03, E05–E10, E12–E19 | Chuỗi theo ngôn ngữ đang chọn | — | Bản vi nguyên văn Figma, bản en do nhóm soạn |

## 8. Navigation

> `## 8. Navigation` là phép chiếu theo màn của luồng màn hình (`screen-flow.md`), không phải nguồn thứ hai; hàng nào chưa có trong `screen-flow.md` ghi `TBD (draft)`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR003_Homepage | Bấm một thẻ giải (mở `/awards-information#<slug>`) hoặc nút "ABOUT AWARDS" | Đã đăng nhập | `build-home-screen-props.ts:6`, `lib/awards/award-categories.ts:27-29` |
| Header (vỏ `(main)`) | Bấm mục "Award Information" | Đã đăng nhập | `app/(main)/layout.tsx` |
| Footer (vỏ `(main)`) | Bấm liên kết "Award Information" | Đã đăng nhập | `app/(main)/layout.tsx` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Sun* Kudos | E19 | — | Sun* Kudos (`/sun-kudos`, hiện là trang giữ chỗ; mã SCR### TBD (draft)) | redirect cùng tab | `build-kudos-promo-props.ts:5,15` |
| Dùng header, footer | Header, footer | — | SCR003_Homepage, `/sun-kudos`, `/standards`, `/login` (khi đăng xuất) | redirect | `app/(main)/layout.tsx` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Menu là vùng điều hướng có nhãn; mục active đánh dấu `aria-current`; ảnh keyvisual có alt "Keyvisual Sun* Annual Award 2025" |
| Keyboard navigation | [EXPECTED] | Mục menu và "Chi tiết" tới được bằng Tab, kích hoạt bằng Enter |
| Focus management | [EXPECTED] | Sau khi chọn mục, tiêu điểm vẫn ở mục menu; không bẫy tiêu điểm |
| Screen reader compatibility | [EXPECTED] | Mỗi thẻ là một vùng có tên hạng mục |
| Error announcement | [EXPECTED] | Không có thông báo lỗi nào để đọc ra |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop (từ 1024px) | R4 | Menu dọc bên trái, dính dưới header | `awards-category-menu.tsx:28` |
| dưới 1024px | R4 | Hàng tab cuộn ngang ghim phía trên các thẻ, cùng kiểu active | `awards-category-menu.tsx:28`, `use-keep-active-tab-in-view.ts:12-23` |
| dưới 768px | R5 (E12–E17) | Thẻ xếp dọc: ảnh trên, nội dung dưới (D009) | `award-detail-card.tsx:68` |
| từ 768px | R5 (E12–E17) | Ảnh và nội dung nằm ngang; thẻ 1, 3, 5 ảnh bên trái, thẻ 2, 4, 6 ảnh bên phải (`md:flex-row-reverse`) | `award-detail-card.tsx:59,68` |
| mọi cỡ | E01 | Ảnh nền co giãn phủ kín, cắt giữa | `awards-information-hero.tsx:14-26` |
