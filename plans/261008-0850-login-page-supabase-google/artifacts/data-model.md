<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Output path: docs/generated/entities.md -->

# Entities

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08

## Entity Relationship Diagram

No data — ứng dụng không sở hữu thực thể (entity) hay bảng dữ liệu nào, nên không có sơ đồ quan hệ để vẽ.

## Entities

No data — mã nguồn không định nghĩa bảng, model hay schema nào. Không tạo thực thể nào để tránh bịa nội dung. Bằng chứng (kiểm tra ngày 2026-10-08 trên cây làm việc, loại trừ `.claude/`, `plans/`, `docs/`, `node_modules/`, `.next/`):

| Kiểm tra | Kết quả | Nguồn |
|----------|---------|-------|
| Tìm `.from(`, `.rpc(`, `prisma`, `drizzle`, `typeorm`, `sequelize`, `mongoose`, `knex`, `kysely`, `CREATE TABLE`, `sql` trong `app/`, `lib/`, `proxy.ts` (`*.ts`, `*.tsx`) | 0 kết quả | grep toàn bộ cây mã nguồn ứng dụng |
| Phụ thuộc ORM / driver Postgres trong `package.json` | Không có. Chỉ có `@supabase/ssr` và `@supabase/supabase-js` | `package.json:13-14` |
| File SQL, `migrations/`, `schema.prisma`, `drizzle.config.*` | Không tồn tại | `find` toàn cây; `supabase/` chỉ chứa `config.toml` |
| `supabase/seed.sql` | Không tồn tại, dù `[db.seed]` trỏ tới `./seed.sql` | `supabase/config.toml:67-72` |
| Schema tuỳ biến trong cấu hình Supabase | Không có. `[db.migrations] schema_paths = []`, các giá trị `[db]` là mặc định của CLI | `supabase/config.toml:32`, `supabase/config.toml:61-66` |
| Tầng truy cập dữ liệu | Không có. `lib/supabase/client.ts` và `lib/supabase/server.ts` chỉ khởi tạo client SDK, không truy vấn bảng nào | `lib/supabase/client.ts:5`, `lib/supabase/server.ts:9` |
| Lời gọi Supabase trong ứng dụng | Chỉ thuộc nhóm `auth.*`: `signInWithOAuth`, `getUser`, `signOut` | `lib/auth/sign-in-with-google.ts:15`, `lib/supabase/proxy.ts:47`, `app/todo/page.tsx:27`, `app/auth/logout/route.ts:19` |

Mọi dữ liệu người dùng đều nằm trong dịch vụ Supabase Auth bên ngoài. Ứng dụng chỉ đọc, không lưu, không tạo bảng, không ghi vào schema `public`.

### External reference (not an application entity)

Chỉ để tham khảo. Mục này không phải thực thể của ứng dụng: không có mã định danh thực thể, không có sơ đồ ER, không có trường phân biệt (discriminator), và các spec tính năng không được tham chiếu tới nó như một model.

- **Supabase Auth `User`**: bản ghi người dùng do Supabase Auth sở hữu và quản lý (bảng trong schema `auth` của Supabase, ngoài tầm kiểm soát của mã nguồn này). Ứng dụng chỉ đọc qua `supabase.auth.getUser()`.
- Hai trường ứng dụng dùng:

| Trường | Cách dùng | Nguồn |
|--------|-----------|-------|
| `user` (có hay không) | Có người dùng hợp lệ hay không quyết định chuyển hướng. `proxy.ts` và `/todo` đều chặn khi không có `user`, rồi `redirect('/login')` | `lib/supabase/proxy.ts:47`, `app/todo/page.tsx:27-28` |
| `email` | Hiển thị cho người dùng ở trang `/todo`, kèm giá trị thay thế khi thiếu (`todo.emailMissing`) | `app/todo/page.tsx:37` |

- `id` và các trường khác của `User` không được ứng dụng đọc. Không có chỗ nào trong `app/`, `lib/`, `proxy.ts` dùng `user.id`, `user_metadata` hay `getSession()`.

## Validation Rules

No data — không có thực thể nào của ứng dụng nên không có ràng buộc dữ liệu cần mô tả. Việc kiểm tra tính hợp lệ của người dùng do Supabase Auth thực hiện phía máy chủ qua `getUser()`.

## Summary

- **Total Entities**: 0
- **Total Relationships**: 0
