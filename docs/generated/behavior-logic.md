---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
# Behavior Logic

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08
**Analysis Scope**: `app/`, `lib/`, `proxy.ts` (Next.js 16 App Router, Supabase Auth). Danh sách nguồn BL của scout rỗng ở cả 10 loại.

**Code Format**: All codes MUST follow `BL###_NameSlug` format

**Behavior Logic Types** (canonical 10 — language-neutral):
- `scheduled-job` — Cron-like scheduled tasks
- `queue-worker` — Background job workers (async queue consumers)
- `event-listener` — Event-driven handlers
- `observer` — Model lifecycle hooks (created/updated/deleted)
- `mail` — Email sending logic
- `notification` — In-app / push notification logic
- `middleware` — Request/response processing chain (non-auth)
- `custom-command` — CLI commands
- `integration` — Third-party integrations (external API clients)
- `webhook` — Incoming/outgoing webhook handlers

**Note**: Auth/permission middleware is NOT included — see Permissions.md

**Note**: Feature and UserStory mapping is managed in FeatureList.md and UserStories.md. This document contains behavior logic items without direct feature/story references.

**Note**: Notification/event/webhook entries SHOULD include `**Payload**` (the async data shape) — this is where async contracts live, since api-contracts.md covers synchronous surfaces only.

**Note**: File-exchange BL types (`queue-worker`/`custom-command`/`integration` matching import/export vocabulary — `import, export, csv, xlsx, upload, download, bulk`) SHOULD include `**File Schema**` (the internal column/header contract of the exchanged file, sourced from `validateHeader()` / schema-array / column-mapping in source code) — the column schema of an exchanged file is settled here and nowhere else; screen-spec cross-references it rather than re-deriving.

**Kết luận chung**: No data — ứng dụng không có logic nền nào. Không có tác vụ định kỳ, hàng đợi, trình nghe sự kiện, observer, gửi mail, thông báo, webhook, lệnh CLI hay lời gọi HTTP ra ngoài. Theo Cardinality Contract (Rule C1: mỗi mục trong danh sách nguồn của scout ra đúng một BL), danh sách rỗng nên tài liệu này có 0 mục BL và không bịa mục nào.

---

## Behavior Logic Index

BA-first summary — one row per `BL###` item, banded by **Type**. `Payload` and `File Schema` are the
two columns BAs ask about most (the async data shape and the exchanged-file contract, respectively);
both are settled here and nowhere else. Full source citations, module/route/data-model links, and the
Cardinality Contract that governs how these items are counted live in the **Dev Appendix** below.

### Type: scheduled-job

No data — không có tác vụ định kỳ (không có `setInterval`, `node-cron`, cron của nền tảng).

### Type: queue-worker

No data — không có hàng đợi hay worker nền (không có `bullmq`, `inngest`, `new Worker`).

### Type: event-listener

No data — không có trình nghe sự kiện nghiệp vụ. Ba lời gọi `addEventListener` trong mã (`pageshow` ở `app/login/google-login-container.tsx:27`; `pointerdown` và `keydown` ở `app/login/_components/language-selector.tsx:39-40`) là xử lý tương tác giao diện phía trình duyệt, đã mô tả ở screen-flow.md (Error Handling Flows) và screen-list.md, không phải logic nền.

### Type: observer

No data — không có hook vòng đời model, vì ứng dụng không có model hay bảng dữ liệu (xem data-model.md).

### Type: mail

No data — không có gửi mail (không có `nodemailer`, `resend`, `sendgrid`). `local_smtp` trong `supabase/config.toml` là cấu hình của Supabase CLI, mã ứng dụng không dùng.

### Type: notification

No data — không có thông báo trong ứng dụng hay đẩy ra ngoài. Dòng lỗi đăng nhập là phần giao diện của SCR001_Login, không phải logic thông báo.

### Type: middleware

No data — không có middleware không phải xác thực. `proxy.ts` và `lib/supabase/proxy.ts` là guard phiên đăng nhập, thuộc Permissions và screen-flow.md (GUARD-001, GUARD-002), bị loại khỏi BL theo bảng Inclusion/Exclusion. Cùng lý do với khóa trước ngày ra mắt của F005 (`decidePrelaunchAccess`: `lock` / `unlock` / `pass`, ALG-001): đó là guard route, ghi ở PERM010 và GUARD-004. Phần chuyển trang phía máy khách tại mốc (ALG-002, `useNavigateHomeAtEventStart`) là hẹn giờ một lần theo `remainingMs` máy chủ gửi, mỗi độ trễ kẹp tối thiểu 1 giây; xem Client-Side Logic.

### Type: custom-command

No data — không có lệnh CLI trong mã ứng dụng (không có `process.argv`, `commander`, `yargs`).

