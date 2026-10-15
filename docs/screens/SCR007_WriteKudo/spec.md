---
status: draft
authored_by: takumi
fcode: F007
created: 2026-10-15
lang: vi
---

# SCR007_WriteKudo — Screen Spec

**Screen**: SCR007_WriteKudo: Viết Kudo
**Feature**: F007_WriteKudo
**Type**: atomic
**Route**: `/sun-kudos` (modal mở trên Live board, không có route riêng)
**Generated**: 2026-10-15

## 1. Overview

**Purpose:** Sunner đã đăng nhập dùng modal này để gửi lời cảm ơn và ghi nhận tới một đồng nghiệp, ngay khi bấm thanh ghi nhận trên Live board.
**Actors:** Sunner gửi Kudos
**Entry Conditions:** Đã đăng nhập, có hồ sơ Sunner, đang ở `/sun-kudos` và bấm thanh ghi nhận.
**Exit Conditions:** Modal đóng: gửi thành công, bấm Hủy hoặc nhấn Esc. Dữ liệu chưa gửi bị bỏ.

## 2. Screen Layout

### Layout Sketch

Hộp thoại nền kem, bo góc, rộng tối đa 752 px, căn giữa trên lớp nền mờ che Live board; cao hơn màn hình thì cuộn bên trong. Từ trên xuống: tiêu đề căn giữa, các hàng nhãn trái và ô nhập phải (Người nhận, Danh hiệu), khối soạn thảo gồm thanh công cụ và ô viết, dòng gợi ý "@ + tên", hàng Hashtag, hàng Image, ô ẩn danh, chân modal có Hủy và Gửi. Dưới 640 px nhãn xếp trên ô nhập. Hộp thoại chèn liên kết, danh sách gợi ý người nhận và panel hashtag nổi lên trên modal.

