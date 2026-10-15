-- Local seed for the Sun* Kudos live board (applied by `supabase db reset` after migrations).
-- Mirrors the E2E mock fixture row for row: e2e/support/kudos-fixture-ids.ts (ids, names) and
-- e2e/support/mock-kudos-fixture-{people,kudos}.ts (departments, kudos, hashtags, boxes); Figma content.
-- supabase/tests/database/kudos-seed-matches-e2e-fixture.test.sql fails if the two drift apart.
-- sunners.user_id stays null (real Google uids are unknown). To act as a sunner locally:
--   update public.sunners set user_id = '<auth.users id>' where id = '00000000-0000-4000-8000-000000000101';

insert into public.departments (code, name) values
  ('CEVC10', 'CEVC10'), ('DEV', 'Development'), ('HR', 'Human Resources'), ('MKT', 'Marketing');

insert into public.hashtags (slug, label) values
  ('dedicated', '#Dedicated'), ('inspiring', '#Inspiring'), ('teamwork', '#Teamwork'),
  ('quality-first', '#QualityFirst'), ('proactive', '#Proactive'), ('creative', '#Creative'),
  ('like-target-2026', '#LikeTarget2026');

-- Fixture key -> sunner id (SUNNER in kudos-fixture-ids.ts), used by the inserts below.
create temporary table seed_sunner_key (key text primary key, id uuid not null);
insert into seed_sunner_key (key, id) values
  ('viewer', '00000000-0000-4000-8000-000000000101'), ('sender', '00000000-0000-4000-8000-000000000102'),
  ('liker', '00000000-0000-4000-8000-000000000103'), ('nhat', '00000000-0000-4000-8000-000000000104'),
  ('xuan', '00000000-0000-4000-8000-000000000105'), ('linh', '00000000-0000-4000-8000-000000000106'),
  ('quy', '00000000-0000-4000-8000-000000000107'), ('duc', '00000000-0000-4000-8000-000000000108'),
  ('chuc', '00000000-0000-4000-8000-000000000109'), ('tam', '00000000-0000-4000-8000-000000000110');

insert into public.sunners (id, full_name, avatar_url, department_id, hero_title)
select k.id, v.full_name, v.avatar_url, d.id, v.hero_title
from (values
  ('viewer', 'E2E User', '/images/kudos/avatars/viewer.png', 'DEV', 'rising_hero'),
  ('sender', 'Phạm Thu Hà', '/images/kudos/avatars/sender.png', 'MKT', 'new_hero'),
  ('liker', 'Đỗ Minh Khang', null, 'DEV', null),
  ('nhat', 'Huỳnh Dương Xuân Nhật', '/images/kudos/avatars/nhat.png', 'CEVC10', 'new_hero'),
  ('xuan', 'Huỳnh Dương Xuân', '/images/kudos/avatars/xuan.png', 'CEVC10', 'legend_hero'),
  ('linh', 'Nguyễn Hoàng Linh', '/images/kudos/avatars/linh.png', 'MKT', 'super_hero'),
  ('quy', 'Nguyễn Văn Quy', '/images/kudos/avatars/quy.png', 'DEV', 'rising_hero'),
  ('duc', 'Trần Minh Đức', null, 'DEV', null),
  ('chuc', 'Nguyễn Bá Chúc', '/images/kudos/avatars/chuc.png', 'HR', 'super_hero'),
  ('tam', 'Lê Thị Tâm', null, 'HR', null)
) as v (key, full_name, avatar_url, department_code, hero_title)
join seed_sunner_key k on k.key = v.key
join public.departments d on d.code = v.department_code;

