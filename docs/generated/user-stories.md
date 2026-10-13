# User Stories

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08
**Analysis Scope**: Màn hình `SCR001_Login` (`app/login/**`) và `SCR002_Todo` (`app/todo/**`), hai Route Handler `ROUTE001` `GET /auth/callback` và `ROUTE002` `POST /auth/logout` (`app/auth/**`), lớp bảo vệ route (`proxy.ts`, `lib/supabase/proxy.ts`), bộ ngôn ngữ vi/en (`lib/i18n/**`) và đăng nhập Google (`lib/auth/sign-in-with-google.ts`). Mã nguồn là nguồn sự thật; các spec trong `e2e/` là bằng chứng về ý định.

**Code Format**: All US codes MUST follow `US###_NameSlug` format (e.g., US001_Login, US002_ViewDashboard)

**US Types**:
- `ui` - User-facing stories (require Screen mapping)
- `system` - System stories: hook, event, observer, bg-job, trigger, etc. (no Screen mapping needed)

**Note**: Feature mapping is managed in FeatureList.md only. This document contains user stories without direct feature references. UI US require Screen mapping; system/bg-job US do not. `ui`-typed stories may map to `SCR###` or `SCR###/REG###`; non-`ui` types map to `SCR###` only (or omit).

Toàn bộ 8 story đều là `ui`: `behavior-logic.md` không có BL### nào, và hệ thống không có tác nhân nền độc lập (không job, không hook, không webhook) nên không có story `system`. Mọi tác nhân là người thật: `Khách` (chưa có phiên Supabase hợp lệ, tương ứng `anonymous` trong permissions-matrix.md) và `Người dùng đã đăng nhập` (tương ứng `authenticated`).

## Interaction Inventory

> Complete this table BEFORE writing any US. One row per interactive element per screen.
> Source of truth for US count — every row maps to ≥1 US below (unless merge exception applies).
> See: references/user-stories-ipe-protocol.md for enumeration rules and merge exception.

Các hàng 1 đến 5 là phần tử giao diện tương tác thật (đếm từ `app/login/**` và `app/todo/**`). Các hàng 6 đến 9 không phải phần tử giao diện mà là điểm vào bằng URL do chính người dùng khởi tạo (gõ địa chỉ, mở lại trang, quay về từ Google); chúng được liệt kê để các story điều hướng có điểm neo, vì proxy và trang quyết định kết quả chứ không có nút bấm nào.

| Screen | Element | Type | Action | Endpoint |
|--------|---------|------|--------|---------|
| SCR001_Login | LoginButton "LOGIN With Google" (`login-button.tsx:14`, nối ở `google-login-container.tsx:33-40`) | primary-action | Khóa nút, hiện vòng quay, khởi tạo OAuth PKCE của Supabase rồi chuyển cùng tab sang Google; khởi tạo hỏng thì hiện lỗi và trả focus về nút | Client SDK `signInWithOAuth` (không có URL riêng của ứng dụng); `redirectTo` = `/auth/callback` (ROUTE001) |
| SCR001_Login | LanguageSelectorTrigger (`language-selector.tsx:56`) | secondary-action | Mở hoặc đóng menu VN/EN (chỉ đổi state cục bộ `open`) | N/A (state cục bộ) |
| SCR001_Login | Language option VN (`language-selector.tsx:86`, `data-testid="language-option-vi"`) | secondary-action | Gọi `setLocale('vi')`: ghi cookie `NEXT_LOCALE` rồi `refresh()`; trùng ngôn ngữ hiện tại thì chỉ đóng menu | Server Action `setLocale` (`lib/i18n/set-locale-action.ts:16`, không có URL riêng) |
| SCR001_Login | Language option EN (`language-selector.tsx:86`, `data-testid="language-option-en"`) | secondary-action | Gọi `setLocale('en')`, như dòng trên | Server Action `setLocale` (không có URL riêng) |
| SCR002_Todo | LogoutButton (`app/todo/logout-button.tsx:10`, trong `<form action="/auth/logout" method="post">` ở `page.tsx:39`) | destructive-action | Gửi form POST (điều hướng cả trang), kết thúc phiên cục bộ rồi về `/login`; nút bị khóa sau khi bấm | POST /auth/logout (ROUTE002) |
| SCR002_Todo | Mở `/todo` khi đã đăng nhập (sau callback thành công hoặc gõ URL) | navigation | Trang đọc `getUser()` và hiện email cùng nút đăng xuất | GET /todo |
| SCR002_Todo | Mở `/todo` khi chưa đăng nhập (kể cả `/todo/x`, `/todo?a=1`) | navigation | Proxy chuyển về `/login`, bỏ query | GET /todo (qua `proxy.ts`) |
| SCR001_Login | Mở `/login` khi đã đăng nhập (kể cả `/login?error=x`) | navigation | Proxy chuyển sang `/`, bỏ query | GET /login (qua `proxy.ts`) |
| SCR001_Login | Quay lại hoặc mở lại `/login`, `/todo` sau khi đã chọn ngôn ngữ; hoặc cookie hỏng | navigation | Máy chủ đọc cookie `NEXT_LOCALE`, dựng giao diện theo ngôn ngữ đó (mặc định `vi`) | GET /login, GET /todo |

