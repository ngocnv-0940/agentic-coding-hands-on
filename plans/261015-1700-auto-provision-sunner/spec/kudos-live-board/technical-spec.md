---
status: draft
authored_by: takumi
fcode: F006
created: 2026-10-15
lang: vi
---

<!-- DELTA (run UPDATE): chỉ gồm các dòng/mục đổi của docs/features/F006_KudosLiveBoard/technical-spec.md. Trigger là cross-cutting (không có CAP riêng, không có nút bấm): xếp vào A0 / § 4.4 Bin 3 thay vì thêm A14, để khỏi mở bucket CAP mới. -->

## 2. Action Index

Dòng A0 thêm bốn mã (giữ các mã cũ):

| # | Action (handler) | Method · Path | Codes | Writes | Detail |
|---|---|---|---|---|---|
| **A0** | *cross-cutting — belongs to no single action* | — | FR-001, FR-002, FR-003, FR-601, FR-602, FR-604, **FR-605**, BR-001, BR-010, **BR-012**, **ALG-007**, **INT-004** | `sunners` *(qua trigger `after insert` trên `auth.users` và migration backfill)* | § 4.4 |

Dòng A11 và A6: không đổi mã (DEC-006 và `sunner_not_found` giữ làm chốt chặn).

## 3. Actions

### 3.8 Edge cases

| Action | Scenario | Behavior |
|---|---|---|
| A6 *(đổi)* | Người dùng không có hàng `sunners` (chỉ còn khi hồ sơ bị gỡ liên kết do `on delete set null` hoặc bị xóa) | RPC lỗi `sunner_not_found`, toast lỗi, tim trở về trạng thái trước |
| A11 *(đổi)* | Người dùng không có hàng `sunners` (như trên) | Năm số bằng 0, nút "Mở Secret Box" vô hiệu (chưa mở = 0) |
| A0 *(MỚI)* | Hai lần chèn `auth.users` cho cùng `id`, hoặc backfill chạy lại | `on conflict (user_id) do nothing`: giữ đúng một hàng, không lỗi |
| A0 *(MỚI)* | Metadata Google thiếu hoặc rỗng (tên, ảnh) | ALG-007 rơi về email rồi "Sunner"; ảnh null; insert không thể vi phạm ràng buộc `full_name not null` |

## 4. Shared Foundation

### 4.2 Data Model — Key Entities

Dòng `Sunner` (đổi cột Purpose; cột khác giữ nguyên, không đổi bảng/cột):

| Entity | Table | Key Columns | Purpose |
|--------|-------|-------------|---------|
| Sunner | `sunners` | `id`, `user_id` (nullable, liên kết `auth.users`), `full_name`, `avatar_url`, `department_id`, `hero_title` (DISC-002, nullable) | Hồ sơ người gửi, người nhận, chủ Secret Box; "người dùng hiện tại" là hàng có `user_id = auth.uid()`. Hàng có `user_id` do trigger tạo ra ở lần đăng nhập đầu (BR-012, INT-004); hàng seed giữ `user_id` null |

DISC-002 (`hero_title`): cột Persistence "Ghi bởi seed" giữ nguyên — hồ sơ tự tạo luôn `hero_title = null`, không có huy hiệu.

### 4.4 Shared Rules

#### Bin 3 — cross-cutting, belongs to no single action

**BR-012 — Mỗi tài khoản `auth.users` có đúng một hàng `sunners`, tạo tự động lúc tài khoản ra đời, không lọc tên miền.** Gắn vào A0 vì không có người bấm: trigger `after insert on auth.users` (INT-004) chạy trong cùng giao dịch với việc tạo tài khoản, nên trước khi người dùng thấy trang thì hàng đã tồn tại. Backfill của migration áp cùng luật cho tài khoản cũ. `user_id` duy nhất cộng `on conflict (user_id) do nothing` làm việc tạo lặp vô hại; hàng seed không bao giờ bị khớp hay sửa. Nội dung hàng theo ALG-007; `department_id`, `hero_title` null. Trigger không nuốt lỗi: lỗi thật phải hiện ra thay vì để tài khoản không có hồ sơ trong im lặng.
**Linked FR:** FR-605, FR-311, FR-603
**Source:** TBD (draft)

