# Route List

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08

## Backend Routes

> **Completeness Contract:** emit exactly ONE row per leaf route (HTTP method + concrete path). Expand framework resource macros (Rails `resources :x` → 7 RESTful rows). FORBIDDEN: resource-summary tables (`| Resource | Actions |`), approximation markers (`~N`, `(+nhiều)`, `see routes.rb`, `etc.`), wildcard paths (`/x/*`). Scout counts are estimates, not authority.

> **Code Column Contract:** `Code` is mandatory going forward — `ROUTE###`, contiguous and global across this one file (same shape as `SCR###`/`F###`). `Owner F###` carries the bare feature code that claims the route, or `—` when the route cannot be attributed to a single feature (shared/infra routes). Rare shared routes may list comma-separated multi-owners, e.g. `F001, F003`.

Next.js App Router: route đến từ file-system (`app/**/route.ts`), không có file route tập trung. Session guard là `proxy.ts` (matcher loại `_next/static`, `_next/image`, `favicon.ico` và ảnh tĩnh), gọi `updateSession` trong `lib/supabase/proxy.ts`.

### File: app/auth/callback/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /auth/callback | ROUTE001 | F001 | `GET` export trong app/auth/callback/route.ts: đổi `code` OAuth lấy session (`exchangeCodeForSession`), thành công 307 về /, lỗi hoặc thiếu `code` hoặc `?error` hoặc `code` dài hơn 2048 ký tự thì 307 về /login?error=auth_failed | proxy.ts bỏ qua: `updateSession` trả `NextResponse.next()` ngay cho đường dẫn bắt đầu bằng `/auth/`, không đụng cookie |

### File: app/auth/logout/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST | /auth/logout | ROUTE002 | F001 | `POST` export trong app/auth/logout/route.ts: `signOut({ scope: "local" })`, nếu lỗi thì xóa cookie `sb-*-auth-token`, luôn trả 303 về /login | proxy.ts bỏ qua: `updateSession` trả `NextResponse.next()` ngay cho đường dẫn bắt đầu bằng `/auth/` |

Ghi chú:

- `/auth/logout` chỉ export `POST`. `GET` trên đường dẫn này trả 405 mặc định của Next.js, nên không phải route thật và không có hàng riêng.
- `setLocale` (`lib/i18n/set-locale-action.ts`, `'use server'`, thuộc F002) là Server Action gọi từ `app/login/language-selector-container.tsx`. Nó không có URL nên không phải route.

## Frontend Routes/Pages

### File: app/(main)/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| / | `HomePage` (Server Component, bọc `HomeContent` trong `Suspense`; trang chủ F003; proxy chuyển khách về /login, layout `(main)` kiểm lại phiên; `app/page.tsx` đã xoá) | — |

### File: app/(main)/awards-information/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /awards-information | `AwardsInformationPage` (Server Component, bọc `AwardsInformationContent` trong `Suspense`; trang Hệ thống giải F004 / SCR004; proxy bảo vệ kể cả đường dẫn con, layout `(main)` kiểm lại phiên) | — |

### File: app/(main)/{sun-kudos,standards,profile,admin}/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /sun-kudos | `Page` (`ComingSoonPage`, trang giữ chỗ) | — |
| /standards | `Page` (`ComingSoonPage`, trang giữ chỗ) | — |
| /profile | `Page` (`ComingSoonPage`, trang giữ chỗ) | — |
| /admin | `AdminPage` (trang giữ chỗ; proxy và `AdminGate` chỉ cho `app_metadata.role === 'admin'`, người khác về /) | — |

### File: app/login/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /login | `LoginPage` (Server Component, bọc `LoginContent` trong `Suspense`; đọc cookie `NEXT_LOCALE` và `?error=`; proxy chuyển người đã đăng nhập sang /) | — |

### File: app/todo/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /todo | `TodoPage` (Server Component, bọc `UserPanel` trong `Suspense`; được proxy bảo vệ, `getUser()` rỗng thì `redirect('/login')`) | — |

## Summary

| Category | Count |
|----------|-------|
| Backend Routes | 2 |
| Frontend Pages | 8 |
| Total | 10 |
