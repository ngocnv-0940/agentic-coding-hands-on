---
status: draft
authored_by: takumi
fcode: F001
created: 2026-10-08
lang: vi
---

# SCR002_Todo — Screen Spec

**Screen**: SCR002_Todo: Todo (tối thiểu, được bảo vệ)
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

Một trang đơn giản: vùng nội dung chiếm cả trang, trong đó một khối thông tin người dùng gồm email và nút Logout. Chưa có danh sách todo thật (ngoài phạm vi của tính năng này). Kiểu dáng chi tiết nằm trong `app/todo/page.tsx`.

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
| R1 | Page Container | static | no | `<main>` căn giữa, bọc `<Suspense>` có khung chờ trống |
| R2 | User Panel | static | no | Tiêu đề, dòng email (`data-testid="todo-email"`), form Logout |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Email người dùng | display field | — | Email của tài khoản đang đăng nhập | Always | — | computed | raw | dash | N/A |
| E02 | Logout | button | — | Enabled | Always | Đăng xuất | static | — | — | N/A |

Nhãn email và nhãn "Logout" (vi: "Đăng xuất") lấy từ từ điển `lib/i18n` do F002_Localization sở hữu (D002 trong functional-spec.md, đã chốt). Logout là nút submit của `<form action="/auth/logout" method="post">` (`app/todo/logout-button.tsx`): form POST gốc nên điều hướng cả trang tới `POST /auth/logout` (ROUTE002), nơi gọi `signOut({ scope: 'local' })` — chỉ thiết bị hiện tại.

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đăng xuất | E02 | click | Nút sẵn sàng | Nút bị vô hiệu hoá sau khi bấm, trình duyệt gửi `POST /auth/logout` | `app/todo/logout-button.tsx`, `app/auth/logout/route.ts` |

### Happy Path

1. Người dùng thấy email của mình trong khối thông tin.
2. Người dùng bấm Logout.
3. Nút bị vô hiệu hoá, trình duyệt gửi `POST /auth/logout` rồi nhận 303 về `/login` (điều hướng cả trang, không còn DOM `/todo`).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Phiên đã hết hạn trước khi bấm | Không hiện lỗi; xử lý như đăng xuất bình thường | `app/auth/logout/route.ts` |

N/A — single-action screen with one conditional outcome noted above.

### Interaction Notes

- **Đăng xuất là form POST gốc, không phải Server Action** — điều hướng cả trang nên khi Back không còn cây DOM `/todo` ẩn; `GET /auth/logout` trả 405 — source: `app/auth/logout/route.ts`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| default | Mở trang khi có phiên | E01 hiện email, E02 sẵn sàng | Bấm Logout | `app/todo/page.tsx` |
| empty | Tài khoản không có email | E01 hiện dấu "—" | Bấm Logout | `app/todo/page.tsx` (`todo.emailMissing`) |
| saving | Đã bấm Logout, đang xử lý | E02 vô hiệu hoá | Không | `app/todo/logout-button.tsx` |
| success | Đăng xuất xong | Người dùng không còn ở trang này | Không | `app/auth/logout/route.ts` |
| error | Đăng xuất báo lỗi (`signOut` lỗi) | Không hiện lỗi; vẫn xoá phiên (xoá cookie `sb-*-auth-token*` nếu `signOut` lỗi) và rời trang | Không | `app/auth/logout/route.ts` |

Loading: trang đợi request thật (`await connection()`) trong `<Suspense>`; trong lúc chờ chỉ có khung trống, không có chỉ báo tải.

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

> `screen-flow.md` chưa được tạo; các dòng dưới là đường đi đã chốt trong `clarifications.md`, cần đối chiếu khi bản as-built sinh `screen-flow.md`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR001_Login | Đăng nhập Google thành công | Luôn | `app/auth/callback/route.ts` |
| SCR001_Login | Mở `/login` khi đã có phiên | Có phiên hợp lệ | `lib/supabase/proxy.ts` |
| external | Mở địa chỉ `/todo` | Có phiên hợp lệ | `app/todo/page.tsx` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đăng xuất | E02 | Luôn | SCR001_Login | redirect (303 từ `POST /auth/logout`) | `app/auth/logout/route.ts` |
| Mở trang khi không có phiên hợp lệ | — | Phiên mất hoặc hết hạn | SCR001_Login | redirect (proxy hoặc `redirect("/login")` của trang) | `lib/supabase/proxy.ts`, `app/todo/page.tsx` |

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
