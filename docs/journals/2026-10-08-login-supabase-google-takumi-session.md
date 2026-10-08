# Login Supabase Google: config.toml sao chép sai, logout để lại DOM cũ, và lỗi thứ tự commit khi rebase

**Date**: 2026-10-08 14:05
**Severity**: high
**Component**: auth (Supabase Google PKCE), `/login`, `/todo` logout, `supabase/` local stack, MoMorph visual pipeline
**Status**: ongoing

## What Happened

Hoàn thành plan `261008-0850-login-page-supabase-google`: login Google same-tab qua PKCE, `/auth/callback`, `proxy.ts` guard, `/todo` tối giản, logout, VN/EN bằng cookie `NEXT_LOCALE`. Mock E2E xanh 34/34 ở prod build. Trên đường đi có bảy chỗ vỡ, tôi ghi theo thứ tự xảy ra:

1. `supabase/config.toml` copy từ template GitHub của CLI còn nguyên Go template chưa render. Mock E2E và review đều qua, `supabase start` thật thì chết.
2. Logout bằng Server Action làm /todo còn nằm ẩn trong DOM của /login, chứa email user cũ.
3. `shadow-none` của Tailwind v4 không cho ra `box-shadow: none`.
4. Chạy Supabase local bằng Podman cần một loạt bước không có trong tài liệu chính.
5. Chu trình kiểm chứng chậm vì lock của `next dev` và port cứng.
6. Hero image của MoMorph có chữ tiếng Việt nằm trong ảnh.
7. Tách commit bằng git-manager làm commit đầu tiên không build được; đã rebase lại.

## The Brutal Truth

Lỗi 1 là lỗi của tôi: tôi copy file generator mà không render, và phần test chỉ chạy với mock nên không bao giờ đọc `config.toml`. Mock E2E 34/34 xanh, review cũng qua, cho đến khi một lệnh CLI thật làm rơi hết. Lỗi 2 cũng đã nằm trong tài liệu Next: `cacheComponents` giữ tối đa 3 route bên trái trong DOM bằng `<Activity>`, và tôi chỉ nghĩ đến history. Lỗi 7 thì đơn giản là tôi không kiểm tra từng commit có build độc lập không. Phần thời gian chờ build và lock thì tốn nhiều hơn mức nên tốn.

## Technical Details

- Lỗi 1: template còn `{{ .Db.OrioleDBVersion }}` và `{{ .Experimental.PgDeltaInitEnabled }}`. Lỗi CLI là `CliConfigParseError` (chuỗi này không được lưu trong `evidence/`). Hiện `config.toml` không còn token `{{ .Db` hay `PgDelta`. Hai dòng `{{ .Code }}` ở `:264` và `:312` là template OTP hợp lệ.
- Lỗi 2: sau logout và Back, `[data-testid=todo-email]` count = 1, expected 0; computed `MAIN display:none`. Test `browser Back after logout never shows the previous user data` fail trên code cũ với `Expected 0, Received 1`.
- Lỗi 2 (phụ): `Route "/todo": ... Date.now() ... __loadSession <- _useSession <- _emitInitialSession`, 3 lần trong prod log. Đã sửa bằng `await connection()` tại `app/todo/page.tsx:24`. Sau đó 0 lần.
- Lỗi 3: `app/login/_components/login-button.tsx:19` dùng `[box-shadow:none]`. Nhưng `app/todo/logout-button.tsx:15` vẫn dùng `disabled:hover:shadow-none`. Hai chỗ không nhất quán.
- Lỗi 5: `playwright.config.ts:3-4` hardcode `APP_PORT = 3100`, `MOCK_PORT = 54399`, không có biến môi trường để đổi. `reuseExistingServer: !process.env.CI` nên một server lạ trên :3100 bị tái dùng. Lần chạy đầu (attempt 1, exit 1) bị đánh dấu invalid vì lý do này (`evidence/temper-results.json`). Có 7 file output `e2e-green*` trong `evidence/`, nhưng timestamp đều là `1970-01-01`, nên không đo lại được thời gian thực.
- Lỗi 6: `evidence/raw-temper-runs.json` ghi stopgap ảnh crop có mép cứng ở x=600, và chữ tiếng Việt "…25." lộ ở x 605–635, y 588 trong bản EN. Band luma: v2 = 14.0 so với Figma 26.0; v3 = 25.6 (`temper-results.json`). Con số 13.3 trong brief không khớp evidence, tôi dùng 14.0. File đang ship là `public/images/login/key-visual.webp`.
- Lỗi 7: reflog ghi `rebase (pick)` theo thứ tự `90c05ab` (i18n), `4853573` (auth), `3a78a19`, `68c6b4b`, `29c915d`, `a8a862e`. Trước rebase, auth đứng trước i18n. Cây cuối `a8a862e` khớp hoàn toàn cây `6cd08d1` (`git diff` rỗng).

