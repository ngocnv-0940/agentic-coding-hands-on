# Permissions Matrix

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08
**Analysis Scope**: Next.js 16 App Router + Supabase Auth. Nguồn quyền: `proxy.ts`, `lib/supabase/proxy.ts`, `app/todo/page.tsx`, `app/auth/callback/route.ts`, `app/auth/logout/route.ts`, `app/page.tsx`, `lib/i18n/*`. Hệ thống quyền loại `other`: chỉ phân biệt `anonymous` và `authenticated`, không có RBAC, không có ownership, không có dữ liệu theo từng người dùng.

> **Raw PERM### matrix.** Machine-generated inventory of every permission item with full
> per-permission detail. The plain-language curated view lives at
> [permissions.md](../system/permissions.md). Write THIS file FIRST, then derive the curated
> view from it.

**Code Format**: All codes MUST follow `PERM###_NameSlug` format (e.g., PERM001_ViewReports, PERM002_EditUsers)

**Permission Types**:
- `route-guard` - Route-level authorization middleware
- `screen-permission` - UI element visibility/enabled rules
- `action-permission` - Button/action execution rules
- `data-permission` - Field-level access control
- `role-based` - Role-based access control rules
- `resource-ownership` - Owner/resource relationship checks
- `field-permission` - Column/field visibility rules
- `api-scope` - API scope/token permission
- `feature-flag` - Runtime-evaluated flag from a feature flag service or config
- `experiment` - A/B test variant assignment gate
- `env-gate` - Hardcoded check against an environment variable (fixed at deploy time)
- `locale-gate` - UI branch conditioned on the active locale or language setting

**source field** (required for `feature-flag`, `experiment`, `env-gate`, `locale-gate` types only):
- **`source:`** — file:line where the gate is referenced (traceability anchor)

**Note**: Feature mapping is managed in FeatureList.md. This document contains permission items without direct feature references.

**Roles**: `anonymous` (chưa có phiên Supabase hợp lệ theo `getUser()`), `authenticated` (có phiên hợp lệ; mọi tài khoản Google đều được, không giới hạn domain). Không có role nào khác trong mã nguồn.

**Route tokens**: `ROUTE001` = `GET /auth/callback`, `ROUTE002` = `POST /auth/logout` (route-list.md § Backend Routes). Trang giao diện (`/`, `/login`, `/todo`) nằm ở route-list.md § Frontend Routes/Pages và không có mã `ROUTE###`, nên ghi theo `(GET) path`.

## Permissions Index

| Code | Name | Type | Enforced At |
|------|------|------|-------------|
| PERM001_TodoRouteGuard | Chặn khách vào `/`, /todo và các trang giữ chỗ (kể cả đường dẫn con) | route-guard | `lib/supabase/proxy.ts:82` (qua `proxy.ts:4-6`) |
| PERM002_LoginRedirectForSignedIn | Người đã đăng nhập vào /login bị chuyển sang `/`; không phải admin vào /admin* bị chuyển về `/` | route-guard | `lib/supabase/proxy.ts:83,85-87` |
| PERM003_AuthPathsProxyBypass | Proxy bỏ qua mọi đường dẫn /auth/ | route-guard | `lib/supabase/proxy.ts:21` |
| PERM004_StaticAssetsProxyBypass | Proxy không chạy cho tệp tĩnh và tài nguyên Next | route-guard | `proxy.ts:8-13` |
| PERM005_AuthErrorFailClosed | Auth server lỗi thì coi như chưa đăng nhập | route-guard | `lib/supabase/proxy.ts:45-52` |
| PERM006_TodoPageSessionRecheck | Trang /todo tự kiểm lại phiên (lớp thứ hai) | route-guard | `app/todo/page.tsx:27-28` |
| PERM007_LogoutPostOnly | Đăng xuất chỉ nhận POST, luôn kết thúc phiên cục bộ | action-permission | `app/auth/logout/route.ts:12-35` |
| PERM008_OAuthCallbackCodeValidation | Callback chỉ đổi phiên khi `code` hợp lệ | action-permission | `app/auth/callback/route.ts:36-40` |
| PERM009_OAuthCallbackFixedRedirect | Callback chỉ chuyển tới hai đích cố định, không mở redirect | route-guard | `app/auth/callback/route.ts:4-19,31-40` |

