---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

# F001_Auth — Technical Spec

## 1. Technical Overview

Tính năng Auth cho phép khách đăng nhập Google qua Supabase Auth bằng luồng chuyển hướng cùng tab (PKCE): nút trên trang `/login` gọi `signInWithOAuth` từ trình duyệt, Supabase đưa người dùng qua Google rồi trả về `/auth/callback`, tại đó route handler đổi mã lấy phiên và ghi cookie. `proxy.ts` (Next.js 16) làm mới phiên ở mọi request và chuyển hướng theo trạng thái đăng nhập; trang `/todo` kiểm tra lại phiên và có Server Action đăng xuất. Không có bảng dữ liệu riêng của ứng dụng — phiên và user nằm hoàn toàn trong Supabase Auth.

```mermaid
flowchart LR
    subgraph CAP01["CAP-01 Đăng nhập Google"]
        A1["A1 Trang /login"] --> A2["A2 Bấm nút"] --> A3["A3 /auth/callback"]
    end
    subgraph CAP02["CAP-02 Bảo vệ trang"]
        A4["A4 proxy"]
    end
    subgraph CAP03["CAP-03 Todo và đăng xuất"]
        A5["A5 Trang /todo"] --> A6["A6 Logout"]
    end
    Guest(["Khách"]) --> A1
    A3 --> SB[("Supabase Auth")]
    A4 --> SB
    A6 --> SB
    User(["Người dùng đã đăng nhập"]) --> A5
```

## 2. Action Index

| # | Action (handler) | Method · Path | Codes | Writes | Detail |
|---|---|---|---|---|---|
| **A0** | *cross-cutting — belongs to no single action* | — | FR-601 | — | § 4.4 |
| **A1** | `LoginPage#render` (planned) | `GET` `/login` | FR-201, FR-202, FR-204, FR-205, BR-001, DEC-003, US002 | — *(read-only)* | § 3.1 |
| **A2** | `LoginButton#onClick` (planned) | browser · `signInWithOAuth` | FR-203, FR-401, FR-403, BR-001, SM-001, INT-001, US001, US002 | — *(chỉ ghi cookie xác thực tạm của trình duyệt, không ghi bảng)* | § 3.1 ▸ **diagram** |
| **A3** | `AuthCallbackRoute#GET` (planned) | `GET` `/auth/callback` | FR-002, FR-103, FR-402, BR-002, DEC-002, INT-001, US001, US002 | — *(ghi cookie phiên; không ghi bảng ứng dụng)* | § 3.1 ▸ **diagram** |
| **A4** | `proxy#proxy` (planned) | any · `/*` (trừ tài nguyên tĩnh) | FR-101, FR-102, FR-601, BR-003, BR-004, DEC-001, US005, US006 | — *(chỉ làm mới cookie phiên)* | § 3.2 |
| **A5** | `TodoPage#render` (planned) | `GET` `/todo` | FR-301, FR-601, US003 | — *(read-only)* | § 3.3 |
| **A6** | `logoutAction#signOut` (planned) | `POST` `/todo` *(Server Action)* | FR-104, FR-404, US004 | — *(xoá cookie phiên)* | § 3.3 |

## 3. Actions

### 3.1 CAP-01 — Đăng nhập bằng Google

Luồng này trải qua ba handler (A1 → A2 → A3) và hai dịch vụ ngoài, không handler nào sở hữu cả chuỗi, nên sơ đồ đặt ở cấp capability.

```mermaid
sequenceDiagram
    actor U as Khách
    participant L as "Trang login (A1, A2)"
    participant S as "Supabase Auth"
    participant G as Google
    participant C as "Callback (A3)"

    U->>L: bấm LOGIN With Google
    L->>L: vô hiệu hoá nút, hiện chỉ báo tải
    L->>S: signInWithOAuth, google, redirect_to callback, code_challenge
    S->>G: chuyển hướng cùng tab
    G-->>S: đồng ý hoặc huỷ
    S-->>C: redirect kèm code hoặc error
    C->>S: exchangeCodeForSession
    alt có phiên
        S-->>C: phiên hợp lệ
        C-->>U: redirect tới trang todo, kèm cookie phiên
    else lỗi, huỷ hoặc thiếu code
        C-->>U: redirect tới login kèm cờ error
    end
```

