---
status: draft
authored_by: takumi
fcode: F006
created: 2026-10-14
lang: vi
---

# SCR006_KudosLiveBoard — Screen Spec

**Screen**: SCR006_KudosLiveBoard: Sun* Kudos - Live board
**Feature**: F006_KudosLiveBoard
**Type**: composite
**Route**: /sun-kudos
**Generated**: 2026-10-14

## 1. Overview

**Purpose:** Sunner xem các lời cảm ơn nổi bật và mới nhất trong công ty, lọc theo hashtag hoặc phòng ban, thả tim, sao chép liên kết và xem số liệu cá nhân của mình.
**Actors:** Sunner (người đã đăng nhập; có thể là người gửi hoặc người nhận kudo)
**Entry Conditions:** Đã đăng nhập (khách bị chuyển về trang đăng nhập) và đã qua mốc ra mắt. Người dùng tới đây từ mục "Sun* Kudos" ở header hoặc footer, hoặc gõ thẳng địa chỉ, hoặc mở link có kèm bộ lọc.
**Exit Conditions:** Người dùng rời sang trang chi tiết kudo, trang hồ sơ, hoặc trang khác qua header và footer; hoặc đóng tab. Các nút "ghi nhận", "tìm profile" và "Mở Secret Box" chỉ mở modal "Coming soon" rồi quay lại trang này.

## 2. Screen Layout

### Layout Sketch

Một trang cuộn dọc (khung Figma 1440×5862) dùng header và footer chung của nhóm `(main)`. Giữa hai phần đó, từ trên xuống: banner KV có tiêu đề và logo KUDOS, hàng hai pill (thanh ghi nhận và tìm profile), khối Highlight Kudos (tiêu đề, hai dropdown lọc, carousel năm thẻ, mũi tên và chỉ số "n/N"), khối Spotlight board (tiêu đề phần, bảng tối có tên người nhận), rồi khối ALL KUDOS gồm cột feed (khoảng 680px) bên trái và sidebar (khoảng 430px) bên phải. Sidebar dính khi cuộn và có thanh cuộn riêng. Toast và modal nổi phía trên mọi vùng.

