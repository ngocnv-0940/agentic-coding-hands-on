---
status: draft
authored_by: takumi
created: 2026-10-13
lang: vi
---

# SCR-awards-information — Screen Spec

**Screen**: SCR-awards-information: Hệ thống giải (Awards Information)
**Feature**: awards-information (mã F### cấp lúc promote)
**Type**: composite
**Route**: /awards-information
**Generated**: 2026-10-13

## 1. Overview

**Purpose:** Người dùng đã đăng nhập đọc hệ thống giải SAA 2025: 6 hạng mục với ảnh, mô tả, số lượng và giá trị giải, nhảy nhanh giữa các hạng mục bằng menu, rồi sang phong trào Sun* Kudos.
**Actors:** Người dùng đã đăng nhập
**Entry Conditions:** Có phiên đăng nhập hợp lệ; khách bị chuyển về màn Login. Người dùng tới từ mục "Awards Information" trên header, từ thẻ giải ở trang chủ (kèm `#<slug>`) hoặc từ liên kết ở footer.
**Exit Conditions:** Người dùng sang Sun* Kudos qua nút "Chi tiết", hoặc sang trang khác qua header và footer.

## 2. Screen Layout

### Layout Sketch

Header cố định (dùng chung) ở trên cùng. Bên dưới là hero keyvisual rồi khối tiêu đề. Phần thân gồm menu hạng mục bên trái (desktop từ 1024px, dính dưới header) và cột 6 thẻ giải ở giữa; mỗi thẻ có ảnh bên trái, nội dung bên phải. Cuối trang là khối Sun* Kudos rồi footer dùng chung. Dưới 1024px menu thành một hàng tab cuộn ngang ghim phía trên các thẻ và mỗi thẻ xếp dọc (ảnh trên, nội dung dưới; theo mặc định đề xuất, chưa có Figma).

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
│ Top Talent    │                 số lượng, giá trị]   │
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
| R1 | Header | fixed-top | no | TBD (draft) |
| R2 | Keyvisual | static | no | TBD (draft) |
| R3 | Tiêu đề hệ thống giải | static | no | TBD (draft) |
| R4 | Menu hạng mục | sticky | no | TBD (draft) |
| R5 | Danh sách thẻ giải | static | yes | TBD (draft) |
| R6 | Khối Sun* Kudos | static | no | TBD (draft) |
| R7 | Footer | static | no | TBD (draft) |

## 3. UI Elements

