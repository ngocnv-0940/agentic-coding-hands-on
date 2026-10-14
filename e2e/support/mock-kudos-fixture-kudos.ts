/**
 * Kudos mock fixtures: the 25 kudos, hashtags and secret boxes behind the full dataset.
 * Index n (1..25) is both the kudo number in kudos-fixture-ids.ts and the creation order
 * (25 newest). Content follows the Figma frame; ids, counts and orders are the expectations
 * in EXPECT, so edit both together.
 * Row tuple: [senderKey, receiverKey, hashtag slugs, baseLikes, imageCount, title, content].
 * baseLikes are anonymous likes (1 heart each) with no like row; they give ALG-001 its order.
 */
import type { SUNNER } from './kudos-fixture-ids'

export type SunnerKey = keyof typeof SUNNER

export interface KudoRow {
  sender: SunnerKey
  receiver: SunnerKey
  tags: string[]
  baseLikes: number
  images: number
  title: string | null
  content: string
}

const LONG_CONTENT =
  'Cảm ơn em về sự chăm chỉ, cẩn trọng và tinh thần trách nhiệm của em trong suốt thời gian vừa qua. ' +
  'Em luôn chủ động nhận những việc khó, dành thời gian giải thích cho đồng nghiệp mới và không ngại làm lại ' +
  'khi chưa đạt yêu cầu. Nhờ có em, dự án đã đi đúng tiến độ và chất lượng luôn được giữ vững. ' +
  'Cảm ơn em rất nhiều và mong chúng ta tiếp tục đồng hành cùng nhau trong những dự án tiếp theo nhé!'

const IDOL = 'IDOL GIỚI TRẺ'

/** Index 0 is kudo 1. Expected orders in EXPECT depend on every value here. */
export const KUDO_ROWS: KudoRow[] = [
  row('duc', 'xuan', ['dedicated'], 0, 0, null, 'Cảm ơn anh đã hỗ trợ cả team vượt qua deadline tuần này.'),
  row('tam', 'viewer', ['teamwork'], 1, 0, null, 'Cảm ơn bạn đã luôn sẵn sàng giúp đỡ mỗi khi team cần.'),
  row('nhat', 'quy', ['inspiring'], 0, 1, null, 'Cảm ơn em đã chia sẻ kiến thức trong buổi đào tạo nội bộ.'),
  row('viewer', 'nhat', ['dedicated', 'teamwork'], 2, 2, IDOL, 'Cảm ơn em đã nhiệt tình hỗ trợ cả team trong đợt triển khai!'),
  row('chuc', 'linh', ['dedicated'], 0, 0, null, 'Cảm ơn chị đã dành thời gian review hồ sơ chiến dịch.'),
  row('linh', 'viewer', ['teamwork', 'inspiring'], 0, 0, null, 'Cảm ơn bạn đã cùng làm việc và kiên nhẫn với mình trong suốt dự án.'),
  row('xuan', 'duc', ['inspiring'], 4, 0, null, 'Cảm ơn anh đã hướng dẫn mình cách viết tài liệu rõ ràng hơn.'),
  row('quy', 'tam', [], 0, 0, null, 'Cảm ơn chị đã nhắc mình gửi báo cáo đúng hạn.'),
  row('liker', 'nhat', ['teamwork'], 0, 0, null, 'Cảm ơn bạn đã tổ chức buổi chia sẻ teamwork thật vui.'),
  row('sender', 'linh', ['teamwork'], 7, 3, IDOL, 'Cảm ơn chị đã truyền cảm hứng cho cả team mỗi ngày.'),
  row('duc', 'chuc', ['inspiring'], 0, 0, null, LONG_CONTENT),
  row('nhat', 'xuan', ['dedicated', 'inspiring', 'teamwork', 'quality-first', 'proactive', 'creative'], 1, 0, null, 'Cảm ơn anh vì mọi đóng góp từ ý tưởng đến cách làm việc nhóm.'),
  row('liker', 'linh', ['creative'], 0, 6, null, 'Cảm ơn chị đã chụp lại những khoảnh khắc đẹp của sự kiện!'),
  row('quy', 'duc', ['proactive'], 0, 0, null, 'Cảm ơn bạn đã đề xuất cải tiến quy trình, giúp team tiết kiệm thời gian.'),
  row('xuan', 'linh', ['dedicated', 'teamwork'], 30, 0, null, 'Cảm ơn chị đã luôn tận tâm với khách hàng và đồng đội.'),
  row('tam', 'duc', ['inspiring'], 1, 0, null, 'Cảm ơn anh đã cùng mình xử lý sự cố đêm qua.'),
  row('viewer', 'quy', ['dedicated'], 1, 0, null, 'Cảm ơn bạn đã gửi những lời động viên đúng lúc.'),
  row('linh', 'xuan',['teamwork'], 42, 1, null, 'Cảm ơn anh đã chia sẻ bí quyết giữ năng lượng cho team.'),
  row('chuc', 'viewer', ['creative'], 0, 0, null, 'Cảm ơn chị đã giúp mình hoàn thiện slide cho buổi thuyết trình.'),
  row('duc', 'linh', ['dedicated', 'creative'], 50, 2, null, 'Cảm ơn em đã luôn sáng tạo và mang đến ý tưởng mới cho chiến dịch.'),
  row('nhat', 'duc', ['inspiring'], 7, 0, null, 'Cảm ơn bạn vì những buổi họp ngắn gọn và hiệu quả.'),
  row('sender', 'nhat', ['quality-first'], 0, 0, null, 'Cảm ơn chị đã kiên trì hỗ trợ mình trong giai đoạn đầu.'),
  row('sender', 'xuan', ['like-target-2026'], 0, 0, null, 'Cảm ơn anh vì buổi demo sản phẩm tuyệt vời.'),
  row('sender', 'quy', ['like-target-2026'], 0, 0, null, 'Cảm ơn chị vì buổi workshop rất hữu ích.'),
  row('duc', 'linh', ['dedicated', 'teamwork'], 1000, 0, null, 'Cảm ơn chị vì luôn tận tụy và lan tỏa tinh thần Sun* đến mọi người.'),
]