```
┌────────────────────────────────────────────────────────────┐
│ R1: Header chung (fixed-top)                               │
├────────────────────────────────────────────────────────────┤
│ R2: Banner KV + [ghi nhận ............] [tìm profile .....]│
├────────────────────────────────────────────────────────────┤
│ R3: HIGHLIGHT KUDOS            [Hashtag ▾] [Phòng ban ▾]   │
│   ‹  [mờ] [ THẺ GIỮA ] [mờ]  ›        ‹  2/5  ›            │
├────────────────────────────────────────────────────────────┤
│ R4: SPOTLIGHT BOARD                                        │
│   ┌ [Tìm kiếm]   388 KUDOS            [Pan/Zoom] ┐         │
│   │  tên  tên    tên    tên   (canvas tối)       │         │
│   └ dòng hoạt động chạy (góc trái dưới) ─────────┘         │
├───────────────────────────────────┬────────────────────────┤
│ R5: ALL KUDOS (feed, cuộn vô hạn) │ R6: Sidebar (sticky)   │
│   [thẻ kudo]                      │   5 số liệu            │
│   [thẻ kudo]                      │   [Mở Secret Box]      │
│   [thẻ kudo] ...                  │   10 người nhận quà    │
├───────────────────────────────────┴────────────────────────┤
│ R7: Footer chung (static)                                  │
└────────────────────────────────────────────────────────────┘
        ┌─ R8: toast "Link copied — ready to share!" (fixed) ─┐
        └─ R8: modal "Coming soon" (nổi, có nút đóng) ────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header chung | fixed-top | no | TBD (draft) |
| R2 | Banner KV và hai pill | static | no | TBD (draft) |
| R3 | Highlight Kudos | static | no | TBD (draft) |
| R4 | Spotlight board | static | no (canvas kéo được khi bật Pan/Zoom) | TBD (draft) |
| R5 | ALL KUDOS (feed) | static | yes (cuộn trang, nạp thêm khi tới đáy) | TBD (draft) |
| R6 | Sidebar | sticky | yes (cuộn riêng khi cao hơn khung nhìn) | TBD (draft) |
| R7 | Footer chung | static | no | TBD (draft) |
| R8 | Lớp nổi (toast, modal) | fixed | no | TBD (draft) |

## 3. UI Elements

Văn bản và giá trị theo Figma/MoMorph (screen `MaZUn5xHXZ`, frame `2940:13431`); khung Figma thắng spec khi lệch. Cột `Source` là `TBD (draft)` khi chưa có ràng buộc; `Cross-ref` ghi mã mục CSV MoMorph. Các phần tử của thẻ kudo (E11 đến E19) dùng chung cho Highlight và ALL KUDOS, chỉ khác số dòng cắt chữ và vài phần tử ghi chú riêng.

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Banner: tiêu đề "Hệ thống ghi nhận và cảm ơn", logo KUDOS, nền đồ họa | image | — | Hiện | Always | — | static | raw | — | MoMorph A (`2940:13437`) |
| E02 | Thanh ghi nhận (pill, biểu tượng bút, placeholder "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?") | button | — | Bật | Always | Mở modal "Coming soon" | static | raw | — | MoMorph A.1 (`2940:13449`) |
| E03 | Pill "Tìm kiếm profile Sunner" (chỉ có trong Figma) | button | — | Bật | Always | Mở modal "Coming soon" | static | raw | — | Figma `2940:13431` (không có trong CSV) |
| E04 | Tiêu đề phần: "Sun* Annual Awards 2025" và "HIGHLIGHT KUDOS" | region label | — | Hiện | Always | — | static | raw | — | MoMorph B.1 (`2940:13452`) |
| E05 | Dropdown "Hashtag" | select | no | Chưa chọn (tất cả) | Always | Mở danh sách, chọn một hashtag hoặc bỏ lọc | API field | raw | Danh sách rỗng thì chỉ có "bỏ lọc" | MoMorph B.1.1 (`2940:13459`) |
| E06 | Dropdown "Phòng ban" | select | no | Chưa chọn (tất cả) | Always | Mở danh sách, chọn một phòng ban hoặc bỏ lọc | API field | raw | Như E05 | MoMorph B.1.2 (`2940:13460`) |
| E07 | Carousel Highlight: thẻ giữa rõ, hai thẻ bên mờ và không tương tác | list | — | Thẻ đầu ở giữa | Conditional | — | API field | — | Hiện "Hiện tại chưa có Kudos nào." | MoMorph B.2, B.2.3 (`2940:13461`, `2940:13463`) |
| E08 | Mũi tên lùi và tiến hai bên carousel | button | — | Lùi vô hiệu | Conditional | Chuyển thẻ trước hoặc sau | computed | — | — | MoMorph B.2.1, B.2.2 (`2940:13470`, `2940:13468`) |
| E09 | Hàng điều khiển dưới carousel: mũi tên lùi, "n/N", mũi tên tiến | button | — | "1/N" | Conditional | Như E08 | computed | `n/N` | — | MoMorph B.5, B.5.1 đến B.5.3 (`2940:13471` đến `2940:13474`) |
| E10 | Tiêu đề phần: "Sun* Annual Awards 2025" và "SPOTLIGHT BOARD" | region label | — | Hiện | Always | — | static | raw | — | MoMorph B.6 (`2940:13476`) |
| E11 | Khối người gửi: avatar, họ tên, phòng ban, số sao, huy hiệu danh hiệu | display field | — | Avatar mặc định nếu thiếu ảnh | Always | Bấm avatar hoặc tên tới hồ sơ; rê vào sao hiện mô tả | API field | sao: 0 đến 3; huy hiệu New, Rising, Super, Legend Hero | Không sao, không huy hiệu khi thiếu | MoMorph B.3.1, B.3.2, C.3.1 |
| E12 | Mũi tên "gửi tới" giữa người gửi và người nhận | image | — | Hiện | Always | — | static | raw | — | MoMorph B.3.4, C.3.2 |
| E13 | Khối người nhận: avatar, họ tên, phòng ban, số sao, huy hiệu | display field | — | Như E11 | Always | Như E11 | API field | Như E11 | Như E11 | MoMorph B.3.5, B.3.6, C.3.3 |
| E14 | Thời gian đăng | label | — | — | Always | — | API field | `HH:mm - MM/DD/YYYY`, giờ Việt Nam | — | MoMorph B.4.1, C.3.4 |
| E15 | Dòng tiêu đề kudo (ví dụ "IDOL GIỚI TRẺ") và biểu tượng bút ở thẻ ALL KUDOS | display field | — | Hiện nếu kudo có tiêu đề | Conditional | — (biểu tượng bút trang trí) | API field | raw | Ẩn | Figma (thẻ ALL KUDOS); MoMorph D.4 [NEEDS_DOMAIN_CONFIRMATION] |
| E16 | Nội dung lời cảm ơn | display field | — | — | Always | Bấm mở trang chi tiết kudo | API field | Highlight cắt 3 dòng, ALL KUDOS cắt 5 dòng, thêm "..." | — | MoMorph B.4.2, C.3.5 |
| E17 | Ảnh đính kèm (chỉ ALL KUDOS) | list | — | — | Conditional | Bấm ảnh mở ảnh lớn | API field | tối đa 5 ảnh vuông xếp ngang, căn trái | Ẩn khi không có ảnh | MoMorph C.3.6 |
| E18 | Hàng hashtag của kudo | list | — | — | Always | Bấm một hashtag đặt bộ lọc hashtag | API field | một dòng, tối đa 5, dư thì "..." | Ẩn khi không có hashtag | MoMorph B.4.3, C.3.7, D.4 |
| E19 | Thanh hành động của thẻ: số tim kèm tim, "Copy Link", và "Xem chi tiết" (chỉ Highlight) | button | — | Tim xám nếu chưa tim | Always | Thả tim hoặc bỏ tim; sao chép liên kết; mở chi tiết | API field | số tim phân nghìn bằng dấu chấm ("1.000"); tim xám chưa tim, đỏ đã tim | — | MoMorph B.4.4, C.4, C.4.1, C.4.2 |
| E20 | Tiêu đề Spotlight: tổng số "<tổng> KUDOS" | label | — | "0 KUDOS" nếu chưa có | Always | — | API field | số nguyên | — | MoMorph B.7.1 (`3007:17482`) |
| E21 | Canvas Spotlight: các node tên người nhận trên nền tối | list | — | — | Conditional | Rê hiện tooltip; bấm node mở kudo mới nhất của người đó | API field | tối đa 100 node, vị trí cố định theo người | Hiện "Chưa có dữ liệu" | MoMorph B.7 (`2940:14174`) |
| E22 | Tooltip của node: tên và thời gian kudo mới nhất | message | — | Ẩn | Conditional | — | API field | `tên · HH:mm - MM/DD/YYYY` | — | MoMorph B.7 |
| E23 | Nút Pan/Zoom (tooltip "Pan/Zoom") | button | — | Tắt | Always | Bật hoặc tắt chế độ kéo và phóng to | computed | — | — | MoMorph B.7.2 (`3007:17479`) |
| E24 | Ô tìm kiếm Spotlight (placeholder "Tìm kiếm", kính lúp) | text input | no | Rỗng | Always | Enter hoặc bấm kính lúp làm nổi bật tên khớp | — | tối đa 100 ký tự | Rỗng thì bỏ nổi bật | MoMorph B.7.3 (`2940:14833`) |
| E25 | Dòng hoạt động chạy ở góc trái dưới Spotlight (5 kudo mới nhất) | list | — | — | Conditional | — (chỉ xem) | API field | giờ và tên người nhận | Ẩn khi không có kudo | Figma `2940:13431` |
| E26 | Tiêu đề phần: "Sun* Annual Awards 2025" và "ALL KUDOS" | region label | — | Hiện | Always | — | static | raw | — | MoMorph C.1 (`2940:14221`) |
| E27 | Danh sách ALL KUDOS: các thẻ mới nhất trước, kèm vùng nạp thêm cuối danh sách | list | — | 10 thẻ đầu | Always | Cuộn tới đáy nạp thêm | API field | — | "Hiện tại chưa có Kudos nào." | MoMorph C, C.2 (`2940:13475`, `2940:13482`) |
| E28 | Hộp số liệu sidebar: Kudos nhận, Kudos gửi, tim nhận, Secret Box đã mở, Secret Box chưa mở | display field | — | 0 | Always | — | API field | số nguyên | Hiện 0 | MoMorph D.1, D.1.2 đến D.1.7 |
| E29 | Nút "Mở Secret Box" | button | — | Bật khi chưa mở lớn hơn 0 | Always | Mở modal "Coming soon" | computed | — | Vô hiệu khi chưa mở bằng 0 | MoMorph D.1.8 (`2940:13497`) |
| E30 | Hộp "10 SUNNER NHẬN QUÀ MỚI NHẤT": avatar, tên, mô tả quà | list | — | — | Always | Bấm avatar hoặc tên tới hồ sơ | API field | 10 dòng mới nhất | "Chưa có dữ liệu" | MoMorph D.3, D.3.1 đến D.3.6 |
| E31 | Toast "Link copied — ready to share!" (và toast lỗi) | message | — | Ẩn | Conditional | Tự ẩn sau khoảng 3 giây | static | cùng chữ ở hai ngôn ngữ | — | MoMorph C.4.2, B.4.4 |
| E32 | Modal "Coming soon" kèm nút đóng | message | — | Ẩn | Conditional | Đóng bằng nút, Esc hoặc bấm nền | static | chữ lấy từ khóa `comingSoon.title` sẵn có | — | Clarifications (ngoài phạm vi) |

Danh sách mục "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" của spec MoMorph D không được dựng vì khung Figma không vẽ.

## 4. User Actions

> **Scope:** within-screen interactions only. Điều hướng sang màn khác nằm ở `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chuyển thẻ Highlight | E08, E09 | click | Không ở đầu (lùi) hoặc cuối (tiến) | Thẻ giữa đổi, chỉ số "n/N" đổi | TBD (draft) |
| Chọn bộ lọc hashtag | E05 | click rồi chọn | — | Địa chỉ đổi; Highlight và ALL KUDOS dựng lại theo bộ lọc; carousel về thẻ đầu | TBD (draft) |
| Chọn bộ lọc phòng ban | E06 | click rồi chọn | — | Như trên | TBD (draft) |
| Bỏ bộ lọc | E05, E06 | chọn dòng bỏ lọc | Đang có lọc | Bộ lọc đó bị xóa khỏi địa chỉ, danh sách dựng lại | TBD (draft) |
| Lọc theo hashtag trên thẻ | E18 | click một hashtag | Hashtag không bị cắt bởi "..." | Như "Chọn bộ lọc hashtag" | TBD (draft) |
| Thả tim hoặc bỏ tim | E19 | click tim | Không phải người gửi kudo; không đang chờ | Tim đổi xám và đỏ, số đổi 1; nút vô hiệu tạm trong lúc chờ | TBD (draft) |
| Sao chép liên kết | E19 | click "Copy Link" | — | Toast hiện (E31) rồi tự ẩn | TBD (draft) |
| Nạp thêm kudo | E27 | cuộn tới đáy | Còn dữ liệu, chưa đang nạp | Thêm tối đa 10 thẻ vào cuối danh sách | TBD (draft) |
| Rê vào node Spotlight | E21 | hover | Có dữ liệu | Tooltip E22 hiện | TBD (draft) |
| Bật hoặc tắt Pan/Zoom | E23 | click | — | Chế độ đổi; khi bật kéo và lăn chuột tác động canvas | TBD (draft) |
| Kéo và phóng to canvas | E21 | kéo chuột, lăn chuột | Pan/Zoom đang bật | Canvas dịch và co giãn trong giới hạn | TBD (draft) |
| Tìm tên trong Spotlight | E24 | Enter hoặc click kính lúp | — | Node khớp nổi bật, node khác mờ; ô rỗng thì hết nổi bật | TBD (draft) |
| Mở ảnh đính kèm | E17 | click ảnh | Thẻ có ảnh | Ảnh lớn mở (cách mở chờ xác nhận) | TBD (draft) |
| Mở modal chưa có | E02, E03, E29 | click | E29 chỉ khi chưa mở lớn hơn 0 | Modal E32 hiện | TBD (draft) |
| Đóng modal | E32 | click nút đóng, Esc, click nền | Modal đang mở | Modal đóng, tiêu điểm về nút đã mở nó | TBD (draft) |

