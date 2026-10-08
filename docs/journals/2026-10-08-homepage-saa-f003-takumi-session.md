# Homepage SAA 2025 (F003): awards grid vỡ ở 1024/1280, countdown lệch một phút, và chuyện workers đè lên dev server

**Date**: 2026-10-08 22:11
**Severity**: medium
**Component**: homepage `/` (`app/(main)/`, `lib/event/`), E2E harness (`playwright.config.ts`), quy trình nhánh/PR
**Status**: ongoing

## What Happened

Dựng trang chủ `/` của F003 từ MoMorph screen `i87tDx10uM` bằng Takumi. Track A (`momorph-ui-implementer`) làm UI và trích copy Figma nguyên văn. Track B (implementer) làm guard, i18n, countdown, header menu và placeholder, theo file ownership đã khóa. Kết quả: E2E 83/83 trên prod build, tsc, lint, build đều exit 0, reviewer chấm 9/10 SEALED.

Giữa chừng user đổi quy trình: mỗi feature một nhánh và một PR. Các commit login chưa push được tách khỏi master local sang `feat/login-supabase-google` (PR #1). Homepage là PR #2, xếp chồng lên PR #1. Không cần force-push.

Quyết định chính: nav header chỉ hiện từ `lg`, vì spec không có hamburger. Awards grid dùng `lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,336px))]`. Countdown giữ mức sàn (floor) theo BR-001, không đổi sang làm tròn lên.

## The Brutal Truth

Chỗ bực nhất: check `scrollWidth === innerWidth` đã chạy và báo xanh, nhưng nó không bắt được overflow bị clip. Theo số đo trước khi sửa, cột awards thứ ba tràn tới x=1136 ở 1024, và lố 96px khỏi grid ở 1280. Layout sai ở đúng những chiều rộng mà Figma không vẽ.

Phần countdown tệ hơn vì lỗi nằm ở code, không nằm ở test. Test chỉ lộ ra vì nó pin đúng mốc phút. Nhiều người sẽ nới assertion cho xanh. Tôi không làm vậy.

## Technical Details

- Px cố định lấy nguyên từ Figma: award column 336px, Kudos logo `left-[672px]`, nav hiện từ `md`.
- Element-rect check sau fix (`evidence/visual-recheck/element-rect-final-output.txt`): 6 card nằm trong grid ở 1024, 1280 và 1512. Ví dụ ở 1024, `top-project-leader` có left 693, right 976, khớp biên grid.
- Countdown: `page.clock` pin 13:21:00 và đọc `minutes=08` thay vì `09`. `lib/event/use-countdown.ts:37` tick theo mốc phút của đồng hồ tường, nên lệch tới một phút so với giá trị đã floor. Đã sửa: re-arm sau `((target-now) % 60000) + 1` ms.
- Pre-start margin của test: 30 s, nâng lên 55 s (18:29:05, `runFor 00:56`).
- `playwright.config.ts:33`: `workers: process.env.CI ? 2 : 4`. Trước đó 8 worker cộng `next dev` làm cạn swap trên máy 8 GB WSL, `page.goto` timeout ngẫu nhiên.

## What We Tried

- `scrollWidth === innerWidth`: pass giả. Bỏ.
- Đo rect từng element ở từng viewport: bắt đúng. Giữ.
- Nới assertion countdown: không làm. Nới margin dữ liệu test thay vì nới spec.
- Hydration guard regex: bỏ sót minified React prod error #418/#423/#425. Reviewer bắt, đã mở rộng regex.
- Admin: `user_metadata.role = 'admin'` không được cấp quyền. Thêm mock identity riêng cho case này.
- Ngày `2025-02-30T10:00:00Z`: `Date.parse` cuộn sang tháng 3 và không báo lỗi. Thêm validate lịch nghiêm ngặt và bắt buộc offset.

## Root Cause Analysis

- Track A lấy px từ frame Figma 1512 mà không audit md–xl. Layout chỉ đúng ở một chiều rộng.
- Check overflow dùng sai metric. `scrollWidth` của document không thấy phần bị clip.
- Countdown giả định mốc tick trùng mốc floor. Thực tế floor tính theo thời điểm mục tiêu còn timer lại chạy theo đồng hồ tường.
- Trong quy trình, evidence gate bị BLOCKED vì reviewer diễn giải lại acceptance criteria thay vì trích nguyên văn. Lần đầu tôi tính sha của `SCR002` sai, vì parse mọi heading `##` thay vì dùng `_parse_screen_sections` (body kéo đến `## SCR` kế tiếp).
- Phase 4 NEEDS_CONTEXT vì copy VN dài phụ thuộc `homepage-copy-vi.md` từ Track A, và thứ tự này chưa được ghi rõ trong plan.

## Lessons Learned

1. Audit mọi px cố định ở md–xl trước khi code. Đừng chờ đến bước visual.
2. Check overflow bằng element rect theo từng viewport, không bằng `scrollWidth`.
3. Test thời gian đừng pin sát mốc khi clock vẫn chạy. Cho margin đủ lớn.
4. Khi hai track chạy song song, ghi rõ dependency về artifact copy trong plan, không để implementer tự phát hiện.
5. Acceptance criteria trong `acceptanceCovered` phải echo nguyên văn từ `study-context.json`.
6. Chạy E2E với `E2E_PROD=1`, và đừng `next build` khi dev server của user đang giữ `.next` trên :3000. Lần đó build làm chết dev server.

## Next Steps

- Rebuild-spec sau khi merge. Owner: user.
- Xác nhận có cần header nav dưới 1024 không (spec không có hamburger). Owner: user, đối chiếu Figma mobile.
- Mở issue cho các mục Low đã defer: sign-out bfcache, dropdown focusout/aria, widget button chưa có action, font class apply hai lần, keyvisual 4.4 MB. Owner: main agent.
- Chụp visual ở 1440 (evidence hiện dùng 1280/1512). Owner: tester.
- Cấp admin trên stack thật: set `raw_app_meta_data.role` qua SQL rồi login lại. Owner: user.
- F001 docs còn ghi landing `/todo`. Owner: doc-writer, khi promote.