-- Kudo n (1..25): id kudoId(n), created 2026-10-10 09:00 +07 plus n * 10 minutes (25 = newest).
-- base_likes = the mock's anonymous likes; they become like rows from the filler sunners below.
create temporary table seed_kudo (
  n int primary key, sender text, receiver text, tags text[], base_likes int, images int, title text, content text
);
insert into seed_kudo values
  (1, 'duc', 'xuan', '{dedicated}', 0, 0, null, 'Cảm ơn anh đã hỗ trợ cả team vượt qua deadline tuần này.'),
  (2, 'tam', 'viewer', '{teamwork}', 1, 0, null, 'Cảm ơn bạn đã luôn sẵn sàng giúp đỡ mỗi khi team cần.'),
  (3, 'nhat', 'quy', '{inspiring}', 0, 1, null, 'Cảm ơn em đã chia sẻ kiến thức trong buổi đào tạo nội bộ.'),
  (4, 'viewer', 'nhat', '{dedicated,teamwork}', 2, 2, 'IDOL GIỚI TRẺ', 'Cảm ơn em đã nhiệt tình hỗ trợ cả team trong đợt triển khai!'),
  (5, 'chuc', 'linh', '{dedicated}', 0, 0, null, 'Cảm ơn chị đã dành thời gian review hồ sơ chiến dịch.'),
  (6, 'linh', 'viewer', '{teamwork,inspiring}', 0, 0, null, 'Cảm ơn bạn đã cùng làm việc và kiên nhẫn với mình trong suốt dự án.'),
  (7, 'xuan', 'duc', '{inspiring}', 4, 0, null, 'Cảm ơn anh đã hướng dẫn mình cách viết tài liệu rõ ràng hơn.'),
  (8, 'quy', 'tam', '{}', 0, 0, null, 'Cảm ơn chị đã nhắc mình gửi báo cáo đúng hạn.'),
  (9, 'liker', 'nhat', '{teamwork}', 0, 0, null, 'Cảm ơn bạn đã tổ chức buổi chia sẻ teamwork thật vui.'),
  (10, 'sender', 'linh', '{teamwork}', 7, 3, 'IDOL GIỚI TRẺ', 'Cảm ơn chị đã truyền cảm hứng cho cả team mỗi ngày.'),
  (11, 'duc', 'chuc', '{inspiring}', 0, 0, null,
   'Cảm ơn em về sự chăm chỉ, cẩn trọng và tinh thần trách nhiệm của em trong suốt thời gian vừa qua. '
   'Em luôn chủ động nhận những việc khó, dành thời gian giải thích cho đồng nghiệp mới và không ngại làm lại '
   'khi chưa đạt yêu cầu. Nhờ có em, dự án đã đi đúng tiến độ và chất lượng luôn được giữ vững. '
   'Cảm ơn em rất nhiều và mong chúng ta tiếp tục đồng hành cùng nhau trong những dự án tiếp theo nhé!'),
  (12, 'nhat', 'xuan', '{dedicated,inspiring,teamwork,quality-first,proactive,creative}', 1, 0, null, 'Cảm ơn anh vì mọi đóng góp từ ý tưởng đến cách làm việc nhóm.'),
  (13, 'liker', 'linh', '{creative}', 0, 6, null, 'Cảm ơn chị đã chụp lại những khoảnh khắc đẹp của sự kiện!'),
  (14, 'quy', 'duc', '{proactive}', 0, 0, null, 'Cảm ơn bạn đã đề xuất cải tiến quy trình, giúp team tiết kiệm thời gian.'),
  (15, 'xuan', 'linh', '{dedicated,teamwork}', 30, 0, null, 'Cảm ơn chị đã luôn tận tâm với khách hàng và đồng đội.'),
  (16, 'tam', 'duc', '{inspiring}', 1, 0, null, 'Cảm ơn anh đã cùng mình xử lý sự cố đêm qua.'),
  (17, 'viewer', 'quy', '{dedicated}', 1, 0, null, 'Cảm ơn bạn đã gửi những lời động viên đúng lúc.'),
  (18, 'linh', 'xuan', '{teamwork}', 42, 1, null, 'Cảm ơn anh đã chia sẻ bí quyết giữ năng lượng cho team.'),
  (19, 'chuc', 'viewer', '{creative}', 0, 0, null, 'Cảm ơn chị đã giúp mình hoàn thiện slide cho buổi thuyết trình.'),
  (20, 'duc', 'linh', '{dedicated,creative}', 50, 2, null, 'Cảm ơn em đã luôn sáng tạo và mang đến ý tưởng mới cho chiến dịch.'),
  (21, 'nhat', 'duc', '{inspiring}', 7, 0, null, 'Cảm ơn bạn vì những buổi họp ngắn gọn và hiệu quả.'),
  (22, 'sender', 'nhat', '{quality-first}', 0, 0, null, 'Cảm ơn chị đã kiên trì hỗ trợ mình trong giai đoạn đầu.'),
  (23, 'sender', 'xuan', '{like-target-2026}', 0, 0, null, 'Cảm ơn anh vì buổi demo sản phẩm tuyệt vời.'),
  (24, 'sender', 'quy', '{like-target-2026}', 0, 0, null, 'Cảm ơn chị vì buổi workshop rất hữu ích.'),
  (25, 'duc', 'linh', '{dedicated,teamwork}', 1000, 0, null, 'Cảm ơn chị vì luôn tận tụy và lan tỏa tinh thần Sun* đến mọi người.');