### Type: integration

No data — không có client gọi API bên thứ ba từ mã máy chủ. Gọi Supabase Auth qua SDK (`lib/auth/sign-in-with-google.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`) là phần của luồng xác thực, không phải `integration` BL; scout đã xét và loại. Không có `fetch(` hay `axios` trong `app/`, `lib/`, `proxy.ts`.

### Type: webhook

No data — không có webhook vào hay ra; hai route handler (`GET /auth/callback`, `POST /auth/logout`) là route đồng bộ, đã có trong route-list.md (ROUTE001, ROUTE002).

---

## Dev Appendix

Source citations, module/route/data-model links, and the deterministic rules `validate_behavior_logic.py`
enforces. Every `BL###` heading below carries the same code as its Index row above.

### Evidence (No data)

Scout `## Background Logic Source Inventory` (mục `### Next.js (JS/TS)`) ghi `_(none found)_` cho cả 10 loại, nên Rule C1 cho 0 mục BL. Kiểm lại ngày 2026-10-08 bằng grep không phân biệt hoa thường trên `app/`, `lib/`, `proxy.ts`:

| Mẫu tìm | Kết quả | Ghi chú |
|---------|---------|---------|
| `setInterval`, `node-cron`, `cron`, `bullmq`, `inngest`, `new Worker` | 0 | Không có tác vụ định kỳ hay worker |
| `nodemailer`, `resend`, `sendgrid` | 0 | Chuỗi `mail` chỉ khớp nhãn `Email` trong từ điển và `app/todo/page.tsx:36-37` |
| `webhook` | 0 | |
| `fetch(`, `axios` | 0 | Không có client HTTP ra ngoài |
| `EventSource`, `new WebSocket`, `.subscribe(`, `.channel(` | 0 | Không có kênh thời gian thực |
| `after(`, `revalidate` | 0 | Không có việc chạy sau response |
| `process.argv`, `commander`, `yargs` | 0 | Không có CLI |
| `addEventListener` | 3 | Chỉ là xử lý giao diện (xem mục `event-listener` ở trên) |
| `setTimeout` | 1 | `app/todo/logout-button.tsx:13`, hoãn `setPending(true)` một nhịp (0 ms) để không hủy lần submit; không phải tác vụ nền |

### Cardinality Contract

Rules enforced by Wave 2b researcher and Wave 7a reviewer. Violations are critical.

- **Rule C1 — 1 BL per inventory entry**: Mode A stacks (folder convention): 1 file = 1 BL. Mode B stacks (annotation/decorator): 1 decorator hit = 1 BL (multiple hits in same file → multiple BL items). Aggregation is a critical violation.
- **Rule C2 — Source fields mandatory, single-valued**: Every BL item MUST include `**Source File**` (one relative path) and `**Source Symbol**` (one symbol — class name for Mode A; `ClassName::method` or `module::function` for Mode B). Multi-symbol forms forbidden in either field — split on `,`, `;`, or whitespace-bounded conjunction (` and `, ` & `, ` + `) and produce separate BL items. `/` is NOT a delimiter here (collides with composite-ref `SCR###/REG###` and path-shaped symbols); `+`/`&` require surrounding whitespace so language tokens like Swift `MyClass+Extension` and reference operators inside symbol names are not aggregated. Both fields must match the scout inventory entry 1-to-1.
- **Rule C3 — Unmatched BL warning**: A BL item whose Source File does not appear in the scout `## Background Logic Source Inventory` → warning; researcher must provide justification in Description (may be a legitimate `[SIGNAL_INFERRED]` case). Unmatched BL with no justification → critical.

Áp dụng ở đây: 0 mục trong danh sách nguồn, 0 mục BL, không có mục nào cần Source File/Source Symbol, không có BL không khớp danh sách.

### Inclusion/Exclusion Matrix (scout-side filter)

> **Precedence:** Applies at Wave 0 scout inventory only. Once an entry reaches `## Background Logic Source Inventory`, **Rule C1 dominates unconditionally** — researcher emits one BL per inventory entry. Scout MUST drop excluded files (e.g., abstract bases in `app/Mail/`) upfront; researcher does not filter post-inventory.

| Include | Exclude |
|---------|---------|
| All files/symbols in scout `## Background Logic Source Inventory` | Abstract base classes, traits, interfaces |
| `[SIGNAL_INFERRED]`-tagged inventory entries (with justification) | Vendor overrides and third-party library subclasses |
| | `*Test.php`, `*Spec.rb`, `test_*.py`, `*.test.ts` and all test files |
| | Files < 10 LOC (scaffolding/stubs) |
| | Auth/ACL/OAuth/JWT middleware (→ Permissions.md) |