### Happy Path

1. Sunner mở trang, thấy banner và Highlight với thẻ đầu ở giữa (R3).
2. Họ bấm mũi tên tiến để xem các thẻ nổi bật khác, rồi chọn một hashtag ở dropdown; Highlight và ALL KUDOS cùng thu hẹp.
3. Họ lướt Spotlight (R4), rê chuột lên một tên để xem thời gian, gõ tên đồng nghiệp rồi Enter để làm nổi bật.
4. Họ cuộn tới ALL KUDOS (R5), thả tim một kudo, bấm "Copy Link" và thấy toast.
5. Họ nhìn sidebar (R6) xem số liệu của mình.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Thả tim (bước 4) | Người dùng là người gửi kudo | Nút tim vô hiệu, không có tác dụng | TBD (draft) |
| Thả tim (bước 4) | Máy chủ từ chối hoặc lỗi mạng | Tim và số về như trước, hiện toast lỗi | TBD (draft) |
| Chọn bộ lọc (bước 2) | Không có kudo khớp | Highlight và ALL KUDOS hiện "Hiện tại chưa có Kudos nào." | TBD (draft) |
| Sao chép (bước 4) | Trình duyệt chặn clipboard | Toast lỗi thay cho toast thành công | TBD (draft) |
| Nạp thêm (bước 4) | Lỗi mạng | Dừng ở dòng chờ, thử lại ở lần cuộn kế | TBD (draft) |
| Địa chỉ có giá trị lọc lạ (mở trang) | `hashtag` hoặc `department` không tồn tại | Bỏ giá trị đó, trang hiện như không lọc | TBD (draft) |