---

## PERM001_TodoRouteGuard: Chặn khách vào `/`, /todo và các trang giữ chỗ

**Type**: route-guard
**Enforced At**: `lib/supabase/proxy.ts:82` (hàm `updateSession`, gọi từ `proxy.ts:4-6`); phạm vi đường dẫn ở `lib/supabase/proxy.ts:7-27`

### Description

Đường dẫn được bảo vệ là đúng `/` (khớp đúng, không theo tiền tố, kẻo `/login` cũng bị bảo vệ), hoặc đúng/bắt đầu bằng một trong `/todo`, `/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin` kèm dấu `/` (`isProtectedPath`, `lib/supabase/proxy.ts:7-27`). Layout `(main)` còn kiểm lại phiên cho `/` và các trang giữ chỗ (`app/(main)/layout.tsx:32-33`). Khách chưa đăng nhập bị `redirect` về `/login`, query bị xóa (`url.search = ""`, dòng 58). Quyết định dựa trên `supabase.auth.getUser()` (dòng 47, hỏi Auth server xác minh), không bao giờ dùng `getSession()` (ghi chú dòng 15). Mọi redirect đều copy cookie phiên đã làm mới và header cache sang response redirect (`redirectWithCookies`, dòng 55-63), nếu không phiên vừa refresh sẽ rơi mất. Người đã đăng nhập đi qua, nhận response đã gắn cookie làm mới (dòng 67).

### Related Routes

- (GET) /todo - frontend page (route-list.md § Frontend Routes/Pages, không có mã `ROUTE###`)

### Related Screens

- SCR002_Todo - Todo

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✗ | `getUser()` không trả người dùng: redirect `/login` |
| authenticated | ✓ | `getUser()` trả người dùng |

### Related Modules

- `proxy.ts`
- `lib/supabase/proxy.ts`
- `lib/supabase/config.ts`

---

## PERM002_LoginRedirectForSignedIn: Người đã đăng nhập vào /login bị chuyển sang `/`

**Type**: route-guard
**Enforced At**: `lib/supabase/proxy.ts:83,85-87` (gọi từ `proxy.ts:4-6`)

### Description

Điều kiện là `user && pathname === "/login"`, so khớp đúng `/login`, không phải tiền tố. Người đã đăng nhập mở `/login` (kể cả `/login?error=...`) bị redirect sang `/` (trang chủ), query bị xóa, cookie làm mới được copy sang redirect (dòng 55-63). Khách vẫn xem được `/login`. Trang `/` giờ là trang chủ (`app/(main)/page.tsx`), được `/` trong nhóm bảo vệ chặn khách (PERM001); `app/page.tsx` đã xoá.

### Related Routes

- (GET) /login - frontend page (route-list.md § Frontend Routes/Pages, không có mã `ROUTE###`)
- (GET) / - frontend page, trang chủ (route-list.md § Frontend Routes/Pages, không có mã `ROUTE###`)

### Related Screens

- SCR001_Login - Login
- SCR002_Todo - Todo

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Xem `/login` bình thường |
| authenticated | ✗ | Redirect `/` |

### Related Modules

- `proxy.ts`
- `lib/supabase/proxy.ts`
- `app/page.tsx`

---

## PERM003_AuthPathsProxyBypass: Proxy bỏ qua mọi đường dẫn /auth/

**Type**: route-guard
**Enforced At**: `lib/supabase/proxy.ts:21` (`pathname.startsWith("/auth/")` trả `NextResponse.next()`)

### Description

Đường dẫn bắt đầu bằng `/auth/` vẫn lọt matcher của `proxy.ts` nhưng `updateSession` trả về ngay, trước khi tạo Supabase client: không `getUser()`, không làm mới phiên, không redirect, không đụng cookie (dòng 20-21). Lý do trong mã: để `/auth/callback` tự đổi `code` mà proxy không ghi đè cookie PKCE. Hệ quả: hai Route Handler dưới `/auth/` không có lớp chặn của proxy và tự chịu trách nhiệm, xem PERM007, PERM008, PERM009.