Văn bản tiếng Việt nguyên văn từ Figma/MoMorph (screen `zFYDgyj_pD`, node `313:8436`); phần mô tả dài của 6 giải: nguyên văn từ node Figma D.1.2 tới D.6, không tự bịa. Cột `Source` đều `TBD (draft)`; `Cross-ref` ghi mã mục của CSV MoMorph.

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Keyvisual "ROOT FURTHER – Sun* Annual Award 2025" (ảnh nền 1200x871, cover, căn giữa); alt "Keyvisual Sun* Annual Award 2025" | image | — | Hiện | Always | — (trang trí, không bấm) | TBD (draft) | raw | — | MoMorph 3 (`313:8437`) |
| E02 | Tiêu đề phụ "Sun* annual awards 2025" (nhỏ, nhạt) | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph A (`313:8453`) |
| E03 | Tiêu đề chính "Hệ thống giải thưởng SAA 2025" (lớn, vàng) | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph A (`313:8453`) |
| E04 | Menu hạng mục (vùng chứa 6 mục) | list | — | Mục 1 active | Always | — | TBD (draft) | raw | — | MoMorph C (`313:8459`) |
| E05 | Mục "Top Talent" (có biểu tượng đầu dòng) | link | — | Active mặc định | Always | Cuộn tới E12, đặt active | TBD (draft) | raw | — | MoMorph C.1 (`313:8460`) |
| E06 | Mục "Top Project" | link | — | Không active | Always | Cuộn tới E13, đặt active | TBD (draft) | raw | — | MoMorph C.2 (`313:8461`) |
| E07 | Mục "Top Project Leader" | link | — | Không active | Always | Cuộn tới E14, đặt active | TBD (draft) | raw | — | MoMorph C.3 (`313:8462`) |
| E08 | Mục "Best Manager" | link | — | Không active | Always | Cuộn tới E15, đặt active | TBD (draft) | raw | — | MoMorph C.4 (`313:8463`) |
| E09 | Mục "Signature 2025 - Creator" | link | — | Không active | Always | Cuộn tới E16, đặt active | TBD (draft) | raw | — | MoMorph C.5 (`313:8464`) |
| E10 | Mục "MVP" | link | — | Không active | Always | Cuộn tới E17, đặt active | TBD (draft) | raw | — | MoMorph C.6 (`313:8465`) |
| E11 | Vùng danh sách giải thưởng (chứa 6 thẻ) | region label | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph B (`313:8458`), 3.2 (`313:8466`) |
| E12 | Thẻ Top Talent: ảnh 336x336, tên "Top Talent", mô tả, "Số lượng giải thưởng: 10 Đơn vị", "Giá trị giải thưởng: 7.000.000 VNĐ cho mỗi giải thưởng" | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D.1 (`313:8467`), D.1.1, D.1.2 |
| E13 | Thẻ Top Project: ảnh, tên, mô tả, số lượng "02 Tập thể", giá trị "15.000.000 VNĐ mỗi giải" | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D.2 (`313:8468`) |
| E14 | Thẻ Top Project Leader: ảnh, tên, mô tả, "03 Cá nhân", "7.000.000 VNĐ" | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D.3 (`313:8469`) |
| E15 | Thẻ Best Manager: ảnh, tên, mô tả, "01 Cá nhân", "10.000.000 VNĐ" | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D.4 (`313:8470`) |
| E16 | Thẻ Signature 2025 - Creator: ảnh, tên, mô tả, "01", hai giá trị "5.000.000 VNĐ (cá nhân)" và "8.000.000 VNĐ (tập thể)" | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D.5 (`313:8471`) |
| E17 | Thẻ MVP (Most Valuable Person): ảnh, tên "MVP (Most Valuable Person)", mô tả, "01", "15.000.000 VNĐ" | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D.6 (`313:8510`) |
| E18 | Khối Sun* Kudos: nhãn "Phong trào ghi nhận", tiêu đề "Sun* Kudos", mô tả, hình minh hoạ (phải) | display field | — | Hiện | Always | — | TBD (draft) | raw | — | MoMorph D1 (`335:12023`), D2 |
| E19 | Nút "Chi tiết" (liên kết dạng chữ) | link | — | Enabled | Always | Mở trang Sun* Kudos | TBD (draft) | raw | — | MoMorph D2.1 (`I335:12023;313:8426`) |

## 4. User Actions

> **Scope:** within-screen interactions only. Điều hướng sang màn khác nằm ở `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn hạng mục | E05–E10 | click | — | Cuộn mượt tới thẻ tương ứng (E12–E17), mục vừa bấm active (vàng, gạch chân), mục trước mất active | TBD (draft) |
| Rê chuột lên mục menu | E05–E10 | hover | — | Mục sáng lên (kiểu cụ thể lấy từ Figma khi dựng) | TBD (draft) |
| Theo dõi cuộn | E04, E12–E17 | scroll | Người dùng tự cuộn | Mục menu của thẻ đang xem trở thành active | TBD (draft) |
| Mở thẳng hạng mục | E04, E12–E17 | tải trang với `#<slug>` | Slug hợp lệ | Cuộn tới thẻ đó và đặt mục active tương ứng | TBD (draft) |

### Happy Path

1. Người dùng mở trang và thấy tiêu đề (R3) cùng menu (R4) với "Top Talent" active.
2. Người dùng cuộn xuống R5; mục menu của thẻ đang xem được tô vàng theo.
3. Người dùng bấm "MVP" trong R4; trang cuộn mượt tới thẻ MVP và chỉ "MVP" active.
4. Người dùng cuộn tới R6, đọc khối Sun* Kudos rồi bấm "Chi tiết".

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở trang | `#<slug>` hợp lệ | Cuộn tới thẻ đó, mục tương ứng active | TBD (draft) |
| Mở trang | `#` không khớp hạng mục | Trang ở đầu, "Top Talent" active, không lỗi | TBD (draft) |
| Bấm mục lúc đang cuộn mượt | Cuộn chưa xong | Mục vừa bấm giữ active tới khi cuộn xong | TBD (draft) |

