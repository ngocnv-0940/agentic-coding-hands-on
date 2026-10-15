# Write Kudo (F007): click đầu tiên biến mất chỉ ở prod, Playwright dùng nhầm server cũ, và file có khóa bị đẩy lên remote

**Date**: 2026-10-15 18:05
**Severity**: high
**Component**: modal Viết Kudo (`write-kudo-field-row.tsx`, `use-submit-kudo`), `playwright.config.ts`, migration `20261015035942_write_kudo_columns_and_storage.sql` / `20261015035946_write_kudo_functions.sql`, bucket `kudo-images`, bước đóng gói git
**Status**: resolved

## What Happened

Dựng modal Viết Kudo: chọn người nhận, soạn nội dung, hashtag, ảnh, gửi ẩn danh. PR #10, branch `feat/write-kudo`, commit `ffd72b0..af56c75`. Code chạy xong khá nhanh. Thời gian mất vào bốn chỗ: một lỗi click chỉ có ở prod, một lần Playwright chạy nhầm server, hai lỗi race/index do reviewer bắt, và một sự cố ở khâu git: file chứa khóa mặc định của Supabase CLI đã bị push.

## The Brutal Truth

Lỗi click là thứ làm tôi bực nhất: dev xanh, prod đỏ, và tôi đã xóa retry trong test để khỏi che nó. Còn vụ file bị push là lỗi quy trình thuần túy. Khóa đó chỉ là khóa local mặc định, nhưng cái cần ghi lại là hành vi: git-manager stage lại file sau khi đã được dặn bỏ. Lẽ ra phải quét lại ngay trước commit.

## Technical Details

1. **Mất click "+ Hashtag" (TC ID-34, chỉ prod).** Probe (`fix-round1-probe-prod-before-fix.txt`): `"shiftY":28`, `y 660 -> 688`, chuỗi sự kiện `mousedown:write-kudo-hashtag-add`, `mouseup:write-kudo-modal`, `click:write-kudo-modal`, `panel= 0`. Mousedown làm ô Người nhận mất focus, dòng "Không được để trống" chèn vào trước nút, nút trôi xuống 28px, mouseup rơi lên modal nên `click` bắn vào tổ tiên chung, không phải nút. Ở dev, focus-trap chạy hai lần do React StrictMode nên ô đã blur sẵn, lỗi hiện từ trước click. Dev che mất bug.
2. **`/login?error=auth_failed` trong E2E_PROD.** Cổng :3100 còn một server cũ build từ `.env.local` (URL Supabase thật). `reuseExistingServer` bật nên Playwright dùng luôn, không in gì. Tôi đã nghi precedence của env trước; sai, process env vẫn thắng `.env`.
3. **FR-404/405 (like) timeout 30s ở `context.close`** khi máy dev đang tải nặng. Debugger đánh giá không phải regression (~80%).
4. **Storage thật trả HTTP 400, body `statusCode "403"`**; mock trả 403. Client coi mọi non-2xx là lỗi nên không vỡ, nhưng mock lệch thật.
5. **Seq Scan:** index duy nhất từng phần `where url like 'kudo-images/%'` không được dùng cho `url = 'kudo-images/' || n` cho tới khi thêm đúng predicate đó vào truy vấn (`write_kudo_functions.sql:141`, policy xóa ở `write_kudo_columns_and_storage.sql:50`).
6. **Race khi dọn ảnh:** xóa ảnh sau một lần gửi bị throw (không rõ kết quả) có thể đua với `create_kudo` đang commit; `FOR SHARE` không chặn được lệnh xóa dùng snapshot cũ hơn.
7. **Evidence gate chặn lần đầu:** thiếu `temper-results.json` (tester ghi `raw-temper-runs.json`), và `acceptanceCovered` phải lặp nguyên văn tiêu chí trong study-context.

## What We Tried

- Lỗi click: ba giả thuyết. Lazy chunk/hydration/Tiptap: loại (`el.click()` ngay sau khi modal hiện thì panel mở). Remount reset state: loại. Chỉ giả thuyết blur-shift được xác nhận. Sửa: dòng lỗi ra khỏi luồng layout, bỏ retry.
- Server cũ: `E2E_PROD` không bao giờ reuse server (`playwright.config.ts:62`).
- Flake like: nâng timeout lên 90s. Đây là che chậm, không phải sửa. Ghi thẳng như vậy trong báo cáo delivery.
- Storage: giữ policy owner_id (probe cho thấy owner được gán trước khi policy chạy), giữ policy "select own" vì `remove` cần nó, nếu không trả `200 []` mà object vẫn còn.
- Race dọn ảnh: chỉ dọn sau `{ok:false}` rõ ràng.
- Git: `git filter-branch` bỏ file và sửa lại trailer Co-Authored-By (agent đã ghi sai dòng), rồi `push --force-with-lease` trên branch feature, trước khi merge.
- Gate: dựng `temper-results.json` bằng `buildTemperResults` trong `.claude/hooks/lib/evidence-validator.cjs`, chép nguyên văn tiêu chí.

