# Countdown Prelaunch (F005): E2E fake-clock flake, ba lỗ hổng review, và gate bằng chứng bắt lỗi hình thức

**Date**: 2026-10-13 21:34
**Severity**: medium
**Component**: `/prelaunch` (MoMorph `8PJQswPZmU`), khóa site `lib/event/prelaunch-access.ts`, `lib/supabase/proxy.ts`, hook redirect phía client, E2E FR-402
**Status**: ongoing

## What Happened

Dựng trang `/prelaunch` công khai có đồng hồ đếm ngược, kèm khóa ở proxy: trước `EVENT_START_AT`, mọi path trừ `/login`, `/auth/*`, `/_next/*`, `/prelaunch` và ảnh tĩnh đều bị 307 về `/prelaunch` (cookie đã refresh). Tới giờ bắt đầu theo đồng hồ server, hook client chuyển sang `/`. PR #6 (https://github.com/ngocnv-0940/agentic-coding-hands-on/pull/6), commit `81007cc 1520c85 d8e805e b228ed1`. Chưa merge.

## The Brutal Truth

Mất nhiều thời gian nhất vào một test E2E chỉ flake ở dev. Hai lần sửa đầu đều sai hướng, phải gọi athena mới ra thứ tự đúng. Ngoài ra là những lỗi lẽ ra tránh được: quên ghi `study-context.json` ở bước Study, và dùng sai repo khi tạo PR.

## Technical Details

- FR-402 (dev): `toBeVisible()` pass trên HTML server-render trước khi React hydrate. Test tua đồng hồ trước khi hook redirect kịp đặt timer, nên không redirect (roots = 0).
- Nguyên nhân thứ hai: sau cú nhảy đồng hồ ~73 năm, fake clock không tick, Suspense reveal của dev không chạy.
- Review (Opus, 9/10, 0 critical) tìm ra: không có assertion lock 307 mang `Set-Cookie`; không test đường đánh thức `visibilitychange`; hook dùng delay 0 khi `remainingMs <= 0`, bỏ qua mức kẹp 1 s, có thể lặp sát nhau khi nhiều instance lệch giờ.
- Cookie rác không làm Supabase ghi `Set-Cookie`. Session hết hạn thì có: ghi đè `sb-localhost-auth-token` với `expires_at: 1`.
- Gate bằng chứng đòi mỗi mục `acceptanceCovered` lặp nguyên văn tiêu chí trong `study-context.json`, không chỉ "SC-001". Reviewer phải phát lại verdict.
- `gh pr create` mặc định trỏ repo upstream `sun-asterisk-internal/agentic-coding-hands-on`.

## What We Tried

- Hai lần sửa timing đầu tiên: không hết flake. Athena xếp hạng nhất hướng sửa đã chọn.
- Thêm `expectPrelaunchHydrated(page)` (poll khóa React fiber) trước khi tua đồng hồ.
- Thêm `page.clock.runFor(1000)` sau assertion URL để Suspense reveal chạy.
- Assertion không bị nới. Prod không bị ảnh hưởng, đây là vấn đề của dev.
- Review: đổi thành `Math.max(remainingMs, 1000)` ở mọi trường hợp, thêm test cho Set-Cookie và `visibilitychange`.

## Root Cause Analysis

Test coi "thấy được" là "đã tương tác được". Với SSR, hai trạng thái này khác nhau. Còn với hook, tôi xử lý `remainingMs <= 0` như ca đặc biệt, thay vì để một đường kẹp duy nhất phủ hết. Hai việc phụ: bỏ bước Study, và chép lệnh `gh` mà không kiểm tra repo đích.

## Lessons Learned

- Test E2E dùng fake clock phải chờ hydrate trước khi tua. Dùng `expectPrelaunchHydrated`, đừng dựa vào `toBeVisible()`.
- Sau cú nhảy giờ lớn, nhớ `runFor` để dev hoàn tất reveal.
- Hook hẹn giờ: một mức kẹp dưới cho mọi nhánh, không nhánh riêng cho 0.
- Ghi `study-context.json` ở Study, và chép nguyên văn tiêu chí vào `acceptanceCovered`.
- Luôn `gh pr create -R ngocnv-0940/agentic-coding-hands-on`.
- Quyết định tự chọn (dự án thử nghiệm): chấp nhận lệch visual 1440 khoảng 5-6%; bỏ qua gen gate (Flow layer) như F004; không nén PNG nền 3.1 MB.

## Next Steps

- Chạy `/tkm:rebuild-spec` sau khi merge để bù Flow layer, và cập nhật các line cite vào `lib/supabase/proxy.ts` (đang lệch ~5 dòng). Người làm: chủ PR.
- Mã `PERM010_PrelaunchSiteLock` do doc-writer tự gán, không đến từ rebuild-spec. Kiểm lại khi rebuild.
- Cân nhắc nén ảnh nền 3.1 MB trước khi ra mắt thật.