## What We Tried

- Lỗi 1: chỉ có một cách đúng là `supabase init` với CLI 2.120.0, rồi áp lại các chỉnh sửa của project. Đã làm.
- Lỗi 2: thử `redirect(..., RedirectType.replace)` trên Server Action. Không đủ, vì nó chỉ thay history entry, còn cây DOM được giữ. Loại trừ bfcache (`Cache-Control: no-store`) và loại trừ toggle state phía client. Chuyển sang POST `app/auth/logout/route.ts` cộng `<form method="post">` gốc, xóa `logout-action.ts`.
- Lỗi 5: chạy E2E ở chế độ `E2E_PROD=1` vì `next dev` của user giữ lock và :3000 (D4 trong plan). Đây là đường đi tạm, không phải lời giải.

## Root Cause Analysis

- Lỗi 1: copy artifact của generator tay, không dùng chính tool để sinh. Lớp test chỉ dùng mock, nên không có chỗ nào đọc `config.toml`.
- Lỗi 2: giả định `replace` làm mất trạng thái của route cũ. Với `cacheComponents` thì không.
- Lỗi 3: nhầm semantic của utility Tailwind v4 (theo ghi chú của phiên làm việc, chưa đo lại trong browser).
- Lỗi 4 và 5: môi trường dùng chung (dev server, port) không được tách khỏi test.
- Lỗi 6: asset được xuất ra có chữ đã bake, và không kiểm tra bản text-free trước khi ship.
- Lỗi 7: không chạy build từng commit trước khi push.

## Lessons Learned

1. Không copy template của generator. Chạy đúng lệnh generator và đặt kết quả vào repo. Thêm một bước smoke trên stack thật (`supabase start` hoặc ít nhất parse `config.toml`) vào CI. Mock E2E không đủ cho lớp hạ tầng.
2. Dùng `[box-shadow:none]` hoặc một cách đã đo lại được ở mọi chỗ. Đừng để hai cách cùng tồn tại như hiện tại.
3. Trên Next 16 với `cacheComponents`, logout phải là full-document navigation (`<form>` gốc tới route handler). Mọi `redirect` từ Server Action đều để lại DOM cũ. Thêm `await connection()` trước các lệnh supabase-js gọi `Date.now`.
4. Đưa các bước Podman (`podman.socket`, `DOCKER_HOST`, `-x vector,logflare,edge-runtime,imgproxy`, tạo sẵn `supabase/snippets` và `supabase/functions`) vào README, đã có ở `README.md:41-50`. Thông báo lỗi `statfs` gốc không được lưu, nên lần sau ghi luôn chuỗi lỗi.
5. Cho phép đổi port E2E qua biến môi trường. Hiện chưa có. Đừng tái dùng server có sẵn khi chưa kiểm tra port.
6. Trước khi ship ảnh, OCR hoặc nhìn bản EN để xem có chữ bake không. Lấy asset text-free từ nguồn gốc. Định vị overlay theo absolute bounds của Figma.
7. Build từng commit một trước khi push, đặc biệt khi git-manager tách commit.

## Next Steps

- F1 (user): chạy real-stack smoke. Cần Google client ID và secret trong `supabase/.env`. Chưa chạy. Done khi consent Google đưa về `/todo` với email thật.
- F2 (main agent → doc-writer): `docs/features/F001_Auth/technical-spec.md`, `docs/system/architecture.md` và `permissions.md` còn mô tả Server Action đã xóa.
- F6 (implementer): sáu mục Low (a–f) trong `plan.md`, ba Accept và ba Defer.
- Đối chiếu `public/images/login/key-visual.webp` với bản Figma text-free trước khi merge. Tài liệu không xác nhận file này là bản MCP sạch.
- Sửa `logout-button.tsx:15` cho khớp `login-button.tsx:19`.
- Thêm biến môi trường cho port E2E và gate `CI` khi tái dùng server.

**Status:** DONE_WITH_CONCERNS
**Summary:** Journal ghi bảy sự kiện từ phiên login Supabase Google, mỗi cái có artifact và bài học. Đã kiểm chứng từ repo, evidence và reflog.
**Concerns/Blockers:** Chưa chạy real Google OAuth smoke. Chuỗi lỗi `CliConfigParseError` và `statfs`, số đo thời gian chạy E2E, và bằng chứng cho `shadow-none` không có trong repo, nên ghi theo báo cáo của phiên. Entry dài hơn mức 500 từ của guideline vì brief yêu cầu đủ bảy bài học.