insert into public.kudos (id, sender_id, receiver_id, title, content, created_at)
select ('00000000-0000-4000-8000-0000000002' || lpad(sk.n::text, 2, '0'))::uuid, s.id, r.id, sk.title, sk.content,
       '2026-10-10T02:00:00Z'::timestamptz + sk.n * interval '10 minutes'
from seed_kudo sk
join seed_sunner_key s on s.key = sk.sender
join seed_sunner_key r on r.key = sk.receiver;

insert into public.kudo_hashtags (kudo_id, hashtag_id)
select ('00000000-0000-4000-8000-0000000002' || lpad(sk.n::text, 2, '0'))::uuid, h.id
from seed_kudo sk cross join unnest(sk.tags) as t (slug)
join public.hashtags h on h.slug = t.slug;

insert into public.kudo_images (kudo_id, url, position)
select ('00000000-0000-4000-8000-0000000002' || lpad(sk.n::text, 2, '0'))::uuid,
       '/images/kudos/posts/kudo-' || sk.n || '-' || i || '.jpg', i - 1
from seed_kudo sk cross join generate_series(1, sk.images) as i;

-- Filler likers (no account, no department, never shown): enough for the 1000-like kudo.
insert into public.sunners (id, full_name)
select ('00000000-0000-4000-8000-0003' || lpad(i::text, 8, '0'))::uuid, 'Sunner ' || lpad(i::text, 4, '0')
from generate_series(1, (select max(base_likes) from seed_kudo)) as i;

insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded, created_at)
select ('00000000-0000-4000-8000-0000000002' || lpad(sk.n::text, 2, '0'))::uuid,
       ('00000000-0000-4000-8000-0003' || lpad(i::text, 8, '0'))::uuid, 1,
       '2026-10-10T02:00:00Z'::timestamptz + sk.n * interval '10 minutes' + interval '1 hour'
from seed_kudo sk cross join generate_series(1, sk.base_likes) as i;

-- Secret boxes: index 0 opened newest, 5 minutes apart on 2026-10-12 from 10:00 +07; 3 still closed.
insert into public.secret_boxes (owner_id, opened_at, prize_description)
select s.id, case when v.prize is null then null
                  else '2026-10-12T03:00:00Z'::timestamptz - v.idx * interval '5 minutes' end, v.prize
from (values
  (0, 'linh', 'Voucher 500.000 VND'), (1, 'xuan', 'Tai nghe Bluetooth'), (2, 'nhat', 'Bình giữ nhiệt'),
  (3, 'viewer', 'Voucher cà phê'), (4, 'quy', 'Sổ tay Sun*'), (5, 'duc', 'Áo thun Sun*'),
  (6, 'chuc', 'Balo du lịch'), (7, 'tam', 'Voucher 200.000 VND'), (8, 'liker', 'Sạc dự phòng'),
  (9, 'viewer', 'Móc khóa'), (10, 'nhat', 'Bút ký'), (11, 'xuan', 'Đèn bàn'),
  (12, 'viewer', null), (13, 'xuan', null), (14, 'xuan', null)
) as v (idx, owner, prize)
join seed_sunner_key s on s.key = v.owner;

drop table seed_kudo;
drop table seed_sunner_key;
