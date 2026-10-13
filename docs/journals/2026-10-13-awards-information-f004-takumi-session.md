# Awards Information (F004): scroll-spy khóa quá sớm, và bốn vòng review để đóng khóa đúng

**Date**: 2026-10-13 16:05
**Severity**: medium
**Component**: `/awards-information` (`app/(main)/_behavior/award-scroll-lock.ts`, `use-award-category-spy.ts`), E2E `e2e/awards-information-category-navigation.spec.ts`
**Status**: ongoing

## What Happened

Dựng trang `/awards-information` (MoMorph `zFYDgyj_pD`) bằng takumi, theo plan `plans/261013-0720-awards-information-page/`. Năm phase đều code xong và qua gate. E2E 112/112, tsc, lint, build exit 0. Reviewer chấm 9/10 SEALED sau hai vòng sửa. Commit `fdb130a..9e92d4b` trên `feat/awards-information`.

Chỗ tốn thời gian nhất là menu danh mục sticky có scroll-spy. Khi click một mục, spy phải khóa lại, không được nhấp nháy qua các section đi ngang.

## The Brutal Truth

Lỗi đầu tiên là của tôi. Lock được nhả ngay khi `scrollend` đầu tiên bắn. Nhưng Playwright click vào item trước, trình duyệt cuộn item đó vào view, và `scrollend` của lần cuộn này bắn trước khi smooth scroll tới section kịp bắt đầu. Test BR-002 (không nhấp nháy) fail. Số đo "khoảng 11 ms sau `select()`" và "fail 3/3" là từ phiên làm việc; tôi không tìm thấy hai con số này trong `evidence/`, nên đừng coi chúng là đã kiểm chứng.

Điều bực là review phải bắt đến lần thứ hai. Vòng 1 thêm gate "đã tới target" cho idle timer, nhưng quên hard deadline. Vòng 2 mới lộ ra: wheel dọc trên hàng tab `<1024` không hủy lock, và khi deadline hết mà chưa tới target thì phải nhả không pin và tính lại vị trí. Hiện chưa có E2E cho wheel/touch dọc trên hàng tab (`grep wheel` trong spec không ra gì). Nghĩa là phần này mới được review, chưa được test.

## Technical Details

- `award-scroll-lock.ts:12-14`: `LOCK_IDLE_MS = 150`, `LOCK_MAX_MS = 1500`, `LOCK_FIRST_CHECK_MS = 1000`. Lock chỉ nhả khi `hasReachedSection()` (sai số 8 px) hoặc đã ở đáy trang.
- Spec nav 286 dòng, vượt rule 200 dòng.
- PageUp test (`spec.ts:235`) fail 1 trên 30 trong lượt `repeat-each=3` (`e2e-nav-repeat3-final-attempt1-precondition-race-output.txt`). Nguyên nhân: đọc `scrollY` trước khi smooth scroll bắt đầu. Đã sửa bằng `expect.poll` có giới hạn 5 s.
- Copy: CSV MoMorph ghi "10 Đơn vị" (tên layer master), Figma ghi "10 Cá nhân". Caption Figma là "Sun* Annual Awards 2025", TC ghi chữ thường. Theo rule Figma thắng, e2e đã sửa theo Figma.
- Reviewer dùng nhãn ngắn trong `acceptanceCovered`, gate chặn, phải phát lại verdict (`evidence/*-superseded.json` là dấu vết).
- `.claude/skills/.venv/bin/python3` không tồn tại: `scaffold_spec.py` chạy bằng python3 hệ thống, `validate_coverage.py` không chạy.

## What We Tried

- Nhả lock ở `scrollend` đầu tiên: fail, vì `scrollend` của cuộn click-into-view tới trước.
- Idle timer 150 ms làm điều kiện nhả: sai khi scroll khựng (jank) hoặc Safari không có `scrollend`. Phải thêm gate "đã tới target" và deadline 1500 ms.
- Deadline hết mà chưa tới: nhả không pin, gọi `onUnsettled` để đọc lại vị trí. Không làm vậy thì active item bị đứng yên.

## Root Cause Analysis

Sự kiện `scrollend` không gắn với "cuộn tới target". Nó chỉ nói "một cuộn nào đó đã kết thúc". Tôi coi nó là tín hiệu đủ, mà không kiểm chứng vị trí. Cộng thêm việc không có deadline nào, lock thành một điều kiện thoát không có lối ra khi thiếu sự kiện.

## Lessons Learned

1. Đừng nhả lock chỉ vì một sự kiện. Nhả khi điều kiện nghiệp vụ đúng (đã tới target), và luôn có deadline.
2. Đặt "gate đã tới target" và "deadline" vào prompt reviewer ngay từ đầu, cùng với yêu cầu trích nguyên văn criteria. Đừng để reviewer tự nhớ.
3. Test cần chờ scroll bắt đầu bằng `expect.poll`, không đọc `scrollY` một lần rồi tin.
4. Trước khi chốt, kiểm tra xem mọi nhánh của lock đã có test. Wheel dọc trên hàng tab vẫn chưa có.

## Next Steps

- Tester: thêm E2E wheel dọc và touch dọc trên hàng tab `<1024`, chạy `repeat-each=3`, trước khi merge.
- Tester: tách spec nav thành hai file dưới 200 dòng.
- User: duyệt bằng mắt 3 chỗ lệch visual nhỏ so với Figma, và chốt giá EN (định dạng VNĐ).
- User: chạy `/tkm:rebuild-spec` sau khi merge để có lớp Flow.