### Interaction Notes

- **Cuộn tới thẻ không bị header cố định che mất tiêu đề thẻ** — source: TBD (draft)
- **Menu desktop dính dưới header trong lúc R5 cuộn** — source: TBD (draft)

## 5. UI States

> Trang gần như tĩnh (dữ liệu giải là hằng trong mã), không có lời gọi dữ liệu riêng.

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Vỏ `(main)` đang xác thực phiên | Nền xanh đậm trống (phần dự phòng của vỏ dùng chung), chưa có nội dung | none | TBD (draft) |
| default | Đã xác thực | Mục đầu active, đủ 6 thẻ và khối Sun* Kudos | Mọi hành động ở § 4 | TBD (draft) |
| empty | — | N/A — 6 thẻ là dữ liệu cố định, không có trạng thái rỗng | — | TBD (draft) |
| error | `#` không khớp hạng mục | Không báo lỗi; trang ở đầu, mục đầu active | Dùng menu bình thường | TBD (draft) |
| error | Nút "Chi tiết" tới trang không có | Trang 404 mặc định của ứng dụng | Quay lại | TBD (draft) |
| saving | — | N/A — trang không ghi dữ liệu | — | TBD (draft) |
| success | Bấm mục menu | Mục đó active, trang cuộn tới thẻ | Tiếp tục cuộn hoặc chọn mục khác | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E04 | Hạng mục trong `#` phải là một trong 6 hạng mục có sẵn | Không hiện thông báo; trang ở đầu và mục đầu active | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Cửa sổ từ 1024px trở lên | responsive | E04, E05–E10 | Menu dọc bên trái, dính dưới header | Dưới 1024px | Theo clarifications.md (2026-10-13) |
| Cửa sổ dưới 1024px | responsive | E04, E05–E10 | Một hàng tab cuộn ngang ghim phía trên các thẻ, cùng kiểu active | Từ 1024px trở lên | Figma chỉ có desktop; quyết định ở clarifications.md |
| Ngôn ngữ người dùng chọn (vi hoặc en) | configuration | E02–E03, E05–E10, E12–E19 | Chuỗi theo ngôn ngữ đang chọn | — | Bản vi nguyên văn Figma, bản en do nhóm soạn |

## 8. Navigation

> `## 8. Navigation` là phép chiếu theo màn của luồng màn hình (`screen-flow.md`), không phải nguồn thứ hai; hàng nào chưa có trong `screen-flow.md` ghi `TBD (draft)`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR003_Homepage | Bấm một thẻ giải (mở `/awards-information#<slug>`) hoặc nút "ABOUT AWARDS" | Đã đăng nhập | TBD (draft) |
| Header (vỏ `(main)`) | Bấm mục "Awards Information" | Đã đăng nhập | TBD (draft) |
| Footer (vỏ `(main)`) | Bấm liên kết "Awards Information" | Đã đăng nhập | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Sun* Kudos | E19 | — | Sun* Kudos (`/sun-kudos`, hiện là trang giữ chỗ; mã SCR### TBD (draft)) | redirect cùng tab | TBD (draft) |
| Dùng header, footer | Header, footer | — | SCR003_Homepage, `/sun-kudos`, `/standards`, `/login` (khi đăng xuất) | redirect | TBD (draft) |

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
| desktop (từ 1024px) | R4 | Menu dọc bên trái, dính dưới header | TBD (draft) |
| dưới 1024px | R4 | Hàng tab cuộn ngang ghim phía trên các thẻ, cùng kiểu active | TBD (draft) |
| dưới 1024px | R5 (E12–E17) | Thẻ xếp dọc: ảnh trên, nội dung dưới [NEEDS_DOMAIN_CONFIRMATION] | TBD (draft) |
| mọi cỡ | E01 | Ảnh nền co giãn phủ kín, cắt giữa | TBD (draft) |