Phần tử không tương tác, đã loại khỏi bảng: logo (`login-header.tsx:18`), chân trang (`login-footer.tsx:8`), tiêu đề hình và hai dòng giới thiệu (`login-hero-intro.tsx`), thông báo lỗi `role="alert"` (`login-error-message.tsx:5-11`; kết quả của lần đăng nhập thất bại, không bấm được), tiêu đề và dòng email trên `/todo` (`page.tsx:34-38`). Điều hướng thụ động không có story riêng: `/` chỉ `redirect("/login")` (`app/page.tsx:5-7`), và các lần chuyển hướng 307 của `GET /auth/callback` (`app/auth/callback/route.ts:36-40`) được tính vào US001 và US002.

## User Story Index

| Code | Title | Type | Priority | Screens |
|------|-------|------|----------|---------|
| US001_Login | Login With Google | ui | High | SCR001_Login, SCR002_Todo |
| US002_LoginFailure | View Login Error | ui | High | SCR001_Login |
| US003_ViewTodo | View Todo | ui | Medium | SCR002_Todo |
| US004_Logout | Logout | ui | High | SCR002_Todo, SCR001_Login |
| US005_GuardTodo | Open Todo While Signed Out | ui | High | SCR002_Todo, SCR001_Login |
| US006_SkipLogin | Open Login While Signed In | ui | Medium | SCR001_Login, SCR002_Todo |
| US007_SelectLanguage | Select Language | ui | Medium | SCR001_Login |
| US008_KeepLanguage | Keep Language | ui | Medium | SCR001_Login, SCR002_Todo |

---

## US001_Login: Login With Google

**Type**: ui
**Interaction**: primary-action
**Priority**: High
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

> Title must use ONE action verb. Anti-CRUD: "manage", "CRUD", compound "create/edit" are invalid.

Là Khách, tôi muốn đăng nhập bằng tài khoản Google của mình để vào ứng dụng mà không phải tạo mật khẩu riêng.

### Acceptance Criteria

- [ ] Criterion 1: Bấm "LOGIN With Google" thì chính tab hiện tại chuyển sang Google (OAuth PKCE, `provider=google`, có `code_challenge` phương pháp `s256`, `redirect_to` chứa `/auth/callback`); không mở tab hay popup mới (`lib/auth/sign-in-with-google.ts:15-18`).
- [ ] Criterion 2: Từ lúc bấm đến khi trình duyệt rời trang, nút bị vô hiệu hóa, `aria-busy="true"` và logo Google được thay bằng vòng quay có chữ ẩn `login.loading` (`login-button.tsx:17-35`).
- [ ] Criterion 3: Google xác thực xong, `GET /auth/callback?code=...` đổi `code` lấy phiên rồi trả 307 về `/` (trang chủ) (`app/auth/callback/route.ts:40`).
- [ ] Criterion 4: Mọi tài khoản Google đều đăng nhập được, không giới hạn tên miền (`clarifications.md`, không có kiểm tra nào trong `app/auth/callback/route.ts`).

### Technical Notes