**Scout responsibility:** Wave 0 must apply these filters before emitting `## Background Logic Source Inventory`. See `references/pipeline-w0-w5.md` Wave 0 step (5).

Các ứng viên scout đã xét và loại: `proxy.ts` và `lib/supabase/proxy.ts` (guard xác thực, thuộc Permissions); Server Action `setLocale` trong `lib/i18n/set-locale-action.ts` (ghi cookie theo thao tác người dùng, không chạy nền); `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/auth/sign-in-with-google.ts` (bọc SDK cho luồng xác thực). Không có mục `[SIGNAL_INFERRED]`.

### Anti-Patterns: Aggregation Forbidden

Aggregating multiple source files into a single BL item violates Rule C1 and will be flagged critical by the reviewer.

- ❌ `EmailNotifications` — Description: "Covers all 25 Mail classes (WelcomeMail, InvoiceMail, ...)"
- ✅ `SendWelcomeMail` (Source File: `app/Mail/WelcomeMail.php`) + `SendInvoiceMail` (Source File: `app/Mail/InvoiceMail.php`) + ...

- ❌ `AuditLogWorkers` — Description: "Umbrella for 12 audit log job variants"
- ✅ One BL per Job class with individual Source File + Source Symbol fields

- ❌ `AuditEvents` — Source Symbol: `AuditService::onCreated, AuditService::onUpdated, AuditService::onDeleted` (comma-list forbidden)
- ✅ One BL per symbol: `AuditOnCreated` / `AuditOnUpdated` / `AuditOnDeleted`

---

No data — không có mục BL nào để ghi chi tiết (không có phần `BL###_NameSlug` bên dưới).

---

## Summary

- **Total Behavior Logic Items**: 0
- **By Type**: custom-command: 0, event-listener: 0, integration: 0, mail: 0, middleware: 0, notification: 0, observer: 0, queue-worker: 0, scheduled-job: 0, webhook: 0

---

## Cross-Reference Validation

- [x] All BL### codes are unique (không có mã nào)
- [x] All BL### codes are referenced in UserStories.md (type=system): N/A — không có BL###
- [x] All BL### codes are referenced in FeatureList.md: N/A — không có BL###
- [x] All related route references are valid: N/A — không có mục nào tham chiếu route
- [x] All related data model references are valid: N/A — không có mục nào tham chiếu model (data-model.md cũng No data)
- [x] No orphaned behavior logic references
- [x] All BL items have Source File + Source Symbol fields (Rule C2): N/A — 0 mục
- [x] All Source File paths match scout Background Logic Source Inventory entries (Rule C2/C3): N/A — danh sách nguồn rỗng, 0 mục BL, khớp 1-1

---

## Client-Side Logic

Document client-side patterns found in the codebase. For each, record: pattern type, trigger location (file:line), and brief description of what it does.

### Debounce / Throttle

**Extraction signature:** timer wrapper around a handler — `setTimeout`, `clearTimeout`, `debounce(fn, ms)`, `throttle(fn, ms)`, `useDebounce`, `useDebouncedCallback`

N/A — no debounce or throttle patterns detected. Chỉ có một `setTimeout(..., 0)` ở `app/todo/logout-button.tsx:13`; nó hoãn việc khóa nút đến sau sự kiện click để form vẫn gửi được, không gom hay giới hạn tần suất lời gọi, nên không phải debounce/throttle. `app/prelaunch/_behavior/use-navigate-home-at-event-start.ts` (F005) cũng dùng `setTimeout`, nhưng là hẹn giờ một lần tới mốc (không gom hay giới hạn lời gọi) nên cũng không phải debounce/throttle.

### Optimistic UI

**Extraction signature:** mutation applied immediately before API response, with rollback on error — `setState` before `await`, undo on catch, `optimisticUpdate`, `useOptimistic`

N/A — no optimistic UI patterns detected. `setStatus('initiating')` trước `await signInWithGoogle()` (`app/login/google-login-container.tsx:34-35`) chỉ là trạng thái chờ của nút, không áp dụng sẵn kết quả của một thay đổi dữ liệu.

### Polling

**Extraction signature:** recurring API call — `setInterval`, recursive `setTimeout` calling an API, `usePolling`, `refetchInterval`

N/A — no polling patterns detected.

### Upload Progress

**Extraction signature:** file upload with progress tracking — `XHR.upload.onprogress`, `FormData` with `onUploadProgress`, `fetch` streaming, `useUpload`, `onProgress`

N/A — no upload progress patterns detected.

### Realtime (WebSocket / SSE / EventSource)

**Extraction signature:** persistent connection to server — `new WebSocket(...)`, `new EventSource(...)`, `useWebSocket`, `subscribe(channel)`, SSE `listen` handler, reconnect logic

N/A — no realtime patterns detected.