#### A1 · Hiển thị màn Login
`GET /login` → `` `LoginPage#render` (planned) ``
`FR-201` `FR-202` `FR-204` `FR-205` `BR-001` `DEC-003` `US002` · `SCR-login`

**Who** · Khách *(gate A0 — § 4.4; người đã đăng nhập bị A4 chuyển đi trước khi tới đây)*
**FE** · Trang server-rendered dựng header cố định (logo, vùng chọn ngôn ngữ của F002), hero, khối giới thiệu, nút đăng nhập (A2), vùng thông báo lỗi và footer cố định; chuỗi lấy từ từ điển theo locale của F002.
**Request** · query `error` *(chuỗi tuỳ ý, tuỳ chọn)*; cookie `NEXT_LOCALE` *(do F002 đọc)*
**BE** · `LoginPage#render` đọc `error` và locale, chọn chuỗi từ từ điển.
**Rule** · **BR-001 — Mọi giá trị `error` không rỗng đều hiện đúng một thông báo cố định, không in lại giá trị.** FR-204 (thông báo lỗi dưới nút) chỉ phụ thuộc việc `error` có mặt; thông báo lấy từ khoá từ điển, nên tham số giả mạo không chèn được nội dung. *(§ 4.4)*

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-003** | render | `searchParams.error` có mặt và khác rỗng | Dòng "Đăng nhập không thành công. Vui lòng thử lại." dưới nút; thiếu `error` thì không có dòng nào | TBD (draft) |

**Result** · read-only — **no DB write**. Hiển thị trọn bộ FR-201 (header, hero, tiêu đề, subtitle, tagline, nút, footer), FR-202 (header/footer cố định, phần tử tĩnh không tương tác) và FR-205 (mọi chuỗi từ từ điển). US002 (thấy lỗi khi thất bại/huỷ) hoàn tất khi dòng lỗi hiện ra và nút A2 dùng lại được.
**Source:** TBD (draft)

<!-- No diagram: below threshold — read-only, không ghi bảng, đồng bộ. -->

---

#### A2 · Bấm nút "LOGIN With Google"
`browser · signInWithOAuth` → `` `LoginButton#onClick` (planned) ``
`FR-203` `FR-401` `FR-403` `BR-001` `SM-001` `INT-001` `US001` `US002` · `SCR-login`

**Who** · Khách *(gate A0)*
**FE** · Client component nút: khi bấm vô hiệu hoá nút và hiện chỉ báo `role="status"` (FR-203); rê chuột có bóng nổi. Gọi trình duyệt-client của Supabase; client tự chuyển hướng cùng tab (FR-401).
**Request** · `provider` = `google`; `redirectTo` = `{origin}/auth/callback` *(không có tham số `next` — BR-002 ở A3)*
**BE** · Không có handler phía máy chủ; Supabase client tạo PKCE verifier (lưu cookie phía trình duyệt) và `code_challenge`, rồi điều hướng tới điểm `authorize` của Supabase. *(INT-001 — § 4.5: tích hợp ủy quyền đăng nhập Google cho Supabase Auth)*
**Rule** · **BR-001 — Mọi thất bại hiện cùng một thông báo cố định.** FR-403 (không khởi động được luồng): nếu lời gọi trả lỗi hoặc ném ngoại lệ thì bật lại nút, ẩn chỉ báo và hiện chính thông báo ở BR-001. *(§ 4.4)*
**Result** · Thành công: trình duyệt rời trang, trạng thái SM-001 chuyển *sẵn sàng → đang khởi động* và dừng ở đó vì trang bị thay. Thất bại: SM-001 sang *lỗi*. US001 (đăng nhập) bắt đầu từ đây; US002 (thấy lỗi) nhận nhánh lỗi. Không ghi bảng.
**State** · `SM-001`: `idle` → `initiating` → `error` *(§ 4.3)*
**Source:** TBD (draft)

---

#### A3 · Đổi mã đăng nhập lấy phiên
`GET /auth/callback` → `` `AuthCallbackRoute#GET` (planned) ``
`FR-002` `FR-103` `FR-402` `BR-002` `DEC-002` `INT-001` `US001` `US002` · `SCR-login`