## Root Cause Analysis

Hai bug đầu cùng một gốc: tôi tin dev là đại diện cho prod. StrictMode đổi thứ tự focus/blur, `reuseExistingServer` đổi server nào đang chạy, và cả hai đều im lặng. Lỗi layout là thiết kế sai: dòng validation-on-blur nằm trong luồng. Vụ khóa bị push là do không có bước quét secret sau lần `git add` cuối cùng; file đó vốn là output thô của `supabase start` bị ghi vào evidence.

## Lessons Learned

- Dòng validation hiện khi blur không được làm dịch layout. Với lỗi "click đầu tiên mất", đo `getBoundingClientRect` trước/sau mousedown.
- Test luôn phải chạy trên bản build prod trước khi gọi là xong; gỡ retry để lỗi lộ ra.
- Không bao giờ reuse server trong chế độ prod; chạy Playwright mà không có log reuse thì không biết mình đang test cái gì.
- Không ghi output thô của `supabase start` vào evidence. Quét secret trên tập file đã stage sau `git add` cuối cùng.
- Timeout tăng lên là nợ, không phải bản sửa.
- Mock Storage phải trả đúng HTTP 400 + `statusCode "403"` như bản thật.

## Next Steps

- Sửa mock Storage cho khớp thật (400 + `statusCode "403"`). Chủ: tester.
- Điều tra vì sao FR-404/405 chậm ở `context.close`, rồi hạ timeout 90s. Chủ: tester, issue riêng.
- Thêm bước secret-scan sau `git add` cuối vào quy trình git-manager. Chủ: owner kit, trước F008.
- Một cảnh báo hydration chưa tìm ra nguồn trong lần smoke thật đầu tiên (`real-stack-smoke.md`). Chủ: UI owner.

## Việc nối tiếp cùng ngày: tự tạo sunner cho mọi tài khoản Google

Commit `6cf39e0..d4e8068` trên `feat/write-kudo`, PR #10, plan `plans/261015-1700-auto-provision-sunner/`.

**Lỗ hổng.** F006 chọn "không tự tạo sunner" (YAGNI). Hệ quả: đăng nhập Google thật chỉ đọc được, không viết được kudo, trong khi người dùng mặc định rằng đăng nhập Google là viết được. Cả bộ test xanh vì chỉ dùng danh tính seed sẵn. Quyết định YAGNI về cấp phát danh tính âm thầm làm sản phẩm vô dụng với người dùng thật. Phải test đúng đường đăng nhập thật, không chỉ danh tính seed.

**Review M1.** Trigger gắn trên mọi insert của `auth.users` cũng tạo sunner cho người đăng ký email/password (`config.toml` đang bật email signup). Tôi gate ngay trong DB theo `raw_app_meta_data` (provider/providers = google), không dựa vào config, để vẫn đúng dù cấu hình auth trên hosted đổi.

**Cái bẫy Postgres.** Mệnh đề `WHEN` của trigger được kiểm quyền bằng role đang insert (`supabase_auth_admin`), mà role này không với tới `kudos_private`. Đặt gate ở `WHEN` thì có nguy cơ mọi lượt đăng ký đều lỗi. Gate phải nằm trong hàm `SECURITY DEFINER`.

**Review vòng 2.** GoTrue gắn Google vào tài khoản cùng email có sẵn bằng UPDATE `raw_app_meta_data` (LinkAccount), và ghi lại cột này ở mỗi lần đăng nhập Google. Trigger insert-only bỏ sót case này. Nay là `after insert or update of raw_app_meta_data`, idempotent nhờ `on conflict`. Đổi lại: sunner Google đã bị xóa sẽ được tạo lại ở lần đăng nhập kế tiếp.

**Test.** Các dòng dọn fixture trong pgTAP cũ, vốn nằm trong plan, thành code chết khi gate xuất hiện nên đã bỏ. Mutation check cho ba biến thể (bỏ gate, insert-only, bỏ column list) đều bị test bắt.

**Lesson cho tay thợ.** Khi nghi hook/trigger của hệ ngoài, đọc xem hệ đó ghi bảng bằng INSERT hay UPDATE, và role nào chạy trigger, trước khi viết điều kiện.

**Chưa kiểm chứng.** Chưa chạy được Google OAuth thật end-to-end ở local. Chủ: người dùng, kiểm tra ngay ở lần đăng nhập thật đầu tiên; nếu sunner không xuất hiện, xem lại dạng `raw_app_meta_data` GoTrue ghi.