### Interaction Notes

- **Bật Pan/Zoom thì lăn chuột trên canvas không cuộn trang; tắt thì cuộn bình thường** — source: TBD (draft)
- **Kéo canvas rồi thả trên một node không tính là bấm node** — source: TBD (draft)
- **Hai thẻ cùng một kudo (Highlight và ALL KUDOS) luôn hiện cùng trạng thái tim và số tim** — source: TBD (draft)
- **Thả tim không sắp lại Highlight; thứ tự chỉ đổi khi tải lại trang** — source: TBD (draft)
- **Bấm "Copy Link" liên tiếp làm mới toast, không chồng nhiều toast** — source: TBD (draft)
- **Rê vào số sao hiện mô tả mức sao bằng chú thích có sẵn của trình duyệt** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Trang và từng khối đang được máy chủ dựng | Mỗi khối (Highlight, Spotlight, ALL KUDOS, sidebar) hiện khung chờ riêng; khối nhanh không đợi khối chậm | none | TBD (draft) |
| loading | Đang nạp thêm kudo | Dòng "đang tải" dưới thẻ cuối | none | TBD (draft) |
| default | Có dữ liệu | Đủ năm khối với dữ liệu thật | Mọi thao tác ở mục 4 | TBD (draft) |
| empty | Highlight hoặc ALL KUDOS không có kudo (kể cả sau lọc) | Chữ "Hiện tại chưa có Kudos nào."; Highlight bỏ mũi tên và chỉ số | Đổi hoặc bỏ bộ lọc | TBD (draft) |
| empty | Spotlight chưa có kudo | Chữ "Chưa có dữ liệu" giữa canvas, tiêu đề "0 KUDOS" | none | TBD (draft) |
| empty | Danh sách nhận quà chưa có dòng | Chữ "Chưa có dữ liệu" trong hộp | none | TBD (draft) |
| empty | Người dùng chưa có hồ sơ Sunner | Năm số sidebar là 0; "Mở Secret Box" vô hiệu | Các thao tác khác bình thường | TBD (draft) |
| error | Thả tim thất bại | Tim và số về như trước; toast lỗi ngắn | Bấm lại | TBD (draft) |
| error | Sao chép liên kết thất bại | Toast lỗi, không toast thành công | Bấm lại | TBD (draft) |
| error | Nạp thêm thất bại | Dòng chờ đổi thành thông báo ngắn | Cuộn lần nữa để thử lại | TBD (draft) |
| saving | Đang gửi yêu cầu thả tim | Nút tim vô hiệu tạm, chưa đổi màu hoặc số | none | TBD (draft) |
| success | Thả tim hoặc bỏ tim xong | Tim đổi màu, số đổi đúng 1 | Bấm lại để đảo | TBD (draft) |
| success | Sao chép xong | Toast "Link copied — ready to share!" tự ẩn sau khoảng 3 giây | none | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E24 | Không bắt buộc; tối đa 100 ký tự | Không có thông báo lỗi; ô rỗng thì bỏ nổi bật; quá 100 ký tự bị cắt ngay khi nhập | change |
| E19 (tim) | Một tim mỗi người mỗi kudo; người gửi không được tim | Người gửi: nút vô hiệu, không có chữ; lỗi từ máy chủ: toast lỗi ngắn (chuỗi chờ xác nhận) | submit |
| E19 (Copy Link) | Cần quyền ghi clipboard của trình duyệt | Thành công: "Link copied — ready to share!"; thất bại: toast lỗi ngắn (chuỗi chờ xác nhận) | submit |
| E05, E06 | Chỉ nhận giá trị có trong danh sách | Giá trị lạ trong địa chỉ bị bỏ, không có thông báo | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Người dùng chưa đăng nhập | auth | Toàn trang | — | Luôn ẩn: chuyển về `/login` | Guard hiện có của trang bảo vệ |
| Highlight có ít nhất một kudo | data | E07, E08, E09 | Có kudo sau lọc | Không có kudo | Thay bằng chữ rỗng; một thẻ thì cả hai mũi tên vô hiệu |
| Người dùng là người gửi kudo | data | E19 (tim) | — | Không ẩn mà vô hiệu | Tim xám, không bấm được |
| Kudo có ảnh đính kèm | data | E17 | Có ít nhất một ảnh | Không có ảnh | Tối đa 5 ảnh |
| Kudo có tiêu đề | data | E15 | Có tiêu đề | Không có | [NEEDS_DOMAIN_CONFIRMATION] |
| Người có huy hiệu danh hiệu hoặc số sao | data | E11, E13 | Có danh hiệu hoặc từ 10 kudo nhận | Không có | Mỗi mức sao một mô tả |
| Số Secret Box chưa mở bằng 0 | data | E29 | Chưa mở lớn hơn 0 (bấm được) | Bằng 0 (vô hiệu) | — |
| Chế độ Pan/Zoom | configuration | E21 | Bật: kéo và lăn chuột tác động canvas | Tắt: canvas đứng yên | Mặc định tắt |
| Ngôn ngữ vi hoặc en | configuration | Mọi chữ giao diện | Theo cookie chung của app | — | Tên, lời nhắn, hashtag không dịch; chữ toast "Link copied — ready to share!" giữ nguyên |
| Cửa sổ nhỏ hơn 1024px | responsive | R6, E07 | — | — | Xem mục 10 |