- **Endpoint**: Client SDK `supabase.auth.signInWithOAuth` (không có URL riêng của ứng dụng) rồi `GET /auth/callback` (ROUTE001). Thành công 307 `/`, thất bại 307 `/login?error=auth_failed` (xem US002).
- **Data Required**: Nhãn `login.button`, `login.loading` từ từ điển theo `NEXT_LOCALE`; `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`lib/supabase/config.ts`); cookie PKCE do thư viện Supabase ghi.
- **Dependencies**: Supabase Auth cùng nhà cung cấp Google; `GET /auth/callback` là `Route Handler`, `proxy.ts` cố ý bỏ qua mọi đường dẫn `/auth/` để không ghi đè cookie PKCE (`lib/supabase/proxy.ts:20-21`, PERM003). Khi trang được khôi phục từ bộ nhớ đệm back/forward (`pageshow` có `persisted`), trạng thái đang khởi tạo được đặt lại về `idle` (`google-login-container.tsx:23-29`).

### Screens

- SCR001_Login: Login (nơi bấm nút)
- SCR002_Todo: Todo (đích sau khi đăng nhập thành công)

### Background Logic

- Không có BL###: `behavior-logic.md` không có mục nào; luồng đổi `code` nằm gọn trong ROUTE001.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Khách đang ở `/login`, Google được stub ở mạng | Bấm "LOGIN With Google" | Cùng tab đi qua Google rồi về `/` (trang chủ); không có popup; chỉ có đúng một yêu cầu authorize (`e2e/login-screen-layout-and-button.spec.ts:114`, `e2e/auth-flow-and-route-guards.spec.ts:31`) |
| Loading | Yêu cầu authorize bị giữ lại | Bấm nút | Nút bị khóa và hiện vòng quay (`e2e/login-screen-layout-and-button.spec.ts:103`) |
| Error Case | `signInWithOAuth` trả lỗi hoặc ném ngoại lệ | Bấm nút | `signInWithGoogle` trả `ok: false`, chuyển sang trạng thái lỗi (chi tiết ở US002); không văng ngoại lệ ra ngoài (`sign-in-with-google.ts:19-22`) |

---

## US002_LoginFailure: View Login Error

**Type**: ui
**Interaction**: secondary-action
**Priority**: High
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Khách, tôi muốn thấy thông báo khi đăng nhập thất bại hoặc bị hủy để biết chưa vào được và bấm thử lại ngay, thay vì kẹt ở màn trắng hay trạng thái tải vô tận.

### Acceptance Criteria

- [ ] Criterion 1: Khi callback có tham số `error`, thiếu `code`, `code` dài quá 2048 ký tự hoặc đổi `code` thất bại, trình duyệt về `/login?error=auth_failed` (`app/auth/callback/route.ts:36-40`).
- [ ] Criterion 2: Màn Login hiện đúng một đoạn `<p role="alert">` với câu cố định `login.error` (đúng ngôn ngữ đang chọn) dưới nút; `/login` không có cờ lỗi thì không có đoạn nào (`login-error-message.tsx:5-11`, `google-login-container.tsx:31`).
- [ ] Criterion 3: Chỉ việc `?error=` có giá trị khác rỗng mới được xét; nội dung tham số và văn bản lỗi của nhà cung cấp không bao giờ được hiển thị, mã HTML trong tham số không được chèn vào trang (`app/login/page.tsx:22-24`).
- [ ] Criterion 4: Khởi tạo OAuth hỏng ngay trên trang (`signInWithGoogle` trả `ok: false`) cũng hiện cùng thông báo và đưa focus về nút (`google-login-container.tsx:36-39`).
- [ ] Criterion 5: Nút "LOGIN With Google" dùng lại được ngay; thử lại thành công thì vào `/` (`e2e/auth-flow-and-route-guards.spec.ts:120`). Trong lúc đang khởi tạo lần mới, thông báo lỗi được ẩn (`showError` chỉ đúng khi `error` hoặc `idle` kèm cờ).

### Technical Notes

- **Endpoint**: `GET /auth/callback` (ROUTE001) trả 307 `/login?error=auth_failed`; không có endpoint thất bại nào khác.
- **Data Required**: Chuỗi `login.error` từ từ điển; cờ `?error=` (chỉ xét có hay không).
- **Dependencies**: US001 là cách thường gặp để vào trạng thái này, nhưng người dùng cũng vào được bằng cách mở thẳng `/login?error=...`, nên story kiểm tra được độc lập. Người đã đăng nhập mở URL này bị chuyển sang `/` (xem US006).

### Screens

- SCR001_Login: Login

### Background Logic

- Không có BL###.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path (hủy ở Google) | Khách vừa hủy ở màn Google | Trình duyệt tới `/auth/callback?error=access_denied&error_description=...` | Về `/login?error=...`, một thông báo lỗi cố định, không lộ chữ của nhà cung cấp, nút dùng lại được (`e2e/auth-flow-and-route-guards.spec.ts:37`) |
| Error Case (code bị từ chối) | `code` không hợp lệ | Mở `/auth/callback?code=not-a-valid-code` | Về `/login?error=` kèm thông báo (`e2e/auth-flow-and-route-guards.spec.ts:45`) |
| Error Case (thiếu code) | Không có `code` lẫn `error` | Mở `/auth/callback` | Về `/login?error=` kèm thông báo (`e2e/auth-flow-and-route-guards.spec.ts:51`) |
| Error Case (cờ lỗi độc hại) | Cờ chứa `<img onerror=...>` | Mở `/login?error=<...>` | Chỉ thấy câu cố định, không phần tử chèn thêm (`e2e/auth-flow-and-route-guards.spec.ts:67`) |

---

## US003_ViewTodo: View Todo

**Type**: ui
**Interaction**: navigation
**Priority**: Medium
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Người dùng đã đăng nhập, tôi muốn xem trang Todo có hiện email của mình để biết đang đăng nhập bằng tài khoản Google nào, tránh nhầm khi dùng nhiều tài khoản.

### Acceptance Criteria

- [ ] Criterion 1: `/todo` hiện tiêu đề `todo.title`, nhãn `todo.emailLabel` kèm email của tài khoản hiện tại (`data-testid="todo-email"`) và nút đăng xuất (`app/todo/page.tsx:34-40`).
- [ ] Criterion 2: Tài khoản không có email thì hiện `todo.emailMissing` ("—") thay vì để trống (`page.tsx:37`).
- [ ] Criterion 3: Email lấy từ `supabase.auth.getUser()` (Auth server xác minh), không lấy từ cookie đã giải mã (`page.tsx:26-27`).
- [ ] Criterion 4: Trang chưa có danh sách việc cần làm thật; story chỉ bao phủ phần hiển thị tài khoản.

### Technical Notes

- **Endpoint**: GET /todo (trang Server Component, được `proxy.ts` bảo vệ).
- **Data Required**: Supabase Auth `User` (chỉ đọc `email`); các khóa `todo.*` từ từ điển theo `NEXT_LOCALE`.
- **Dependencies**: Có phiên hợp lệ, tức là US001 đã xong hoặc cookie phiên còn hiệu lực. Tạo kết nối Supabase phía máy chủ ở `lib/supabase/server.ts`.

### Screens

- SCR002_Todo: Todo

### Background Logic

- Không có BL###.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Đã đăng nhập bằng Google (stub) với `e2e@example.com` | Vào `/todo` | `todo-email` có đúng `e2e@example.com`, thấy nút đăng xuất (`e2e/auth-flow-and-route-guards.spec.ts:31`) |
| Error Case | Phiên hết hạn hoặc không còn hợp lệ khi trang dựng | `getUser()` không trả người dùng | Trang `redirect('/login')`, không hiện dữ liệu cá nhân (`app/todo/page.tsx:28`, PERM006) |

---

## US004_Logout: Logout

**Type**: ui
**Interaction**: destructive-action
**Priority**: High
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Người dùng đã đăng nhập, tôi muốn đăng xuất khỏi thiết bị này để bảo vệ tài khoản khi dùng máy chung.

### Acceptance Criteria

- [ ] Criterion 1: Bấm nút đăng xuất gửi form `POST /auth/logout` (điều hướng cả trang, không phải Server Action); phản hồi luôn là 303 về `/login` kèm `Cache-Control: private, no-store` (`app/auth/logout/route.ts:32-35`, `page.tsx:39`).
- [ ] Criterion 2: Chỉ phiên trên thiết bị hiện tại bị kết thúc: `signOut({ scope: "local" })`; các thiết bị khác không bị đăng xuất (`route.ts:19`).
- [ ] Criterion 3: Phiên đã hết hạn hoặc `signOut` lỗi vẫn kết thúc ở `/login` và cookie `sb-*-auth-token*` bị xóa (`route.ts:5,15-30`).
- [ ] Criterion 4: Sau đăng xuất, mở lại `/todo` bị chuyển về `/login`; bấm Back không còn thấy email hay dữ liệu người dùng cũ trong DOM (`e2e/auth-flow-and-route-guards.spec.ts:84,95`).
- [ ] Criterion 5: Nút bị khóa ngay sau lần bấm đầu để không gửi hai lần (`app/todo/logout-button.tsx:13-14`); `GET /auth/logout` trả 405 nên không thể đăng xuất bằng đường link (`route.ts:7-9`).

### Technical Notes

- **Endpoint**: POST /auth/logout (ROUTE002), Route Handler, chỉ xuất `POST`.
- **Data Required**: Cookie phiên Supabase `sb-<ref>-auth-token(.n)`; nhãn `todo.logout`.
- **Dependencies**: Cần đang ở `/todo` (US003). `proxy.ts` bỏ qua `/auth/*` nên handler tự xử lý phiên (PERM003, PERM007). Giới hạn đã chấp nhận: đăng xuất cục bộ, không thu hồi token ở thiết bị khác (`clarifications.md`).

### Screens

- SCR002_Todo: Todo (nơi bấm nút)
- SCR001_Login: Login (nơi trình duyệt dừng lại)

### Background Logic

- Không có BL###.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Đã đăng nhập, đang ở `/todo` | Bấm đăng xuất | Về `/login`; mở `/todo` lại thì bị chuyển về `/login` (`e2e/auth-flow-and-route-guards.spec.ts:84`) |
| Back sau đăng xuất | Vừa đăng xuất | Bấm Back của trình duyệt | Vẫn ở `/login`, không còn `todo-email`, không có `e2e@example.com` trong trang (`e2e/auth-flow-and-route-guards.spec.ts:95`) |
| Error Case | Phiên đã hết hạn hoặc Auth server không trả lời | Bấm đăng xuất | Vẫn 303 về `/login` và cookie phiên bị xóa (`route.ts:17-30`, không có e2e riêng) |

---

## US005_GuardTodo: Open Todo While Signed Out

**Type**: ui
**Interaction**: navigation
**Priority**: High
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Khách, tôi muốn được đưa về màn Login khi mở trang Todo lúc chưa đăng nhập để đăng nhập trước, còn dữ liệu của người đã đăng nhập không bao giờ hiện cho tôi.

### Acceptance Criteria

- [ ] Criterion 1: Khách mở `/todo` hoặc `/todo/...` bị `redirect` về `/login`, query bị xóa (`lib/supabase/proxy.ts:9-11,58,65`).
- [ ] Criterion 2: Quyết định dựa trên `supabase.auth.getUser()` (Auth server xác minh), nên cookie phiên bị sửa thành rác cũng bị chuyển về `/login` (`lib/supabase/proxy.ts:47`, `e2e/auth-flow-and-route-guards.spec.ts:111`).
- [ ] Criterion 3: Auth server không trả lời thì coi như chưa đăng nhập (fail closed), vẫn chuyển về `/login` (`lib/supabase/proxy.ts:49-51`, PERM005).
- [ ] Criterion 4: Lớp thứ hai: trang `/todo` tự gọi `getUser()` và `redirect('/login')` nếu không có người dùng, kể cả khi lọt qua proxy (`app/todo/page.tsx:27-28`, PERM006).

### Technical Notes

- **Endpoint**: GET /todo qua `proxy.ts` (`updateSession`); phản hồi là `NextResponse.redirect` tới `/login`.
- **Data Required**: Cookie phiên Supabase (có thể rỗng hoặc hỏng).
- **Dependencies**: PERM001_TodoRouteGuard, PERM005_AuthErrorFailClosed, PERM006_TodoPageSessionRecheck (permissions-matrix.md). Story này diễn đạt hành vi bảo vệ từ phía khách (kết quả quan sát được là màn Login), không phải tác vụ nền.

### Screens

- SCR002_Todo: Todo (trang bị chặn)
- SCR001_Login: Login (nơi khách bị đưa tới)

### Background Logic

- Không có BL###: lớp bảo vệ được lập hồ sơ ở permissions-matrix.md, không phải BL.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Khách chưa đăng nhập | Mở `/todo`, `/todo/x`, `/todo?a=1` | Cả ba về `/login` (`e2e/auth-flow-and-route-guards.spec.ts:23`) |
| Error Case | Cookie phiên bị thay bằng `garbage` | Mở `/todo` | Về `/login`, không có quyền vào (`e2e/auth-flow-and-route-guards.spec.ts:111`) |

---

## US006_SkipLogin: Open Login While Signed In

**Type**: ui
**Interaction**: navigation
**Priority**: Medium
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Người dùng đã đăng nhập, tôi muốn mở màn Login lúc phiên còn hiệu lực mà được đưa thẳng tới trang Todo để khỏi đăng nhập lại.

### Acceptance Criteria

- [ ] Criterion 1: `/login` (so khớp đúng đường dẫn) khi `getUser()` trả người dùng thì `redirect` sang `/`, query bị xóa (`lib/supabase/proxy.ts:83`).
- [ ] Criterion 2: Kể cả khi URL có cờ lỗi (`/login?error=x`), người đã đăng nhập vẫn sang `/` (`e2e/auth-flow-and-route-guards.spec.ts:75`).
- [ ] Criterion 3: Mở `/` khi đã đăng nhập hiện trang chủ (`app/(main)/page.tsx`); `/login` sang `/` (không còn `/todo`, `app/page.tsx` đã xoá).
- [ ] Criterion 4: Khách vẫn xem `/login` bình thường (PERM002).

### Technical Notes

- **Endpoint**: GET /login qua `proxy.ts` (`updateSession`).
- **Data Required**: Cookie phiên Supabase hợp lệ; cookie được làm mới phải sang cả phản hồi redirect (`lib/supabase/proxy.ts:54-63`).
- **Dependencies**: PERM002_LoginRedirectForSignedIn. Điều kiện chỉ là `pathname === "/login"` chứ không phải tiền tố.

### Screens

- SCR001_Login: Login (trang bị chuyển đi)
- SCR002_Todo: Todo (đích)

### Background Logic

- Không có BL###.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Đã đăng nhập | Mở `/login` | Về `/` (`e2e/auth-flow-and-route-guards.spec.ts:75`) |
| Error Case (cờ lỗi kèm theo) | Đã đăng nhập | Mở `/login?error=x` | Vẫn về `/`, không hiện thông báo lỗi (`e2e/auth-flow-and-route-guards.spec.ts:78-79`) |

---

## US007_SelectLanguage: Select Language

**Type**: ui
**Interaction**: secondary-action
**Priority**: Medium
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Khách, tôi muốn chọn tiếng Việt hoặc tiếng Anh ngay trên header của màn Login để đọc hiểu nội dung trước khi đăng nhập.

### Acceptance Criteria

- [ ] Criterion 1: Bộ chọn nằm góc phải header, hiện cờ, mã (`VN` hoặc `EN`) và mũi tên; mặc định `VN` (`language-selector.tsx:56-78`).
- [ ] Criterion 2: Bấm bộ chọn mở menu hai lựa chọn VN và EN (EN dùng cờ Anh); bấm lại, nhấn Escape (focus về nút) hoặc bấm ra ngoài thì đóng (`language-selector.tsx:29-45`).
- [ ] Criterion 3: Bàn phím: Enter hoặc Space (nút thật) mở menu, Tab tới được từng lựa chọn; không có điều hướng bằng phím mũi tên (`e2e/language-selector-localization.spec.ts:68`).
- [ ] Criterion 4: Chọn EN thì mọi chuỗi từ từ điển, nhãn bộ chọn và thuộc tính `lang` của trang chuyển sang tiếng Anh; "ROOT FURTHER" và "LOGIN With Google" giữ nguyên (`e2e/language-selector-localization.spec.ts:81`).
- [ ] Criterion 5: Chọn đúng ngôn ngữ đang dùng chỉ đóng menu, không ghi cookie, không gọi máy chủ (`language-selector.tsx:47-50`, `e2e/language-selector-localization.spec.ts:107`).
- [ ] Criterion 6: Trong lúc `setLocale` đang chạy, hai lựa chọn bị khóa (`pending`) (`language-selector-container.tsx:11-18`, `language-selector.tsx:90`).

### Technical Notes

- **Endpoint**: Server Action `setLocale` (`lib/i18n/set-locale-action.ts:16`), không có URL riêng; giá trị ngoài `vi`/`en` bị bỏ qua im lặng (dòng 17).
- **Data Required**: Locale hiện tại (`getLocale()`), nhãn `language.vi`, `language.en`, `language.menu`, cờ `public/images/login/flag-vn.svg`, `flag-gb.svg`.
- **Dependencies**: Chỉ có trên SCR001_Login (người đã đăng nhập không tới được màn này, xem US006). Không dùng thư viện i18n, từ điển tự viết ở `lib/i18n/dictionary-vi.ts`, `dictionary-en.ts`.

### Screens

- SCR001_Login: Login

### Background Logic

- Không có BL###.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Login đang tiếng Việt | Bấm bộ chọn rồi chọn EN | Menu đóng, mọi chuỗi và `lang` chuyển sang tiếng Anh, bộ chọn hiện "EN" (`e2e/language-selector-localization.spec.ts:81`) |
| Error Case (chọn lại ngôn ngữ hiện tại) | Đang là VN | Mở menu, chọn VN | Menu đóng, không có cookie `NEXT_LOCALE` (`e2e/language-selector-localization.spec.ts:107`) |
| Error Case (đóng không đổi) | Menu đang mở | Nhấn Escape hoặc bấm ra ngoài | Menu đóng, ngôn ngữ giữ nguyên (`e2e/language-selector-localization.spec.ts:52`) |

---

## US008_KeepLanguage: Keep Language

**Type**: ui
**Interaction**: navigation
**Priority**: Medium
**Estimate**: N/A (đã hiện thực, xem Notes)

### User Story

Là Khách, tôi muốn mở lại ứng dụng và thấy đúng ngôn ngữ đã chọn để không phải chọn lại mỗi lần ghé.

### Acceptance Criteria

- [ ] Criterion 1: Sau khi chọn, cookie `NEXT_LOCALE` được lưu với `path=/`, `SameSite=Lax`, `max-age` một năm; tải lại hoặc mở lại `/login` vẫn ra ngôn ngữ đó (`lib/i18n/set-locale-action.ts:22-26`, `lib/i18n/locale-config.ts:6`).
- [ ] Criterion 2: Chưa chọn lần nào, hoặc giá trị cookie không hợp lệ (kể cả sai chữ hoa chữ thường), thì ra tiếng Việt và không báo lỗi (`lib/i18n/locale-config.ts:9-16`).
- [ ] Criterion 3: Thuộc tính `lang` của `<html>` và tiêu đề tab khớp ngôn ngữ đang hiển thị (`app/layout.tsx:22-30`).
- [ ] Criterion 4: Ngôn ngữ đã lưu cũng áp cho `/todo` (nhãn email và nút đăng xuất) sau khi đăng nhập (`app/todo/page.tsx:30`, `e2e/language-selector-localization.spec.ts:123`).

### Technical Notes

- **Endpoint**: GET /login và GET /todo đọc cookie qua `getLocale()` (`lib/i18n/get-locale.ts:5-7`); ghi cookie nằm ở US007 (`setLocale`).
- **Data Required**: Cookie `NEXT_LOCALE` (`vi` hoặc `en`); từ điển cho cả `login.*` và `todo.*`.
- **Dependencies**: US007 tạo ra cookie, nhưng story kiểm tra được độc lập bằng cách đặt sẵn cookie. Giá trị chưa lưu được vì trình duyệt chặn cookie thì trang vẫn hiện ngôn ngữ cũ, không báo lỗi (theo `docs/features/F002_Localization/functional-spec.md`, chưa có e2e riêng).

### Screens

- SCR001_Login: Login
- SCR002_Todo: Todo (nhãn theo cùng cookie)

### Background Logic

- Không có BL###.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Khách đã chọn EN ở lần trước | Tải lại hoặc mở lại `/login` | Trang tiếng Anh, bộ chọn hiện "EN", `lang="en"` (`e2e/language-selector-localization.spec.ts:81`) |
| Error Case | Cookie `NEXT_LOCALE=xx` | Mở `/login` | Hiện "VN", `lang="vi"`, không lỗi (`e2e/language-selector-localization.spec.ts:116`) |
| Áp cho Todo | Cookie `NEXT_LOCALE=en`, đã đăng nhập | Vào `/todo` | Nút "Logout" hiện, không còn "Đăng xuất" (`e2e/language-selector-localization.spec.ts:123`) |

---

## Screen → US Map

| Screen | US Codes |
|--------|---------|
| SCR001_Login | US001_Login, US002_LoginFailure, US004_Logout, US005_GuardTodo, US006_SkipLogin, US007_SelectLanguage, US008_KeepLanguage |
| SCR002_Todo | US001_Login, US003_ViewTodo, US004_Logout, US005_GuardTodo, US006_SkipLogin, US008_KeepLanguage |

> Không màn hình nào có 0 US, nên không phát sinh `[IPE_ZERO]`.

## Notes

- **Kết quả IPE**: 9 hàng trong Interaction Inventory (5 phần tử tương tác, 4 điểm vào URL), ra 8 US. SCR001_Login có 4 phần tử tương tác và 2 điểm vào URL, SCR002_Todo có 1 phần tử và 2 điểm vào URL; US count (8) lớn hơn số SCR (2) và không màn nào dưới ngưỡng `[IPE_SPARSE]`.
- **Giữ nguyên sáu story của F001** theo bản nháp tiến phía trước (`docs/features/F001_Auth/functional-spec.md` § 7), đúng thứ tự và slug: US001_Login, US002_LoginFailure, US003_ViewTodo, US004_Logout, US005_GuardTodo, US006_SkipLogin. Mã nguồn xác nhận từng story có một ý định, tác nhân là người và kết quả quan sát được. Không tách, không gộp thêm ở phần này.
- **US007 và US008 là hai story của F002** (Localization). Chúng nhận mã toàn cục kế tiếp. Lưu ý: `docs/features/F002_Localization/functional-spec.md` đánh số cục bộ `US001`/`US002` (chọn ngôn ngữ, giữ ngôn ngữ); bước feature-specs phải ánh xạ chúng sang `US007_SelectLanguage` và `US008_KeepLanguage` toàn cục.
- **Gộp có chủ đích `[IPE_MERGE]` trong US007**: `LanguageSelectorTrigger` + option VN + option EN thành một US. (a) cùng tác nhân Khách; (b) hai option dùng cùng Server Action `setLocale`, còn nút mở menu chỉ đổi state cục bộ `open` nên không có endpoint riêng và không phải ý định độc lập (mở menu không có kết quả nghiệp vụ nếu không chọn); (c) cùng luồng dữ liệu, VN và EN chỉ khác tham số. Nhánh "chọn đúng ngôn ngữ đang dùng" là một biến thể trong cùng luồng (`language-selector.tsx:49`), không phải luồng thứ hai.
- **Không tách US002 khỏi US001 theo kiểu "một phần tử = một US" ngược lại**: cùng một nút (`LoginButton`) cho ra hai kết cục khác nhau về nghiệp vụ (vào được và bị từ chối). Hai kết cục có điểm vào, kết quả quan sát và cách kiểm thử riêng (US002 kiểm được bằng cách mở `/login?error=...` trực tiếp), nên giữ hai story.
- **US005 và US006 là hành vi bảo vệ route diễn đạt từ phía người dùng**: tác nhân là Khách hoặc Người dùng đã đăng nhập, kết quả là màn hình họ thấy (Login hoặc Todo), nên đặt `ui` và ánh xạ SCR### thay vì `system`. Cơ chế (`proxy.ts`) nằm ở permissions-matrix.md (PERM001, PERM002, PERM005, PERM006), không có BL.
- **`US003_ViewTodo`, `US005`, `US006`, `US008` có `Interaction: navigation`** vì điểm khởi đầu là mở một URL do người dùng chủ động; không có nút bấm nào kích hoạt chúng. Đây không phải điều hướng thụ động của hệ thống.
- **US004 là `destructive-action`** (kết thúc, thu hồi cục bộ phiên) nên là story riêng theo luật IPE về hành động hủy.
- **Chỗ lệch cần nhớ**: đăng xuất là Route Handler `POST /auth/logout` (ROUTE002), nhận form POST thuần, không phải Server Action (`app/todo/page.tsx:39`, `app/auth/logout/route.ts:12`). Server Action duy nhất trong nhóm story này là `setLocale` (US007).
- **Priority và Estimate**: Priority (High cho đăng nhập, đăng xuất, báo lỗi, chặn `/todo`; Medium cho phần còn lại) là suy luận từ độ trọng yếu của luồng xác thực, nhãn `[INFERRED]`. Estimate ghi `N/A (đã hiện thực)` vì mã đã có, không có nguồn nào cho con số ước lượng.
- **Phạm vi không có story riêng** (đã cân nhắc): `/` chuyển sang `/login` (điều hướng thụ động, đã nằm trong US006 Criterion 3 và e2e `root path redirects to /login`); logo, chân trang, bố cục responsive (không tương tác, thuộc đặc tả giao diện SCR001_Login).

## Cross-Reference Validation

- [x] All US### codes are unique
- [x] All acceptance criteria are testable
- [x] All technical notes are complete
- [x] All US### codes are referenced in FeatureList.md (`artifacts/feature-list.md`: F001_Auth giữ US001 đến US006, F002_Localization giữ US007 và US008)
- [x] All `ui` US### mapped to SCR### or SCR###/REG### (parent SCR must exist in ScreenList; system US excluded)
- [x] All system US### have at least one BL### mapped (UI US excluded): không có system US, behavior-logic.md có 0 BL
