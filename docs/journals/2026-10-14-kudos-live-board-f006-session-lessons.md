# Kudos Live Board (F006): schema đầu tiên trong repo, `search_path` làm chậm feed, và cái bẫy regression từ review

**Date**: 2026-10-14 21:59
**Severity**: medium
**Component**: `/sun-kudos` (MoMorph `MaZUn5xHXZ`), migration `supabase/migrations/20261014095439_*` và `20261014095441_*`, RPC `toggle_kudo_like` / `matching_kudos`, pgTAP `supabase/tests/database/`, `app/(main)/sun-kudos/`, e2e `kudos-*.spec.ts`
**Status**: ongoing

## What Happened

Dựng trang live board thay cho Coming soon: Highlight carousel, Spotlight, All Kudos phân trang keyset, sidebar, nút like, bộ lọc trên URL. Đây là schema Supabase đầu tiên trong repo: 9 bảng, RLS, 6 RPC, seed. PR https://github.com/ngocnv-0940/agentic-coding-hands-on/pull/9 (branch `feat/kudos-live-board`). Review SEALED 9/10, 0 critical. Visual ở 1440 vẫn lệch ngoài ±4 px.

## The Brutal Truth

Phần DB làm nhanh hơn tôi nghĩ. Điều làm tôi khó chịu là hai chỗ tự hại mình: `set search_path` trên hàm SQL làm planner không inline được, feed quét hết kudo; và một bản sửa review kéo theo regression mới. Visual cuối cùng cũng không đạt tolerance, chỉ được chấp nhận như deviation có follow-up.

## Technical Details

- pgTAP: 117 test lúc GREEN đầu, 119 sau review. Mutation probe 1 (cấp EXECUTE cho `anon` trên `toggle_kudo_like`): `Failed test 3 "anon cannot execute toggle_kudo_like" have: true want: false`, `Failed test 28 ... caught: P0001: sunner_not_found wanted: 42501`. Probe 2 (special day ép còn 1 tim) cũng bị bắt.
- EXPLAIN (20000 dòng, `evidence/review-fix-m1-explain-*.txt`): feed keyset qua `kudo_private.matching_kudos` trước: `Execution Time: 15.911 ms`, `Buffers: shared hit=508`, Function Scan trả 15026 dòng. Sau khi inline filter và đổi cursor thành `ROW(created_at, id) < ROW(...)`: `0.105 ms`, `shared hit=4`. Lọc hashtag + cursor vẫn là `1.821 ms`, `shared hit=317`, nên chưa phải hết vấn đề.
- Visual 1440 (`visual-mismatch-list.md`, round 2): banner cao hơn Figma +32 px, card carousel +17 px, pager ≈+19 px, Spotlight và All Kudos lệch cascade ≈+24 px. Spotlight nền để phẳng navy, vì artwork MoMorph trả 500/401 khi export.

## What We Tried

- Giữ `set search_path = ''` cho mọi hàm và viết tên đầy đủ schema. Đây là đúng cho bảo mật, nhưng nó chặn inline. Sửa: inline các filter vào thân hàm, dùng keyset row-comparison.
- Review đề xuất kiểm tra "base value" cho trạng thái like để tránh stale. Kết quả: hai thẻ của cùng một kudo lệch nhau. Bỏ check, dùng một entry chia sẻ cho mọi thẻ và reset khi đổi filter key. Cách đơn giản thắng.
- Visual round 1 có lỗi thật: eyebrow "Sun* Annual Awards 2025" có trong DOM nhưng bị layer của banner che. Round 2 sửa được.
- Hai Playwright chạy song song trong cùng thư mục: `ENOENT ... test-results/.playwright-artifacts-N/traces/...`, và một run giữ cổng 3100. Phải chờ rồi chạy lại.

## Root Cause Analysis

Tôi tối ưu sai tầng. `search_path` cố định là yêu cầu bảo mật thật, nhưng tôi không kiểm tra nó ảnh hưởng planner. Bản sửa review thì mượn giả định "stale" mà không nghĩ tới việc một kudo xuất hiện ở nhiều thẻ. Mock và SQL trôi lệch: `EXPECT.senderStats` (`e2e/support/kudos-fixture-ids.ts:87`) ghi sai, còn các defect e2e chỉ lộ ra khi tích hợp. Test seed-parity pgTAP có sẵn nhưng không bắt được hằng số phase-1 sai.

## Lessons Learned

- Sau hàm SQL nào có `set search_path`, chạy EXPLAIN ANALYZE trên dữ liệu đủ lớn trước khi gọi là xong.
- Bản sửa review phải chạy lại đúng bộ test chứng minh phần nó đụng tới.
- Mọi hằng số `EXPECT` phải suy ra từ dữ liệu seed, không viết tay.
- Gate bằng chứng đòi `acceptanceCovered` lặp nguyên văn tiêu chí. Verdict đầu bị REWORK tới khi thêm assertion nhãn thời gian, clamp, fade, chi tiết khách.
- Test thời gian dùng ngày 10/10 nên thứ tự MM/DD chỉ được chứng minh bằng code.
- Khi bị dừng giữa chừng, nhắn lại đúng agent đã dừng để giữ ngữ cảnh, đừng dựng lại từ đầu.

## Next Steps

- Visual 1440: banner −32 px, card −17 px, pager; kiểm lại Spotlight và All Kudos. Chủ: UI owner, trước khi merge PR #9.
- Thêm fixture có ngày khác tháng để khóa thứ tự MM/DD. Chủ: tester.
- Quyết định footer và header dùng chung. Chủ: owner layout `(main)`.
- Lọc hashtag + cursor vẫn quét 15026 dòng. Mở issue riêng nếu dữ liệu thật lớn hơn seed.