## 8. Navigation

> `## 8. Navigation` là phép chiếu theo màn của luồng màn hình (`screen-flow.md`), không phải nguồn thứ hai; hàng nào chưa có trong `screen-flow.md` ghi `TBD (draft)`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| Header chung (mục "Sun* Kudos") | Bấm mục điều hướng | Đã đăng nhập | TBD (draft) |
| Footer chung (liên kết "Sun* Kudos") | Bấm liên kết | Đã đăng nhập | TBD (draft) |
| Gõ thẳng địa chỉ hoặc link chia sẻ có `?hashtag=&department=` | Mở địa chỉ | Đã đăng nhập; qua mốc ra mắt | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở chi tiết kudo | E16, E19 ("Xem chi tiết"), E21 (node) | — | `/sun-kudos/<kudoId>` (trang giữ chỗ "Coming soon") | redirect | TBD (draft) |
| Mở hồ sơ | E11, E13, E30 (avatar hoặc tên) | — | `/profile` (trang giữ chỗ) | redirect | TBD (draft) |
| Mở modal chưa có | E02, E03, E29 | E29 chỉ khi chưa mở lớn hơn 0 | (stays on screen) | modal | TBD (draft) |
| Mở ảnh lớn | E17 | Thẻ có ảnh | TBD (draft) | TBD (draft) | TBD (draft) |
| Chưa đăng nhập | — | Phiên mất hiệu lực | `/login` | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Mỗi khối là một vùng có tiêu đề; carousel có nhãn và vùng "n/N" đọc được; nút tim có nhãn kèm trạng thái đã tim hoặc chưa; số sao có chú thích; hai thẻ bên của carousel ẩn khỏi trình đọc màn hình |
| Keyboard navigation | [EXPECTED] | Dropdown, mũi tên, tim, Copy Link, hashtag, Pan/Zoom và ô tìm kiếm tới được bằng Tab; Enter hoặc Space kích hoạt; thẻ bên của carousel không có điểm dừng Tab |
| Focus management | [EXPECTED] | Modal giữ tiêu điểm bên trong, Esc đóng, trả tiêu điểm về nút đã mở nó; sau khi đổi bộ lọc tiêu điểm ở lại dropdown |
| Screen reader compatibility | [EXPECTED] | Toast dùng vùng thông báo lịch sự; thẻ kudo đọc theo thứ tự người gửi, người nhận, thời gian, nội dung; canvas Spotlight có danh sách tên thay thế cho người dùng không dùng chuột |
| Error announcement | [EXPECTED] | Toast lỗi của tim, sao chép và nạp thêm được đọc ra; ô tìm kiếm không có lỗi cần đọc |
| Contrast | [EXPECTED] | Chữ vàng và trắng trên nền tối; chữ trên thẻ kem đủ tương phản theo Figma |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop 1440 (Figma) | R5, R6 | Feed khoảng 680px bên trái, sidebar khoảng 430px bên phải và dính khi cuộn | TBD (draft) |
| dưới 1024px | R6 | Sidebar xếp chồng cùng cột với feed (trên hoặc dưới feed) [NEEDS_DOMAIN_CONFIRMATION] | TBD (draft) |
| dưới 1024px | E07 | Carousel chỉ hiện một thẻ, không thấy thẻ bên mờ | TBD (draft) |
| dưới 1024px | E05, E06 | Hai dropdown có thể xuống hàng dưới tiêu đề | TBD (draft) |
| 375px | Toàn trang | Không có thanh cuộn ngang; Spotlight co theo bề rộng, vẫn kéo và phóng to được | TBD (draft) |