### Related Routes

- ROUTE001 (GET) /auth/callback
- ROUTE002 (POST) /auth/logout

### Related Screens

- SCR001_Login - Login
- SCR002_Todo - Todo

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Proxy không chặn; việc xử lý do từng handler quyết định |
| authenticated | ✓ | Proxy không chặn; việc xử lý do từng handler quyết định |

### Related Modules

- `proxy.ts`
- `lib/supabase/proxy.ts`
- `app/auth/callback/route.ts`
- `app/auth/logout/route.ts`

---

## PERM004_StaticAssetsProxyBypass: Proxy không chạy cho tệp tĩnh và tài nguyên Next

**Type**: route-guard
**Enforced At**: `proxy.ts:8-13` (`config.matcher`)

### Description

Matcher loại khỏi proxy: `_next/static`, `_next/image`, `favicon.ico` và đường dẫn kết thúc bằng `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` (ví dụ ảnh `/images/login/*`). Các tài nguyên này công khai, không kiểm phiên, không làm mới cookie. Mọi đường dẫn còn lại đều đi qua `updateSession`.

### Related Routes

- (GET) /images/login/* - tài nguyên tĩnh trong `public/images/`, không phải route ứng dụng (không có trong route-list.md)

### Related Screens

- SCR001_Login - Login

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Tải tài nguyên tĩnh, không kiểm phiên |
| authenticated | ✓ | Như anonymous |

### Related Modules

- `proxy.ts`
- `public/images/`

---

## PERM005_AuthErrorFailClosed: Auth server lỗi thì coi như chưa đăng nhập

**Type**: route-guard
**Enforced At**: `lib/supabase/proxy.ts:45-52`

### Description

`getUser()` nằm trong `try`; nếu ném ngoại lệ (Auth server không trả lời) thì `user = null` (dòng 49-51, ghi chú "fail closed"). Nếu `getUser()` không ném nhưng `data.user` rỗng thì kết quả cũng là `null` (dòng 47-48). Khi `user` rỗng, hai cổng ở dòng 65-66 xử lý như khách: `/todo` bị đẩy về `/login`, `/login` không bị chuyển. Không có đường nào mở quyền khi lỗi.

### Related Routes

- (GET) /todo - frontend page (route-list.md § Frontend Routes/Pages, không có mã `ROUTE###`)
- (GET) /login - frontend page (route-list.md § Frontend Routes/Pages, không có mã `ROUTE###`)

### Related Screens

- SCR001_Login - Login
- SCR002_Todo - Todo

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Giữ nguyên quyền khách (xem `/login`, không vào `/todo`) |
| authenticated | ✗ | Khi Auth server lỗi hoặc không xác minh được phiên: bị coi như khách, `/todo` redirect `/login` |

### Related Modules

- `lib/supabase/proxy.ts`

---

## PERM006_TodoPageSessionRecheck: Trang /todo tự kiểm lại phiên (lớp thứ hai)

**Type**: route-guard
**Enforced At**: `app/todo/page.tsx:27-28` (component `UserPanel`)

### Description

Phòng thủ nhiều lớp, ghi trong mã ở dòng 25: proxy đã chặn `/todo`, nhưng trang vẫn gọi `supabase.auth.getUser()` phía máy chủ và `redirect('/login')` nếu không có người dùng. Chỉ khi có người dùng mới render email và form đăng xuất (dòng 32-43). Bắt trường hợp phiên mất hiệu lực sau khi qua proxy hoặc proxy bị bỏ sót.

### Related Routes

- (GET) /todo - frontend page (route-list.md § Frontend Routes/Pages, không có mã `ROUTE###`)

### Related Screens

- SCR002_Todo - Todo

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✗ | `getUser()` không trả người dùng: `redirect('/login')` |
| authenticated | ✓ | `getUser()` trả người dùng |

### Related Modules

- `app/todo/page.tsx`
- `lib/supabase/server.ts`

---

## PERM007_LogoutPostOnly: Đăng xuất chỉ nhận POST, luôn kết thúc phiên cục bộ

**Type**: action-permission
**Enforced At**: `app/auth/logout/route.ts:12-35` (chỉ export `POST`, dòng 12)

### Description

`app/auth/logout/route.ts` chỉ export `POST`, nên `GET /auth/logout` nhận 405 mặc định của Next.js và không thể đăng xuất qua liên kết (ghi chú dòng 8-9). Handler gọi `getUser()` (dòng 18) rồi `signOut({ scope: "local" })` (dòng 19, chỉ thiết bị hiện tại). Kết quả `getUser()` không dùng để chặn: ghi chú dòng 17 nói phiên hết hạn hoặc không hợp lệ vẫn phải kết thúc ở trạng thái đã đăng xuất. Nếu `signOut` trả lỗi hoặc ném ngoại lệ (dòng 20-23) thì xóa mọi cookie tên bắt đầu `sb-` và chứa `-auth-token` (dòng 25-30; `isAuthCookie`, dòng 5). Luôn trả 303 về `/login` (đường dẫn tương đối cố định), `Cache-Control: private, no-store` (dòng 32-35). Vì `/auth/` bị proxy bỏ qua (PERM003), chính handler này là chốt kiểm, không có lớp bảo vệ phía trước. Handler không từ chối ai: khách gọi POST chỉ nhận redirect, vì không có phiên nào để kết thúc.

### Related Routes

- ROUTE002 (POST) /auth/logout

### Related Screens

- SCR002_Todo - Todo (nút đăng xuất gửi form POST, `app/todo/page.tsx:39`)
- SCR001_Login - Login (đích chuyển tới)

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Chỉ với POST; không có phiên để kết thúc, vẫn nhận 303 `/login`. GET: 405 |
| authenticated | ✓ | Chỉ với POST; `signOut({ scope: "local" })`, nếu lỗi thì xóa cookie `sb-*-auth-token*`; 303 `/login`. GET: 405 |

### Related Modules

- `app/auth/logout/route.ts`
- `app/todo/logout-button.tsx`
- `lib/supabase/server.ts`

---

## PERM008_OAuthCallbackCodeValidation: Callback chỉ đổi phiên khi `code` hợp lệ

**Type**: action-permission
**Enforced At**: `app/auth/callback/route.ts:36-40` (hằng `MAX_CODE_LENGTH`, dòng 7; `exchangeCode`, dòng 21-29)

### Description

Callback không yêu cầu phiên có sẵn (đây là bước tạo phiên, và proxy bỏ qua theo PERM003). Quyền tạo phiên chỉ có khi cả ba điều kiện đúng: không có tham số `error`, có `code`, `code` dài tối đa 2048 ký tự (dòng 36). Một điều kiện sai thì trả 307 về `/login?error=auth_failed` ngay, không gọi Supabase. Đủ điều kiện thì `exchangeCodeForSession(code)`; lỗi hoặc ngoại lệ cũng trả 307 về `/login?error=auth_failed` (dòng 21-29, 40). Nội dung lỗi của nhà cung cấp không bao giờ chuyển tiếp (dòng 5). Handler không chặn người đã đăng nhập: không có kiểm tra phiên cũ.

### Related Routes

- ROUTE001 (GET) /auth/callback

### Related Screens

- SCR001_Login - Login (đích khi thất bại, `?error=auth_failed`)
- SCR002_Todo - Todo (đích khi thành công)

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Có `code`, độ dài ≤ 2048, không có `?error`, `exchangeCodeForSession` thành công; ngược lại 307 `/login?error=auth_failed` |
| authenticated | ✓ | Cùng điều kiện như anonymous; handler không kiểm phiên hiện có |

### Related Modules

- `app/auth/callback/route.ts`
- `lib/supabase/server.ts`
- `lib/auth/sign-in-with-google.ts`

---

## PERM009_OAuthCallbackFixedRedirect: Callback chỉ chuyển tới hai đích cố định, không mở redirect

**Type**: route-guard
**Enforced At**: `app/auth/callback/route.ts:4-19,31-40`

### Description

Đích của callback chỉ có hai hằng: `SUCCESS_PATH = "/"` và `FAILURE_PATH = "/login?error=auth_failed"` (dòng 4-6). Tham số `next` hoặc bất kỳ đích nào từ query không bao giờ được đọc (ghi chú dòng 31; `searchParams` chỉ dùng `error` và `code`, dòng 33-36). `Location` là đường dẫn tương đối (`redirectTo`, dòng 14-19), nên header `Host` hoặc `X-Forwarded-Host` giả không đổi được đích (ghi chú dòng 9-12). Nhờ đó không có open redirect. Handler đăng xuất cũng dùng `Location` tương đối cố định `/login` (`app/auth/logout/route.ts:34`).

### Related Routes

- ROUTE001 (GET) /auth/callback

### Related Screens

- SCR001_Login - Login
- SCR002_Todo - Todo

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| anonymous | ✓ | Chỉ được chuyển tới `/` hoặc `/login?error=auth_failed`, không chọn được đích khác |
| authenticated | ✓ | Như anonymous |

### Related Modules

- `app/auth/callback/route.ts`

---

## Summary

- **Total Permission Items**: 9
- **By Type**: route-guard: 7, screen-permission: 0, action-permission: 2, data-permission: 0, role-based: 0, resource-ownership: 0, field-permission: 0, api-scope: 0, feature-flag: 0, experiment: 0, env-gate: 0, locale-gate: 0

---

## Cross-Reference Validation

- [x] All PERM### codes are unique
- [x] All PERM### codes are referenced in FeatureList.md (PERM001..PERM009 đều được F001_Auth tham chiếu trong `artifacts/feature-list.md` mục Related Permissions; F002_Localization không có PERM theo thiết kế vì locale không phải quyền)
- [x] All related route references are valid (ROUTE001, ROUTE002 có trong route-list.md; trang giao diện tham chiếu bằng `(GET) path` vì không có mã `ROUTE###`)
- [x] All related screen references are valid (SCR001_Login, SCR002_Todo có trong screen-list.md; không dùng `SCR###/REG###` vì cả hai màn hình đều atomic)
- [x] All related module references are valid
- [x] No orphaned permission references

---

## Client-Side Gate Types

Đã quét cả bốn loại `feature-flag`, `experiment`, `env-gate`, `locale-gate` theo Extraction Signatures: không có PERM nào thuộc các loại này, nên không có mục cần trường `source:`.

- **feature-flag**: 0. Không có lời gọi `useFlag|useFeature|isEnabled|featureFlag|checkFlag` trong `app/`, `lib/`, `proxy.ts`, `next.config.ts`.
- **experiment**: 0. Không có `useExperiment|getVariant|abTest`.
- **env-gate**: 0. `process.env` chỉ được đọc để lấy cấu hình Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `lib/supabase/config.ts:11,16`) và ném lỗi khi thiếu; không có phép so sánh `NODE_ENV` hay giá trị môi trường nào để rẽ nhánh quyền.
- **locale-gate**: 0, và locale **không phải quyền**. Cookie `NEXT_LOCALE` (giá trị `vi` hoặc `en`, mặc định `vi`) chỉ chọn từ điển chuỗi (`lib/i18n/get-dictionary.ts:5-9`, `lib/i18n/locale-config.ts:14-16`) và cờ hiển thị trong bộ chọn (`app/login/_components/language-selector.tsx:27`). Không nhánh nào bật hoặc tắt chức năng, route hay dữ liệu theo locale. `setLocale` (`lib/i18n/set-locale-action.ts:16-28`) chỉ kiểm giá trị đầu vào bằng `isLocale` (danh sách trắng `vi`, `en`; giá trị lạ là no-op, không ghi cookie), mở cho mọi vai trò, không có quyền nào cần cấp. Đây là kiểm tra hợp lệ đầu vào, không phải kiểm tra quyền.
