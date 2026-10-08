# agentic-coding-hands-on

Ứng dụng Next.js 16 (App Router) đăng nhập bằng Google qua Supabase Auth, giao diện vi/en. Có hai màn hình: `/login` và `/todo` (chỉ người đã đăng nhập xem được; hiện email và nút đăng xuất). Tài liệu thiết kế nằm ở [docs/README.md](docs/README.md).

## Yêu cầu

| Công cụ | Ghi chú |
|---|---|
| [bun](https://bun.sh) | Trình quản lý gói và chạy script |
| Supabase CLI 2.120+ | Chạy Supabase cục bộ (`supabase start`) |
| Docker **hoặc** Podman | Supabase CLI chạy các container; xem phần Podman bên dưới |
| Google Cloud project | Tạo OAuth client kiểu Web application |

## Cài đặt cục bộ

```bash
bun install
```

### 1. Cấu hình Google OAuth

Trong Google Cloud, tạo OAuth client (Web application) với:

- Authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
- Authorized JavaScript origin: `http://localhost:3000`

Tạo file `supabase/.env` (đã nằm trong `.gitignore`, không commit):

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<client secret>
```

### 2. Chạy Supabase

```bash
supabase start
supabase status   # lấy Publishable key (sb_publishable_...)
```

#### Dùng Podman thay Docker

```bash
systemctl --user enable --now podman.socket
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
mkdir -p supabase/snippets supabase/functions   # Podman cần sẵn hai thư mục bind-mount; git không lưu thư mục rỗng
supabase start -x vector,logflare,edge-runtime,imgproxy
```

Bốn dịch vụ bị loại (`vector`, `logflare`, `edge-runtime`, `imgproxy`) là các container analytics/phụ trợ cần docker socket; đăng nhập không dùng đến chúng.

### 3. Biến môi trường cho ứng dụng

```bash
cp .env.example .env.local
# điền NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY bằng key từ `supabase status`
```

Cả `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` đều bắt buộc: `lib/supabase/config.ts` ném lỗi khi thiếu, nên `bun run build` cũng cần chúng (CI phải đặt cả hai).

### 4. Chạy ứng dụng

```bash
bun run dev
```

Mở **`http://localhost:3000`**, không dùng `127.0.0.1`: cookie PKCE của Supabase gắn theo host, đổi host giữa chừng làm bước đổi mã đăng nhập thất bại.

## Script

| Lệnh | Việc làm |
|---|---|
| `bun run dev` | Chạy dev server |
| `bun run build` | Build production |
| `bun run start` | Chạy bản build |
| `bun run lint` | ESLint |
| `bun run test:e2e` | Playwright E2E |

E2E không cần Supabase thật: `playwright.config.ts` tự khởi động một Supabase giả ở cổng `54399` và ứng dụng ở cổng `3100`. Đặt `E2E_PROD=1` để chạy bằng `build` + `start` thay cho `next dev` (dùng khi một `next dev` khác đang giữ khoá thư mục). `E2E_SMOKE=1` bật các spec gắn tag `@smoke` (chạy với Supabase thật), nhưng hiện chưa có spec nào như vậy — luồng Google thật phải kiểm thủ công.

## Cấu trúc chính

| Đường dẫn | Nội dung |
|---|---|
| `proxy.ts`, `lib/supabase/` | Làm mới phiên và chặn route; client Supabase |
| `app/login/`, `app/todo/` | Hai màn hình |
| `app/auth/callback/`, `app/auth/logout/` | `GET` đổi mã OAuth; `POST` đăng xuất |
| `lib/i18n/` | Từ điển vi/en và cookie `NEXT_LOCALE` |
| `supabase/config.toml` | Cấu hình Supabase cục bộ (Google đã bật) |
| `e2e/` | Playwright và Supabase giả |