### 4.5 Algorithms & Integrations

### Tên và ảnh của hồ sơ tự tạo (ALG-007)

**Linked FR:** FR-605
**Used in:** A0
**Source:** TBD (draft)
**Input:** `raw_user_meta_data` (jsonb) và `email` của dòng `auth.users` mới · **Output:** `full_name` (không rỗng, ≤ 100 ký tự), `avatar_url` (https hoặc null) · **Complexity:** O(1)
**Description:** Hàm thuần SQL, tên rơi theo thứ tự: `full_name`, `name`, phần trước "@" của email, "Sunner". Giá trị rỗng sau khi bỏ khoảng trắng đầu cuối coi như thiếu. Ảnh lấy `avatar_url`, nếu thiếu thì `picture`; chỉ nhận chuỗi bắt đầu bằng `https://`, còn lại là null (chặn `http:`, `javascript:` và dữ liệu lạ vì ảnh được render ở mọi thẻ kudo).
**Pseudocode:**
```text
name = first non-blank of [trim(meta.full_name), trim(meta.name), trim(split_part(email, '@', 1))]
full_name = left(name or 'Sunner', 100)
pic = first non-blank of [trim(meta.avatar_url), trim(meta.picture)]
avatar_url = pic if pic starts with 'https://' else null
```

### Trigger tạo hồ sơ trên auth.users (INT-004)

**Linked FR:** FR-605
**Used in:** A0
**Source:** TBD (draft)
**Input:** dòng `auth.users` vừa chèn · **Output:** một hàng `sunners` (`user_id = new.id`, ALG-007) · **Complexity:** O(1)
**Description:** Hàm trigger trong schema `kudos_private` (PostgREST không phơi ra), `SECURITY DEFINER`, `set search_path = ''`, mọi tên viết đủ schema; gắn `after insert on auth.users for each row`. Ghi bằng `insert ... on conflict (user_id) do nothing`. Hàm không cấp `EXECUTE` cho `anon` và `authenticated` (chỉ chạy như trigger). Cùng migration chạy một lần `insert ... select` cho `auth.users` chưa có hàng `sunners`, dùng đúng ALG-007. Không đổi `/auth/callback` và không cần service role ở mã ứng dụng. Với E2E, mock Supabase `e2e/support/mock-supabase-server.ts` cần mô phỏng cùng luật (hàng `sunners` cho người dùng mới); SQL thật kiểm bằng pgTAP.

## 5. Verification & Technical Notes

### 5.1 Technical Verification

- **SC-012** *(A0)* Chèn một `auth.users` có metadata Google đủ: có đúng một hàng `sunners` với `user_id`, tên và ảnh khớp; metadata thiếu tên: tên rơi về email rồi "Sunner"; ảnh `http:` hoặc `javascript:` thành null; chèn lại cùng `id` hoặc chạy lại backfill không thêm hàng; tên dài hơn 100 ký tự bị cắt; tài khoản cũ chưa có hàng được backfill; hàng seed không đổi; `anon` và `authenticated` không gọi trực tiếp được hàm trigger; tài khoản mới gọi `toggle_kudo_like` và `create_kudo` không còn `sunner_not_found`.
- **SC-006, SC-009** *(đổi nhẹ)* Nhánh "không có hàng `sunners`" vẫn kiểm (dựng bằng cách xóa hoặc gỡ `user_id` của hàng), nhưng không còn là trạng thái của tài khoản mới.

### 5.3 Unresolved Questions

Mục 8 *(đổi, đã chốt)*: **Người dùng đăng nhập nhưng chưa có hàng `sunners`** *(A6, A11)*: đã chốt tự tạo hàng ở lần đăng nhập đầu bằng trigger `auth.users` (D013, BR-012, INT-004); các đường RPC báo `sunner_not_found` giữ làm chốt chặn. Chuyển mục này xuống "đã giải quyết" khi promote.