**Who** · Khách (trình duyệt vừa quay về từ Supabase/Google) *(gate A0)*
**FE** · Không có giao diện; chỉ trả redirect.
**Request** · query `code` *(mã PKCE, tuỳ chọn)*; query `error`, `error_description` *(khi Google/Supabase báo lỗi hoặc huỷ, tuỳ chọn)*; cookie PKCE verifier do A2 đặt.
**BE** · `AuthCallbackRoute#GET` dùng server client của Supabase: đọc `error` trước, rồi `code`, gọi `exchangeCodeForSession(code)`; cookie phiên do `setAll` ghi vào response. Triển khai production dùng host từ `x-forwarded-host` khi dựng URL redirect.
**Rule** · **BR-002 — Đích sau đăng nhập luôn là `/todo`; không đọc tham số đích (`next`).** Vì vậy FR-103 (đăng nhập thành công vào `/todo`) không phụ thuộc đầu vào bên ngoài và không có điểm open-redirect. FR-002 (mọi tài khoản Google được phép): không có kiểm tra tên miền ở bước này.

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-002** | flow | có `error`, hoặc thiếu `code`, hoặc `exchangeCodeForSession` trả lỗi | Về `/login?error=...` (cờ cố định, không chép lại nội dung lỗi của Supabase) | TBD (draft) |
| **DEC-002** | flow | có `code` và đổi mã thành công | Về `/todo` kèm cookie phiên | TBD (draft) |

**Result** · Thành công: tạo phiên (cookie), redirect `/todo`. Thất bại/huỷ: không tạo phiên, redirect `/login?error=...` — đúng nhánh FR-402. US001 (đăng nhập thành công) khép lại ở đây; US002 (thấy lỗi) nhận nhánh lỗi. Không ghi bảng ứng dụng.
**Source:** TBD (draft)

---

### 3.2 CAP-02 — Bảo vệ trang theo phiên

#### A4 · Làm mới phiên và chuyển hướng theo trạng thái đăng nhập
`ANY /*` → `` `proxy#proxy` (planned) ``
`FR-101` `FR-102` `FR-601` `BR-003` `BR-004` `DEC-001` `US005` `US006` · `SCR-login` · `SCR-todo`

**Who** · Khách hoặc người dùng đã đăng nhập *(gate A0)*
**FE** · Không có giao diện.
**Request** · mọi request khớp matcher (loại `_next/static`, `_next/image`, favicon và ảnh tĩnh); cookie phiên Supabase.
**BE** · `proxy#proxy` gọi hàm `updateSession`: tạo server client trên request, không chèn mã nào giữa lúc tạo client và lúc xác minh phiên, rồi áp DEC-001 và trả `supabaseResponse`. Xác minh bằng `getUser()` (D005, đã chốt).
**Rule** · **BR-003 — Đường dẫn bắt đầu bằng `/auth/` không bị áp quy tắc chuyển hướng**, để A3 hoàn tất bước đổi mã. FR-601 (quyết định dựa trên phiên đã xác minh, không dùng `getSession()`) áp dụng cho bước xác minh này. **BR-004 — Redirect phải sao chép cookie (và header cache) của `supabaseResponse`**; thiếu bước này phiên vừa làm mới bị mất và người dùng bị đăng xuất ngầm.

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-001** | flow | `pathname` bắt đầu bằng `/todo` và không có phiên hợp lệ | Chuyển về `/login` (FR-101: khách bị chặn khỏi `/todo`) | TBD (draft) |
| **DEC-001** | flow | `pathname` = `/login` và có phiên hợp lệ (kể cả khi có `error`) | Chuyển sang `/todo` (FR-102: người đã đăng nhập bỏ qua màn Login) | TBD (draft) |
| **DEC-001** | flow | trường hợp còn lại, hoặc `pathname` bắt đầu bằng `/auth/` | Cho đi tiếp, kèm cookie phiên đã làm mới | TBD (draft) |

**Result** · Cookie phiên được làm mới khi cần; chuyển hướng theo DEC-001. US005 (khách bị chặn khỏi `/todo`) và US006 (người đã đăng nhập bỏ qua `/login`) hoàn tất ở đây. Không ghi bảng.
**Source:** TBD (draft)

<!-- No diagram: below threshold — không ghi bảng, đồng bộ, một nhánh quyết định dạng bảng DEC. -->

---

