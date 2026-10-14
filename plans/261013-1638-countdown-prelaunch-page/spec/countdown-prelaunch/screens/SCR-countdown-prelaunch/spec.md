---
status: draft
authored_by: takumi
created: 2026-10-13
lang: vi
---

# SCR-countdown-prelaunch — Screen Spec

**Screen**: SCR-countdown-prelaunch: Countdown - Prelaunch
**Feature**: countdown-prelaunch (mã F### cấp lúc promote)
**Type**: atomic
**Route**: /prelaunch
**Generated**: 2026-10-13

## 1. Overview

**Purpose:** Trước ngày sự kiện, cho người truy cập biết sự kiện bắt đầu sau bao nhiêu ngày, giờ, phút; tới mốc thì tự đưa họ vào ứng dụng.
**Actors:** Người truy cập (khách hoặc người đã đăng nhập; trang công khai)
**Entry Conditions:** Chưa tới mốc `EVENT_START_AT`. Người truy cập tới đây khi mở thẳng `/prelaunch` hoặc khi mở bất kỳ đường dẫn nào khác ngoài `/login` và `/auth/*` (hệ thống tự chuyển tới). Sau mốc, hoặc khi mốc thiếu hay sai, trang này không hiện mà chuyển về `/`.
**Exit Conditions:** Tới mốc, trang tự chuyển tới `/`. Trước mốc, người dùng chỉ rời trang bằng cách gõ địa chỉ khác (ví dụ `/login`).

## 2. Screen Layout

### Layout Sketch

Một khung toàn màn hình, không header, không footer. Ảnh nền tối họa tiết hữu cơ nhiều màu phủ kín khung (cover, no-repeat) với lớp phủ tối bán trong suốt. Khối nội dung căn giữa theo chiều ngang, đặt ở khoảng giữa khung nhìn: dòng tiêu đề, bên dưới là ba khối số xếp ngang (Days, Hours, Minutes), mỗi khối có hai ô số kiểu LED và nhãn in hoa màu trắng bên dưới.

```
┌──────────────────────────────────────────────────────┐
│ R1: Nền ảnh toàn màn hình + lớp phủ tối (static)     │
│                                                      │
│                Sự kiện sẽ bắt đầu sau                │  R2
│                                                      │
│        [0][0]       [0][5]       [2][0]              │  R3
│        DAYS         HOURS        MINUTES             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Nền ảnh và lớp phủ | fixed (phủ kín khung nhìn) | no | TBD (draft) |
| R2 | Tiêu đề đếm ngược | static, căn giữa | no | TBD (draft) |
| R3 | Ba khối đếm ngược | static, căn giữa | no | TBD (draft) |

## 3. UI Elements

Văn bản và giá trị theo Figma/MoMorph (screen `8PJQswPZmU`, frame `2268:35127`). Cột `Source` đều `TBD (draft)`; `Cross-ref` ghi mã mục của CSV MoMorph. Kích thước ô số lấy từ Figma khi dựng (khung có ô lớn hơn trang chủ).

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Ảnh nền tối họa tiết nhiều màu, phủ kín khung nhìn, cover, no-repeat, kèm lớp phủ tối bán trong suốt giúp chữ đọc rõ | image | — | Hiện | Always | — (trang trí, không bấm) | TBD (draft) | raw | — | MoMorph 0.1 (`2268:35129`) |
| E02 | Tiêu đề "Sự kiện sẽ bắt đầu sau" (vi) / "Event starts in" (en); căn giữa, màu trắng, cỡ chữ vừa | display field | — | Theo ngôn ngữ đã chọn | Always | — | TBD (draft) | raw | — | MoMorph 0.2 (`2268:35137`) |
| E03 | Khối ngày: hai ô số LED (số ngày còn lại) | display field | — | `00` | Always | — (tự cập nhật theo phút) | TBD (draft) | hai chữ số có số 0 đứng trước; ngày từ 100 là 3 chữ số | Hiện `00` khi dưới một ngày hoặc đã tới mốc | MoMorph 1 (`2268:35139`) |
| E04 | Nhãn "DAYS", in hoa, màu trắng, dưới khối ngày | label | — | "DAYS" | Always | — | TBD (draft) | uppercase | — | MoMorph 1 (`2268:35139`) |
| E05 | Khối giờ: hai ô số LED (00 đến 23) | display field | — | `00` | Always | — (tự cập nhật theo phút) | TBD (draft) | hai chữ số có số 0 đứng trước | Hiện `00` khi đã tới mốc | MoMorph 2 (`2268:35144`) |
| E06 | Nhãn "HOURS", in hoa, màu trắng, dưới khối giờ | label | — | "HOURS" | Always | — | TBD (draft) | uppercase | — | MoMorph 2 (`2268:35144`) |
| E07 | Khối phút: hai ô số LED (00 đến 59) | display field | — | `00` | Always | — (tự cập nhật theo phút) | TBD (draft) | hai chữ số có số 0 đứng trước | Hiện `00` khi đã tới mốc | MoMorph 3 (`2268:35149`) |
| E08 | Nhãn "MINUTES", in hoa, màu trắng, dưới khối phút | label | — | "MINUTES" | Always | — | TBD (draft) | uppercase | — | MoMorph 3 (`2268:35149`) |

## 4. User Actions

> **Scope:** within-screen interactions only. Điều hướng sang màn khác nằm ở `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Xem số cập nhật | E03, E05, E07 | tự động (không do người dùng bấm) | Mỗi lần phút đổi | Số trong ba khối đổi theo thời gian còn lại, không cần tải lại | TBD (draft) |

Trang không có nút, liên kết hay ô nhập; người dùng chỉ xem.

### Happy Path

1. Người truy cập mở bất kỳ link nào trước ngày sự kiện và thấy trang này với số ngày, giờ, phút còn lại.
2. Người đó để trang mở; số phút giảm dần.
3. Tới mốc, trang tự chuyển tới `/`.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở trang | Sau mốc, hoặc mốc thiếu hay sai | Không hiện trang; chuyển về `/` | TBD (draft) |
| Còn dưới 1 phút | Phút đã về 0 nhưng chưa tới mốc | Ba khối hiện `00` `00` `00`; trang chưa chuyển cho tới mốc thật | TBD (draft) |
| Tab mở qua mốc | Tab đang mở hoặc vừa thức dậy từ chế độ ngủ | Trang chuyển tới `/` | TBD (draft) |

### Interaction Notes

- **Số hiển thị có thể lệch vài phút nếu đồng hồ máy người dùng lệch; thời điểm chuyển trang không phụ thuộc đồng hồ máy** — source: TBD (draft)

## 5. UI States

> Trang gần như tĩnh: dữ liệu duy nhất là mốc đếm ngược do máy chủ gửi kèm trang, không có lời gọi dữ liệu riêng.

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Trang đang được máy chủ dựng | Nền tối đơn sắc (màu của khung dự phòng), chưa có nội dung | none | TBD (draft) |
| default | Trước mốc, đã tải xong | Ảnh nền, tiêu đề, ba khối với giá trị từ máy chủ rồi cập nhật theo đồng hồ trình duyệt | none | TBD (draft) |
| empty | — | N/A — luôn có ba khối; hết giờ thì hiện `00` | — | TBD (draft) |
| error | Mốc thiếu hay sai | Không hiện lỗi; trang không hiển thị vì được chuyển về `/` | none | TBD (draft) |
| saving | — | N/A — trang không ghi dữ liệu | — | TBD (draft) |
| success | Tới mốc | Ba khối về `00`, rồi chuyển tới `/` | none | TBD (draft) |

## 6. Validation & Feedback

N/A — screen has no input fields or validation rules; hiển thị chỉ đọc.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Ngôn ngữ người dùng chọn (vi hoặc en) | configuration | E02 | Chuỗi theo ngôn ngữ đang chọn (cookie chung của app) | — | Nhãn DAYS, HOURS, MINUTES giữ nguyên tiếng Anh in hoa theo Figma; trang không có bộ chọn ngôn ngữ |
| Ngày từ 100 trở lên | data | E03 | Hiện 3 chữ số | Dưới 100 ngày hiện 2 chữ số | Theo quy tắc đếm ngược của trang chủ |

## 8. Navigation

> `## 8. Navigation` là phép chiếu theo màn của luồng màn hình (`screen-flow.md`), không phải nguồn thứ hai; hàng nào chưa có trong `screen-flow.md` ghi `TBD (draft)`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| Mọi đường dẫn khác (kể cả không tồn tại) | Mở địa chỉ bất kỳ ngoài `/login`, `/auth/*` | Trước mốc | TBD (draft) |
| `/login` (sau đăng nhập thành công, qua `/`) | Đăng nhập xong về `/` rồi bị chuyển tiếp | Trước mốc | TBD (draft) |
| Gõ thẳng `/prelaunch` | Mở địa chỉ | Trước mốc | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Tới mốc (tự động) | E03, E05, E07 | Thời gian còn lại do máy chủ gửi đã hết | `/` (khách tiếp tục sang màn Login, người đã đăng nhập vào SCR003_Homepage) | redirect | TBD (draft) |
| Gõ `/login` | Thanh địa chỉ | Trước mốc | Màn Login | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Tiêu đề là một thẻ heading; mỗi khối có nhãn đọc được dạng "<số> DAYS"; ô số trang trí ẩn khỏi trình đọc màn hình (`aria-hidden`), giá trị đầy đủ nằm ở văn bản cho trình đọc |
| Keyboard navigation | [EXPECTED] | Không có phần tử tương tác, không có điểm dừng Tab |
| Focus management | [EXPECTED] | Khi tự chuyển trang không cần quản lý tiêu điểm |
| Screen reader compatibility | [EXPECTED] | Số cập nhật mỗi phút không thông báo liên tục (không dùng vùng `aria-live` ồn); đọc được tiêu đề và giá trị hiện tại khi người dùng tới |
| Error announcement | [EXPECTED] | Không có thông báo lỗi nào để đọc ra |
| Contrast | [EXPECTED] | Chữ trắng trên nền tối có lớp phủ đủ tương phản |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mọi cỡ | R1 | Ảnh nền co giãn phủ kín, cắt giữa | TBD (draft) |
| desktop (Figma) | R2, R3 | Khối nội dung căn giữa; ô số lớn theo Figma | TBD (draft) |
| dưới 768px | R3 (E03 đến E08) | Ô số và nhãn thu nhỏ để ba khối vẫn nằm vừa một hàng [NEEDS_DOMAIN_CONFIRMATION] | TBD (draft) |