```
┌──────────────────────────────────────────────────┐
│ R1: Tiêu đề "Gửi lời cám ơn và ghi nhận…"        │
├──────────────────────────────────────────────────┤
│ R2: Người nhận*  [Tìm kiếm            ▾]         │
│     (R7: danh sách gợi ý, nổi)                   │
│     Danh hiệu*   [Dành tặng một danh hiệu…]      │
│                  Ví dụ: … / Danh hiệu sẽ hiển thị…│
├──────────────────────────────────────────────────┤
│ R3: [B][I][S][1.][🔗][❝]  Tiêu chuẩn cộng đồng   │
│     ┌──────────────────────────────────────────┐ │
│     │ Hãy gửi gắm lời cám ơn…                  │ │
│     └──────────────────────────────────────────┘ │
│     Bạn có thể “@ + tên” để nhắc tới đồng nghiệp │
├──────────────────────────────────────────────────┤
│ R4: Hashtag* [+ Hashtag] chip chip   (R8: panel) │
│     Image    [ảnh][ảnh]…  [+ Image]              │
│ R5: [ ] Gửi lời cám ơn và ghi nhận ẩn danh       │
│     (Tên ẩn danh: [          ])  - chỉ khi bật   │
├──────────────────────────────────────────────────┤
│ R6: [Hủy ✕]  [        Gửi ▷        ]             │
└──────────────────────────────────────────────────┘
 R9: hộp thoại Addlink (nổi trên modal, chỉ khi mở)
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Tiêu đề modal | static | no | `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:34-40` |
| R2 | Người nhận và Danh hiệu | static | no | `app/(main)/sun-kudos/_components/recipient-picker-view.tsx:12-86`, `app/(main)/sun-kudos/_components/write-kudo-field-row.tsx:51-92` |
| R3 | Soạn lời cảm ơn | static | no | `app/(main)/sun-kudos/_components/kudo-editor-frame-view.tsx:45-100`, `app/(main)/sun-kudos/_wiring/write-kudo-editor-container.tsx:27-76` |
| R4 | Hashtag và Image | static | no | `app/(main)/sun-kudos/_components/hashtag-picker-view.tsx:13-96`, `app/(main)/sun-kudos/_components/image-picker-view.tsx:14-77` |
| R5 | Ẩn danh | static | no | `app/(main)/sun-kudos/_components/anonymous-field-view.tsx:8-43` |
| R6 | Chân modal (Hủy, Gửi) | static | no | `app/(main)/sun-kudos/_components/write-kudo-footer-view.tsx:10-45` |
| R7 | Danh sách gợi ý người nhận và mention | floating | yes | `app/(main)/sun-kudos/_components/sunner-option-list-view.tsx:19-70` |
| R8 | Panel chọn hashtag | floating | yes | `app/(main)/sun-kudos/_components/hashtag-picker-view.tsx:13-96` |
| R9 | Hộp thoại Addlink | floating | no | `app/(main)/sun-kudos/_components/add-link-dialog-view.tsx:53-99` |
| R0 | Khung modal ngoài cùng và lớp nền mờ | fixed | yes (khi cao hơn màn hình) | `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:12-45` |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Gửi lời cám ơn và ghi nhận đến đồng đội | region label | — | Hiện | Always | — | static | raw | — | N/A |
| E02 | Người nhận | text input | yes | Rỗng, chữ gợi ý "Tìm kiếm", mũi tên xuống | Always | Gõ để tìm, chọn từ E03 | rpc `search_sunners` (`lib/kudos/search-sunners-action.ts:15-33`) | tên và avatar sau khi chọn | placeholder text | technical-spec.md A3, A4 |
| E03 | Danh sách gợi ý người nhận | list | — | Đóng | Conditional | Chọn một dòng | rpc `search_sunners` (`lib/kudos/search-sunners-action.ts:15-33`) | avatar, họ tên, phòng ban | "Không tìm thấy kết quả" | technical-spec.md A3 |
| E04 | Danh hiệu | text input | yes | Rỗng, chữ gợi ý "Dành tặng một danh hiệu cho đồng đội" | Always | Nhập danh hiệu | — | raw | placeholder text | technical-spec.md BR-009 |
| E05 | Ví dụ và giải thích danh hiệu | message | — | "Ví dụ: Người truyền động lực cho tôi. / Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn." | Always | — | static | raw | — | N/A |
| E06 | Nút định dạng B, I, S, danh sách số, trích dẫn | button | — | Tắt | Always | Bật hoặc tắt định dạng cho đoạn chọn (E09) | — | — | — | N/A |
| E07 | Nút chèn liên kết | button | — | Bật | Always | Mở hộp thoại Addlink (E12 đến E14) | — | — | — | N/A |
| E08 | Tiêu chuẩn cộng đồng | link | — | Hiện | Always | Mở trang tiêu chuẩn trong tab mới | static | gạch chân, màu đỏ | — | N/A |
| E09 | Ô soạn lời cảm ơn | textarea | yes | Rỗng, chữ gợi ý "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" | Always | Nhập, định dạng, gõ "@" để nhắc tên | local, editor state (`app/(main)/sun-kudos/_behavior/use-kudo-editor.ts:47-96`) | chữ có định dạng | placeholder text | technical-spec.md A5, ALG-002 |
| E10 | Gợi ý nhắc tên | message | — | "Bạn có thể “@ + tên” để nhắc tới đồng nghiệp khác" | Always | — | static | raw | — | N/A |
| E11 | Danh sách gợi ý mention | list | — | Đóng | Conditional | Chọn một người để chèn tên | rpc `search_sunners` (`lib/kudos/search-sunners-action.ts:15-33`) | avatar, họ tên, phòng ban | "Không tìm thấy kết quả" | technical-spec.md A7 |
| E12 | Text (Addlink) | text input | yes | Rỗng | Conditional | Nhập phần chữ của liên kết | — | raw | placeholder text | N/A |
| E13 | Link (Addlink) | text input | yes | Rỗng | Conditional | Nhập địa chỉ http hoặc https | — | raw | placeholder text | N/A |
| E14 | Hủy và Lưu (Addlink) | button | — | Bật | Conditional | Hủy đóng hộp thoại; Lưu chèn liên kết | — | — | — | N/A |
| E15 | + Hashtag | button | yes | Bật, ghi chú "Tối đa 5" | Always | Mở panel E16 | — | — | — | N/A |
| E16 | Panel chọn hashtag | list | — | Đóng | Conditional | Bấm dòng để chọn hoặc bỏ chọn | `kudos_filter_options` (`app/(main)/sun-kudos/_wiring/read-compose-access.ts:14-20`) | "#" kèm nhãn; dòng chọn nền đậm kèm dấu tick | — | technical-spec.md A8 |
| E17 | Chip hashtag | list | — | Không có chip | Conditional | Bấm "x" để gỡ | local, picker state (`app/(main)/sun-kudos/_behavior/use-hashtag-picker.ts:30-80`) | "#" kèm nhãn | hidden | technical-spec.md A8 |
| E18 | + Image | button | no | Bật, ghi chú "Tối đa 5" | Conditional | Mở hộp chọn tệp ảnh | — | — | — | N/A |
| E19 | Thu nhỏ ảnh | image | no | Không có ảnh | Conditional | Bấm "x" để xóa ảnh | local preview | hình vuông nhỏ kèm nút "x" đỏ | hidden | N/A |
| E20 | Gửi lời cám ơn và ghi nhận ẩn danh | checkbox | no | Bỏ chọn | Always | Bật hoặc tắt ẩn danh | — | — | — | technical-spec.md A11, BR-006 |
| E21 | Tên ẩn danh | text input | no | Rỗng | Conditional | Nhập tên hiển thị thay tên người gửi | — | raw | placeholder text | technical-spec.md A11, BR-006 |
| E22 | Hủy | button | — | Bật | Always | Đóng modal, bỏ dữ liệu | — | — | — | N/A |
| E23 | Gửi | button | — | Mờ khi còn thiếu trường bắt buộc, vẫn bấm được | Always | Kiểm tra rồi gửi (cần E02, E04, E09, E17) | — | nền vàng, biểu tượng gửi | — | N/A |
| E24 | Thông báo lỗi dưới trường | message | — | Ẩn | Conditional | — | computed | chữ đỏ nhỏ dưới ô | hidden | N/A |
| E25 | Toast kết quả | message | — | Ẩn | Conditional | Tự biến mất sau khoảng 3 giây | computed | khung nổi | hidden | N/A |

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Tìm người nhận | E02 | Gõ vào ô | Từ 1 ký tự sau khi bỏ khoảng trắng | Hiện E03 với tối đa 10 gợi ý | `app/(main)/sun-kudos/_behavior/use-sunner-search.ts:20-47` |
| Chọn người nhận | E03 | Click một dòng | Danh sách đang mở | Tên và avatar điền vào E02, E03 đóng | `app/(main)/sun-kudos/_behavior/use-recipient-picker.ts:62-68` |
| Xóa người nhận | E02 | Click nút xóa trong ô | Đã chọn người nhận | Ô về trạng thái tìm kiếm trống | `app/(main)/sun-kudos/_behavior/use-recipient-picker.ts:95-100` |
| Nhập danh hiệu | E04 | Gõ | — | Giá trị được giữ trong form | `app/(main)/sun-kudos/_behavior/use-write-kudo-form.ts:45-83` |
| Định dạng chữ | E06 | Click | Có đoạn chọn hoặc gõ tiếp | Đoạn chọn đậm, nghiêng, gạch ngang, đánh số hoặc thành trích dẫn | `app/(main)/sun-kudos/_behavior/use-kudo-editor.ts:47-96` |
| Mở hộp thoại liên kết | E07 | Click | — | Hiện E12 đến E14 trên modal | `app/(main)/sun-kudos/_behavior/use-add-link-dialog.ts:67-75` |
| Lưu liên kết | E14 | Click Lưu | Text và Link hợp lệ | Liên kết được chèn, hộp thoại đóng | `app/(main)/sun-kudos/_behavior/use-add-link-dialog.ts:77-91` |
| Đóng hộp thoại liên kết | E14 | Click Hủy hoặc Esc | Hộp thoại đang mở | Hộp thoại đóng, modal giữ nguyên | `app/(main)/sun-kudos/_behavior/use-add-link-dialog.ts:58-65` |
| Nhắc đồng nghiệp | E09 | Gõ "@" kèm chữ rồi chọn trong E11 | — | Tên "@Họ tên" được chèn | `app/(main)/sun-kudos/_behavior/use-mention-suggestion.ts:47-100` |
| Mở panel hashtag | E15 | Click | — | Hiện E16 | `app/(main)/sun-kudos/_behavior/use-hashtag-picker.ts:69` |
| Chọn hoặc bỏ hashtag | E16 | Click một dòng | Chưa đủ 5, hoặc dòng đã được chọn | Dòng đổi trạng thái, chip E17 thêm hoặc mất | `app/(main)/sun-kudos/_behavior/use-hashtag-picker.ts:70-74` |
| Gỡ hashtag | E17 | Click "x" | — | Chip mất, dòng tương ứng trong E16 hết được chọn | `app/(main)/sun-kudos/_behavior/use-hashtag-picker.ts:75` |
| Thêm ảnh | E18 | Click rồi chọn tệp | Dưới 5 ảnh | Thu nhỏ E19 hiện ngay cho tệp hợp lệ | `app/(main)/sun-kudos/_behavior/use-image-attachments.ts:68-85` |
| Xóa ảnh | E19 | Click "x" | — | Ảnh mất; đang đủ 5 thì E18 hiện lại | `app/(main)/sun-kudos/_behavior/use-image-attachments.ts:88-93` |
| Bật hoặc tắt ẩn danh | E20 | Click | — | Hiện hoặc ẩn E21, giá trị E21 bị xóa khi tắt | `app/(main)/sun-kudos/_behavior/use-write-kudo-form.ts:72-75` |
| Nhập tên ẩn danh | E21 | Gõ | Ẩn danh đang bật | Giá trị được giữ trong form | `app/(main)/sun-kudos/_components/anonymous-field-view.tsx:25-43` |
| Hủy | E22 | Click hoặc Esc | Không đang gửi | Modal đóng, bỏ mọi thay đổi | `app/(main)/sun-kudos/_behavior/use-modal-focus-trap.ts:40-42`, `app/(main)/sun-kudos/_components/write-kudo-footer-view.tsx:17` |
| Gửi | E23 | Click | — | Kiểm tra; đủ thì gửi, thiếu thì hiện lỗi E24 | `app/(main)/sun-kudos/_behavior/use-submit-kudo.ts:73-85` |

### Happy Path

1. Sunner bấm thanh ghi nhận trên Live board; modal hiện, tiêu điểm ở ô Người nhận (R2).
2. Sunner gõ tên, chọn một người trong danh sách gợi ý (R7); tên điền vào ô.
3. Sunner điền Danh hiệu, rồi viết lời cảm ơn trong R3, có thể định dạng, chèn liên kết hoặc nhắc tên bằng "@".
4. Sunner mở panel hashtag (R8), chọn từ 1 đến 5 hashtag; chip hiện ở R4.
5. Sunner tuỳ chọn thêm ảnh ở R4 và bật ẩn danh ở R5.
6. Sunner bấm Gửi ở R6; nút quay vòng tải, mọi ô bị khóa.
7. Gửi xong, modal đóng và toast "Đã gửi Kudos thành công!" hiện lên.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 6 | Thiếu Người nhận, Danh hiệu, nội dung hoặc hashtag | Viền đỏ và "Không được để trống" hiện đồng thời ở các trường thiếu; không gửi | `app/(main)/sun-kudos/_behavior/use-write-kudo-form.ts:54-64` |
| Bước 6 | Gửi thất bại | Modal giữ nguyên dữ liệu, toast lỗi hiện, ô nhập và Hủy mở khóa lại | `app/(main)/sun-kudos/_behavior/use-submit-kudo.ts:56-71` |
| Bước 2 | Không có Sunner khớp | Danh sách hiện "Không tìm thấy kết quả" | `app/(main)/sun-kudos/_behavior/use-sunner-search.ts:44-46` |
| Bước 5 | Chọn tệp không phải JPEG, PNG, WebP | Tệp không được thêm, hiện "Định dạng file không hợp lệ" | `app/(main)/sun-kudos/_behavior/use-image-attachments.ts:36-41` |
| Bước 4 | Đã chọn 5 hashtag | Các dòng chưa chọn bị vô hiệu, panel hiện "Tối đa 5 hashtag" | `app/(main)/sun-kudos/_behavior/use-hashtag-picker.ts:60-67` |

### Interaction Notes

- **Click nền mờ ngoài modal không làm gì, tránh mất nội dung** — source: `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:19-21`
- **Esc đóng hộp thoại liên kết trước; khi không có hộp thoại thì đóng modal** — source: `app/(main)/sun-kudos/_behavior/use-escape-layer.ts:13-31`, `app/(main)/sun-kudos/_behavior/use-modal-focus-trap.ts:36-45` [EXPECTED]
- **Tab quay vòng trong modal, không thoát ra Live board phía sau** — source: `app/(main)/sun-kudos/_behavior/use-modal-focus-trap.ts:44-60` [EXPECTED]

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tìm người nhận hoặc mention | Danh sách giữ kết quả trước, không nhấp nháy; kết quả cũ hơn bị bỏ | Gõ tiếp | `app/(main)/sun-kudos/_behavior/use-sunner-search.ts:20-47` |
| empty | Tìm không ra ai | Danh sách một dòng "Không tìm thấy kết quả" | Sửa chuỗi gõ | `app/(main)/sun-kudos/_behavior/use-sunner-search.ts:44-46` |
| empty | Chưa chọn hashtag, chưa thêm ảnh | Chỉ có nút "+ Hashtag" và "+ Image" | Thêm | `app/(main)/sun-kudos/_components/hashtag-picker-view.tsx:13-96`, `app/(main)/sun-kudos/_components/image-picker-view.tsx:14-77` |
| error | Bấm Gửi khi thiếu trường bắt buộc | Viền đỏ và "Không được để trống" ở từng trường thiếu; lỗi hashtag ở hàng Hashtag | Điền rồi gửi lại | `app/(main)/sun-kudos/_behavior/use-write-kudo-form.ts:54-64` |
| error | Tệp ảnh sai định dạng hoặc quá 5 MB | Dòng lỗi dưới hàng Image, tệp không được thêm | Chọn tệp khác | `app/(main)/sun-kudos/_behavior/use-image-attachments.ts:36-41`, `app/(main)/sun-kudos/_behavior/use-image-attachments.ts:88-93` |
| error | Gửi thất bại | Toast lỗi, modal giữ nguyên dữ liệu | Gửi lại hoặc Hủy | `app/(main)/sun-kudos/_behavior/use-submit-kudo.ts:56-71` |
| saving | Đang gửi | Gửi quay vòng tải; mọi ô nhập và Hủy bị khóa | none | `app/(main)/sun-kudos/_components/write-kudo-footer-view.tsx:28-39` |
| success | Gửi xong | Modal đóng, toast "Đã gửi Kudos thành công!" khoảng 3 giây | Đóng toast | `app/(main)/sun-kudos/_behavior/use-submit-kudo.ts:63-68` |
| dimmed | Còn thiếu trường bắt buộc | Gửi mờ và báo vô hiệu cho trình đọc màn hình, vẫn bấm được | Bấm để xem lỗi | `app/(main)/sun-kudos/_components/write-kudo-footer-view.tsx:28` |
| full | Đủ 5 hashtag hoặc 5 ảnh | Dòng hashtag chưa chọn bị vô hiệu; nút "+ Image" ẩn | Gỡ bớt | `app/(main)/sun-kudos/_behavior/use-hashtag-picker.ts:60-67`, `app/(main)/sun-kudos/_components/image-picker-view.tsx:52` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02 | Bắt buộc chọn một người từ danh sách | Viền đỏ và "Không được để trống" | submit, blur |
| E04 | Bắt buộc, 1 đến 100 ký tự sau khi bỏ khoảng trắng | Viền đỏ và "Không được để trống" | submit, blur |
| E09 | Bắt buộc, chữ thuần không trống sau khi bỏ khoảng trắng, tối đa 2000 ký tự | "Không được để trống"; quá dài: "Nội dung tối đa 2000 ký tự" | submit, blur, change |
| E17 | Cần ít nhất 1 hashtag, tối đa 5 | "Không được để trống" ở hàng Hashtag; thứ 6: "Tối đa 5 hashtag" | submit, change |
| E19 | JPEG, PNG, WebP, mỗi ảnh tối đa 5 MB, tối đa 5 ảnh | "Định dạng file không hợp lệ"; quá cỡ: "Ảnh vượt quá 5 MB"; quá số lượng: "Tối đa 5 ảnh" | change |
| E12 | Bắt buộc, 1 đến 100 ký tự, không toàn khoảng trắng | Viền đỏ và "Không được để trống" | submit |
| E13 | Bắt buộc, 5 đến 2048 ký tự, bắt đầu bằng http:// hoặc https:// | "Liên kết phải bắt đầu bằng http:// hoặc https://" | submit |
| E21 | Tối đa 50 ký tự; để trống thì hiển thị "Người gửi ẩn danh" | Không cho gõ quá 50 ký tự | change |
| E23 | Gửi bị máy chủ từ chối hoặc lỗi mạng | Toast "Không gửi được Kudos. Vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Danh sách gợi ý người nhận hiện khi đang gõ | configuration | E03 | Ô E02 có từ 1 ký tự sau khi bỏ khoảng trắng | Ô trống, đã chọn người, hoặc bấm ra ngoài | — |
| Danh sách mention hiện khi gõ "@" kèm chữ | configuration | E11 | Đang gõ sau "@" trong E09 | Hết chuỗi sau "@" hoặc Esc | — |
| Ô "Tên ẩn danh" theo checkbox ẩn danh | configuration | E21 | E20 được chọn | E20 bỏ chọn (giá trị bị xóa) | — |
| Nút "+ Image" theo số ảnh | configuration | E18 | Dưới 5 ảnh | Đủ 5 ảnh | — |
| Panel hashtag theo nút "+ Hashtag" | configuration | E16 | Đã bấm E15 | Bấm lại E15 hoặc bấm ra ngoài | — |
| Hộp thoại Addlink theo nút liên kết | configuration | E12, E13, E14 | Đã bấm E07 | Lưu, Hủy hoặc Esc | — |
| Tình trạng đang gửi | configuration | E02, E04, E09, E22, E23 | — | Đang gửi: mọi ô nhập và Hủy bị khóa, E23 quay vòng tải | — |
| Người dùng chưa có hồ sơ Sunner | auth | Thanh ghi nhận trên Live board (ngoài modal) | Có hồ sơ Sunner | Chưa có hồ sơ: thanh vô hiệu, không mở được modal | Máy chủ vẫn chặn nếu bị gọi trực tiếp |
| Chỗ hiển thị lỗi theo trường | configuration | E24 | Trường đã chạm hoặc đã bấm Gửi và đang sai | Trường hợp lệ | — |

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
| SCR006_KudosLiveBoard | Bấm thanh ghi nhận | Đã đăng nhập và có hồ sơ Sunner | `app/(main)/sun-kudos/_wiring/action-pills-container.tsx:25-57` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Hủy | E22 | Không đang gửi | SCR006_KudosLiveBoard (ở lại màn Live board) | modal đóng, tiêu điểm về thanh ghi nhận | `app/(main)/sun-kudos/_behavior/use-modal-focus-trap.ts:40-42`, `app/(main)/sun-kudos/_behavior/use-modal-focus-trap.ts:72-78` |
| Esc | — | Không đang gửi, không có hộp thoại liên kết mở | SCR006_KudosLiveBoard (ở lại màn Live board) | modal đóng | `app/(main)/sun-kudos/_behavior/use-modal-focus-trap.ts:40-42` |
| Gửi thành công | E23 | Dữ liệu hợp lệ | SCR006_KudosLiveBoard (ở lại màn Live board) | toast rồi Live board nạp lại, Kudo mới đứng đầu All Kudos | `app/(main)/sun-kudos/_behavior/use-submit-kudo.ts:63-68` |
| Tiêu chuẩn cộng đồng | E08 | — | `/standards` (trang giữ chỗ; chưa có mã màn hình) | new tab | `app/(main)/sun-kudos/_components/kudo-editor-frame-view.tsx:73-79` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Khung modal có role hộp thoại và nhãn là tiêu đề; mỗi ô có nhãn gắn kèm; Gửi mang trạng thái vô hiệu cho trình đọc màn hình khi còn thiếu trường nhưng vẫn bấm được |
| Keyboard navigation | [EXPECTED] | Mọi điều khiển tới được bằng Tab; Esc đóng modal; mũi tên chọn trong danh sách gợi ý và Enter để chọn |
| Focus management | [EXPECTED] | Tiêu điểm bị bẫy trong modal; vào modal tiêu điểm ở ô Người nhận; đóng thì quay về thanh ghi nhận; hộp thoại liên kết có bẫy riêng và trả tiêu điểm về nút liên kết |
| Screen reader compatibility | [EXPECTED] | Nút định dạng có nhãn chữ; thu nhỏ ảnh và nút "x" có nhãn; danh sách gợi ý thông báo số kết quả |
| Error announcement | [EXPECTED] | Lỗi từng trường và toast kết quả được đọc tự động; trường lỗi báo trạng thái không hợp lệ |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop (1440 px) | R0 | Modal rộng 752 px, căn giữa trên nền mờ | `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:31` |
| tablet, mobile | R0 | Rộng bằng chiều rộng màn hình trừ 32 px, tối đa 752 px; cao tối đa chiều cao màn hình trừ 32 px, cuộn bên trong | `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:18`, `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:31` |
| dưới 640 px | R2, R4 | Nhãn xếp trên ô nhập thay vì nằm cùng hàng | `app/(main)/sun-kudos/_components/write-kudo-field-row.tsx:26` |
| 375 px | R0 | Không có thanh cuộn ngang | `app/(main)/sun-kudos/_components/write-kudo-modal-view.tsx:31` |