### 3.3 CAP-03 — Xem trang cá nhân và đăng xuất

#### A5 · Hiển thị trang Todo
`GET /todo` → `` `TodoPage#render` (planned) ``
`FR-301` `FR-601` `US003` · `SCR-todo`

**Who** · Người dùng đã đăng nhập *(gate A0; A4 đã chặn khách)*
**FE** · Trang server-rendered hiện email người dùng và nút Logout (form gọi A6); email và nhãn nút lấy từ từ điển `lib/i18n` do F002 sở hữu (D002, đã chốt).
**BE** · `TodoPage#render` tự xác minh lại phiên bằng `getUser()` của server client (FR-601 — không dựa riêng vào proxy), lấy email từ user; không có user thì redirect `/login`.
**Rule** · FR-601 (phiên xác minh phía máy chủ): trang kiểm tra lại vì matcher của proxy không phủ Server Action.
**Result** · read-only — **no DB write**. Hiện email (FR-301: thấy mình đang đăng nhập bằng tài khoản nào — US003); email thiếu thì hiện "—".
**Source:** TBD (draft)

---

#### A6 · Đăng xuất
`POST /todo` *(Server Action)* → `` `logoutAction#signOut` (planned) ``
`FR-104` `FR-404` `US004` · `SCR-todo`

**Who** · Người dùng đã đăng nhập *(gate A0)*
**FE** · Nút Logout trong form trên `/todo`; trong lúc gửi, nút bị vô hiệu hoá `[EXPECTED]`.
**BE** · `logoutAction#signOut` (`'use server'`) kiểm lại người dùng bằng `getUser()`, rồi gọi `signOut({ scope: 'local' })` của server client (chỉ thiết bị hiện tại — D004) rồi `redirect('/login')`.
**Rule** · FR-404 (đăng xuất xoá phiên): kể cả khi `signOut` báo lỗi hoặc phiên đã hết hạn, vẫn xoá cookie và chuyển về `/login`.
**Result** · Xoá cookie phiên (Supabase huỷ refresh token); redirect `/login` (FR-104: đăng xuất xong về màn Login — US004). Không ghi bảng ứng dụng.
**Source:** TBD (draft)

<!-- No diagram: below threshold — một lời gọi ra Supabase, không ghi bảng ứng dụng. -->

---

### 3.4 Edge cases

| Action | Scenario | Behavior |
|---|---|---|
| A1 | `?error=<script>` hoặc chuỗi bất kỳ | Chỉ hiện thông báo cố định (BR-001), giá trị bị bỏ qua |
| A2 | Bấm nhiều lần liên tiếp | Nút bị vô hiệu hoá từ lần đầu; một luồng duy nhất |
| A2 | `signInWithOAuth` trả lỗi hoặc mất mạng | SM-001 về `error`; bật nút, hiện thông báo |
| A3 | Không có `code`, không có `error` | DEC-002 → `/login?error=...` |
| A3 | Huỷ ở Google (`error=access_denied`, không có `code`) | DEC-002 → `/login?error=...`; tên tham số `[UNVERIFIED]` ở docs chính thức, cần xác nhận bằng e2e |
| A3 | Cookie PKCE verifier mất hoặc khác host (`localhost` ≠ `127.0.0.1`) | Đổi mã lỗi → `/login?error=...` |
| A3 | `code` đã dùng hoặc hết hạn | Đổi mã lỗi → `/login?error=...` |
| A4 | Access token hết hạn nhưng refresh token hợp lệ | Làm mới và gắn cookie mới vào redirect (BR-004) |
| A4 | Có phiên + `/login?error=...` | Vẫn chuyển sang `/todo` (DEC-001) |
| A4 · A5 · A6 | Server Action gọi trực tiếp, lọt qua matcher của proxy | A5/A6 tự kiểm tra lại phiên (A0 — FR-601) |
| A5 | Tài khoản không có email | Hiện "—" |
| A6 | Phiên hết hạn trước khi bấm Logout | Vẫn xoá cookie và về `/login`, không báo lỗi |
| A1-A6 | Không có cookie `NEXT_LOCALE` | Dùng `vi` mặc định (F002 sở hữu) |

## 4. Shared Foundation

### 4.1 Components