function row(sender: string, receiver: string, tags: string[], baseLikes: number, images: number, title: string | null, content: string): KudoRow {
  return { sender: sender as SunnerKey, receiver: receiver as SunnerKey, tags, baseLikes, images, title, content }
}

/** Hashtags sorted by label in the UI; the mock sorts them too. */
export const HASHTAGS = [
  { slug: 'dedicated', label: '#Dedicated' },
  { slug: 'inspiring', label: '#Inspiring' },
  { slug: 'teamwork', label: '#Teamwork' },
  { slug: 'quality-first', label: '#QualityFirst' },
  { slug: 'proactive', label: '#Proactive' },
  { slug: 'creative', label: '#Creative' },
  { slug: 'like-target-2026', label: '#LikeTarget2026' },
] as const

/** Secret boxes, newest opened first. `opened: false` rows have no prize yet. */
export const BOX_ROWS: Array<{ owner: SunnerKey; opened: boolean; prize: string | null }> = [
  { owner: 'linh', opened: true, prize: 'Voucher 500.000 VND' },
  { owner: 'xuan', opened: true, prize: 'Tai nghe Bluetooth' },
  { owner: 'nhat', opened: true, prize: 'Bình giữ nhiệt' },
  { owner: 'viewer', opened: true, prize: 'Voucher cà phê' },
  { owner: 'quy', opened: true, prize: 'Sổ tay Sun*' },
  { owner: 'duc', opened: true, prize: 'Áo thun Sun*' },
  { owner: 'chuc', opened: true, prize: 'Balo du lịch' },
  { owner: 'tam', opened: true, prize: 'Voucher 200.000 VND' },
  { owner: 'liker', opened: true, prize: 'Sạc dự phòng' },
  { owner: 'viewer', opened: true, prize: 'Móc khóa' },
  { owner: 'nhat', opened: true, prize: 'Bút ký' },
  { owner: 'xuan', opened: true, prize: 'Đèn bàn' },
  { owner: 'viewer', opened: false, prize: null },
  { owner: 'xuan', opened: false, prize: null },
  { owner: 'xuan', opened: false, prize: null },
]

/** Base time for kudo n: 2026-10-10 09:00 +07 plus n * 10 minutes (so kudo 25 is newest). */
export const kudoCreatedAt = (n: number) => new Date(Date.UTC(2026, 9, 10, 2, 0) + n * 600_000).toISOString()

/** Box n (0 = newest) opened 5 minutes apart on 2026-10-12. */
export const boxOpenedAt = (index: number) => new Date(Date.UTC(2026, 9, 12, 3, 0) - index * 300_000).toISOString()