| Component | Responsibility | Used in | File |
|---|---|---|---|
| `LoginPage` (planned) | Trang `/login`: dựng màn Login, đọc `error` và locale | A1 | TBD (draft) |
| `LoginButton` (planned) | Client component: nút, chỉ báo tải, gọi `signInWithOAuth` | A2 | TBD (draft) |
| `AuthCallbackRoute` (planned) | Route handler `/auth/callback`: đổi mã, redirect | A3 | TBD (draft) |
| `proxy` + `updateSession` (planned) | Làm mới phiên, chuyển hướng theo DEC-001 | A4 | TBD (draft) |
| `TodoPage` + `logoutAction` (planned) | Trang `/todo` và Server Action đăng xuất | A5, A6 | TBD (draft) |
| Browser / server Supabase client factories (planned) | Tạo client mỗi lần gọi, không giữ biến toàn cục | A2, A3, A4, A5, A6 | TBD (draft) |

### 4.2 Data Model

#### Key Entities

| Entity | Table | Key Columns | Purpose |
|--------|-------|-------------|---------|
| Supabase Auth user *(do Supabase quản lý, không có migration của ứng dụng; MODEL### = TBD (draft))* | `auth.users` | `id`, `email` | Danh tính người đăng nhập; app chỉ đọc email qua API xác thực |

#### Polymorphic Behavior

N/A — no discriminator fields in Key Entities.

### 4.3 State Management

### Trạng thái nút đăng nhập trên màn Login (SM-001)
**kind:** ui
**Linked FR:** FR-203
**Source:** TBD (draft)

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> initiating : A2 bấm nút
    initiating --> error : A2 signInWithOAuth trả lỗi
    error --> initiating : A2 bấm lại
    initiating --> [*] : trình duyệt rời trang
```

**Action transitions:** guard và tác động của từng cạnh nằm ở rung **Result**/**State** của A2 (§ 3.1) — không lặp lại ở đây. Trạng thái `error` do trang A1 hiển thị khi quay về từ A3 là trang mới nên bắt đầu lại ở `idle` kèm thông báo (DEC-003).

### 4.4 Shared Rules

#### Bin 3 — cross-cutting, belongs to no single action

**A0 · FR-601 — Mọi quyết định cho vào/chặn dựa trên phiên được xác minh phía máy chủ.**
Proxy (A4) và từng trang/Server Action cần phiên (A5, A6) đều xác minh lại; không dùng dữ liệu cookie chưa xác minh. Matcher của proxy bỏ qua tài nguyên tĩnh và Server Action là POST tới chính route trang, nên không thể chỉ dựa vào proxy.
**Source:** TBD (draft)

#### Bin 2 — used by ≥2 named actions

**BR-001 — Mọi thất bại đăng nhập hiện cùng một thông báo cố định, lấy từ từ điển.**
Used in: **A1** · **A2**. A1 hiện thông báo khi có `error` trên URL; A2 hiện cùng thông báo khi không khởi động được luồng. Không bao giờ chép nội dung `error` hay thông báo của Supabase ra giao diện.
**Source:** TBD (draft)
```text
message = dictionary[locale]["login.error"]
show(message) iff (url.error is present and non-empty) or initiation_failed
```

### 4.5 Algorithms & Integrations

### Đăng nhập Google được ủy quyền cho Supabase Auth bằng PKCE (INT-001)
**Linked FR:** FR-401
**Used in:** A2 → A3
**Source:** TBD (draft)
**Type:** api-call
**Target:** Supabase Auth (endpoint authorize, token, user, logout); Google OAuth đứng sau Supabase
**Payload:** `provider=google`, `redirect_to={origin}/auth/callback`, `code_challenge` + `code_challenge_method=s256`; đổi mã gửi `auth_code` và PKCE verifier. Không có secret trong payload từ ứng dụng; Google client secret chỉ nằm trong cấu hình Supabase.
**Failure handling:** none ở mức retry — mọi lỗi (mạng, huỷ, mã sai) chuyển về `/login?error=...` hoặc bật lại nút (A2), người dùng tự bấm lại.

### 4.6 Configuration

```text
NEXT_PUBLIC_SUPABASE_URL = http://127.0.0.1:54321            # URL API Supabase cục bộ (e2e trỏ tới server giả)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = <publishable key từ `supabase status`>   # tên biến đã chốt; chỉ khoá công khai
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID = <từ Google Cloud>   # supabase/.env, KHÔNG commit
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET = <từ Google Cloud>  # supabase/.env, KHÔNG commit
# supabase/config.toml (commit): auth.site_url = http://localhost:3000
#   auth.additional_redirect_urls = ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]
#   auth.external.google.enabled = true ; skip_nonce_check = false
# Google Cloud (Web application): redirect URI = http://127.0.0.1:54321/auth/v1/callback ; JS origin = http://localhost:3000
```

Ghi chú: chỉ dùng một host trên trình duyệt (`localhost`) vì cookie PKCE verifier theo host. `.env.local` không commit; `.env.example` commit (tên biến, không giá trị). Cần Docker + Supabase CLI để `supabase start`. Việc `env()` thay thế cho `client_id` chưa được tài liệu xác nhận *(§ 5.3)*.

**Client behavior:** see behavior-logic.md, permissions.md, architecture.md

## 5. Verification & Technical Notes

### 5.1 Technical Verification

Chính sách test: `e2e-red-first` — viết test Playwright (`@playwright/test`) trước, chạy phải đỏ vì đúng lý do, rồi mới cài đặt. Google/Supabase chỉ bị giả lập ở biên mạng trong test (server Supabase giả cho request phía máy chủ, `page.route` cho điều hướng của trình duyệt); không có mock trong mã ứng dụng.

- **SC-001** *(A2)* Bấm nút: nút bị vô hiệu hoá, có chỉ báo `role="status"`, và trình duyệt gọi endpoint authorize với `provider=google`, `redirect_to` chứa `/auth/callback`, `code_challenge`; không mở tab/popup mới (covers FR-203, FR-401).
- **SC-002** *(A3)* Callback với `code` giả hợp lệ → URL cuối là `/todo` có cookie phiên; với `error=access_denied`, không `code`, hoặc đổi mã trả 400 → URL cuối là `/login?error=...` (covers FR-402, DEC-002).
- **SC-003** *(A1)* `/login?error=x` hiện đúng thông báo cố định dưới nút; `/login` thì không; giá trị `error` chứa HTML không xuất hiện trong trang (covers FR-204, BR-001, DEC-003).
- **SC-004** *(A4)* Chưa đăng nhập vào `/todo` → `/login`; đã đăng nhập vào `/login` → `/todo` (cả khi có `error`); redirect không mất cookie (covers FR-101, FR-102, BR-004, DEC-001).
- **SC-005** *(A5, A6)* `/todo` hiện email; Logout → `/login`; mở lại `/todo` → `/login` (covers FR-301, FR-104, FR-404).
- **SC-006** *(A1)* Bố cục: logo trái trên, vùng ngôn ngữ phải trên, footer cố định khi cuộn; logo/footer/dòng giới thiệu không phản ứng khi bấm (covers FR-201, FR-202). Test case `60bc5bbb` ("tab mới hoặc popup") bị thay thế bởi quyết định chuyển hướng cùng tab trong `clarifications.md`.
- **SC-007** *(A1)* Các chuỗi Login đổi theo locale từ F002 (covers FR-205; test thuộc F002 nhưng cần giả lập locale).
- **SC-008** *(A3)* Smoke tuỳ chọn `@smoke` chạy với Supabase cục bộ thật để xác nhận cấu hình Google và tên tham số khi huỷ (covers FR-001, FR-002; không chạy mặc định).

#### US001_Login *(A2, A3)*

**Independent Test:** Bấm nút, giả lập Google trả mã hợp lệ, kiểm tra kết thúc ở `/todo` có email.

**Acceptance Scenarios:**

1. **Given** khách ở `/login`, **When** bấm nút rồi callback nhận `code=stub-code`, **Then** URL là `/todo` và có cookie phiên.

#### US002_LoginFailure *(A1, A2, A3)*

**Independent Test:** Gọi callback với `error=access_denied`; kiểm tra thông báo.

**Acceptance Scenarios:**

1. **Given** callback nhận `error=access_denied`, **When** trình duyệt về `/login?error=...`, **Then** thông báo cố định hiện dưới nút và nút bấm lại được.
2. **Given** lời gọi `signInWithOAuth` bị chặn mạng, **When** bấm nút, **Then** nút bật lại và thông báo hiện.

#### US003_ViewTodo *(A5)*

**Independent Test:** Đặt phiên giả, mở `/todo`, kiểm tra email.

**Acceptance Scenarios:**

1. **Given** có phiên hợp lệ, **When** mở `/todo`, **Then** thấy email và nút Logout.

#### US004_Logout *(A6)*

**Independent Test:** Từ `/todo` bấm Logout.

**Acceptance Scenarios:**

1. **Given** có phiên, **When** bấm Logout, **Then** về `/login` và `/todo` lại bị chặn.

#### US005_GuardTodo *(A4)*

**Independent Test:** Mở `/todo` không cookie, và với cookie giả.

**Acceptance Scenarios:**

1. **Given** không có phiên hợp lệ, **When** mở `/todo`, **Then** về `/login`.

#### US006_SkipLogin *(A4)*

**Independent Test:** Mở `/login` có phiên.

**Acceptance Scenarios:**

1. **Given** có phiên hợp lệ, **When** mở `/login?error=x`, **Then** về `/todo`.

### 5.2 Assumptions

- *(A3)* Khi huỷ ở Google, dịch vụ xác thực chuyển về `redirectTo` với `error`/`error_description` và không có `code` — suy từ hành vi chung của GoTrue, chưa có xác nhận trong tài liệu chính thức.
- *(A4)* Next.js 16 dùng `proxy.ts` (export tên `proxy`, runtime Node.js) thay cho `middleware.ts`; nguồn là tài liệu nextjs.org v16.4.0, chưa đối chiếu với `node_modules/next/dist/docs` (bị chặn bởi hook trong lúc nghiên cứu).
- *(A2, A3)* Phiên bản dự kiến: `@supabase/ssr` 0.12.x, `@supabase/supabase-js` 2.117.x, `@playwright/test` 1.64.x (tra ngày 2026-10-08).
- *(A4)* Không bật Cache Components; nếu bật, các trang đọc cookie cần bọc trong `Suspense`.

### 5.3 Unresolved Questions

1. **`env()` cho `client_id`** *(A3)*: cấu hình `config.toml` hỗ trợ thay thế biến môi trường cho `client_id` hay chỉ cho `secret`? Nếu không, ghi cứng `client_id` (không phải bí mật).
2. **Tên tham số lỗi khi huỷ** *(A3)*: xác nhận bằng e2e hoặc smoke trên stack thật (SC-008).
3. ~~Cách xác minh phiên trong proxy~~ *(A4)* — **đã chốt**: `getUser()` (không cần JWKS trong server giả); `/todo` và logout kiểm lại bằng `getUser()` (clarifications.md, 2026-10-08).
4. ~~Tên biến khoá công khai~~ *(A2)* — **đã chốt**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clarifications.md, 2026-10-08).

### 5.4 Source References

Chưa có mã nguồn — xem `## 7. User Stories` trong functional-spec.md để biết hành vi dự kiến. Mục này sẽ được điền khi cài đặt xong.

#### Data Flow

```text
bấm nút -> signInWithOAuth (PKCE) -> Supabase authorize -> Google -> /auth/callback?code -> exchangeCodeForSession -> cookie phiên -> redirect /todo
mọi request -> proxy -> updateSession (làm mới cookie) -> DEC-001 -> trang hoặc redirect (kèm cookie)
```

### 5.5 Artifact References

| Artifact | File | Codes Used | Reviewed |
|----------|------|------------|----------|
| System Overview | TBD (draft) | TBD (draft) | [ ] |
| Architecture | TBD (draft) | TBD (draft) | [ ] |
| Feature List | [feature-list.md](../feature-list.md) | F001 | [x] |
| API Map | TBD (draft) | TBD (draft) | [ ] |
| Entities | TBD (draft) | TBD (draft) | [ ] |
| Screens | [functional-spec.md § 6](./functional-spec.md#6-screens) | TBD (draft) | [ ] |
| Behavior Logic | TBD (draft) | TBD (draft) | [ ] |
| Permissions Matrix | TBD (draft) | TBD (draft) | [ ] |
| User Stories | [functional-spec.md § 7](./functional-spec.md#7-user-stories) | US001, US002, US003, US004, US005, US006 | [ ] |
