# Permissions

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08
**Analysis Scope**: Next.js 16 App Router + Supabase Auth, đối chiếu mã nguồn tại `proxy.ts`, `lib/supabase/proxy.ts`, `app/todo/page.tsx`, `app/auth/callback/route.ts`, `app/auth/logout/route.ts`, `app/page.tsx`, `lib/i18n/*`.

> **Curated, plain-language view.** This document is for PM, BA, and client audiences who
> need to understand access without reading raw codes. The raw PERM### matrix lives at
> [permissions-matrix.md](../generated/permissions-matrix.md). Derive this prose FROM that matrix.
> No PERM### codes and no matrix tables belong here.

## Authorization System Type

**System Type**: `other` — chỉ phân biệt đã đăng nhập hay chưa. Không có RBAC, không có phân quyền theo bản ghi, không có dữ liệu riêng của từng người dùng trong ứng dụng.

**Identified Roles**:
- `anonymous` — chưa có phiên Supabase hợp lệ (chưa đăng nhập, hoặc phiên hết hạn, hoặc không xác minh được).
- `authenticated` — có phiên hợp lệ do đăng nhập bằng Google. Mọi tài khoản Google đều được, không giới hạn theo tên miền.

## Curated View

- **anonymous** xem được trang đăng nhập `/login`, đổi ngôn ngữ VN/EN và bấm "LOGIN With Google" để bắt đầu đăng nhập. Mở `/todo` thì bị chuyển về `/login`. Bấm đăng xuất không có tác dụng gì, vì chưa có phiên để kết thúc.
- **authenticated** xem được `/todo` (email của chính mình và nút đăng xuất) và đăng xuất được. Mở `/login` thì bị chuyển sang `/todo`.
- Mọi người, kể cả khách, đều tải được ảnh và tài nguyên tĩnh (ảnh trang đăng nhập, favicon, tệp của Next.js). Các tài nguyên này không kiểm tra đăng nhập.
- Trang `/` không có nội dung riêng, chuyển mọi người về `/login`; người đã đăng nhập sẽ đi tiếp sang `/todo` ở bước chuyển sau.
- Không có vai trò admin. Hai nhóm người dùng nhìn thấy cùng một ứng dụng, chỉ khác trang nào được phép vào.

## Access Boundaries

Ranh giới duy nhất là **đã đăng nhập hay chưa**, và danh tính được xác minh với máy chủ Supabase Auth ở mỗi yêu cầu (không tin cookie phiên đứng một mình). Cổng kiểm được đặt ở nhiều lớp:

- **Lớp 1, proxy (`proxy.ts`)**: chạy trước mọi trang. Khách vào `/todo` hoặc đường dẫn con của nó bị chuyển về `/login`; người đã đăng nhập vào `/login` bị chuyển sang `/todo`. Khi chuyển hướng, proxy giữ lại cookie phiên vừa làm mới để không làm rơi phiên. Nếu máy chủ Auth không trả lời hoặc không xác minh được phiên, proxy xử lý như chưa đăng nhập (từ chối khi nghi ngờ, không mở cửa khi lỗi).
- **Lớp 2, trang `/todo`**: tự hỏi lại Supabase xem có người dùng không, không có thì chuyển về `/login`. Lớp này bắt trường hợp phiên mất hiệu lực sau khi đã qua proxy.
- **Các đường dẫn `/auth/`** (đăng nhập qua Google quay về, và đăng xuất): proxy bỏ qua hoàn toàn để việc đổi mã đăng nhập không bị ghi đè cookie. Vì vậy từng handler tự bảo vệ:
  - **Quay về từ Google** (`GET /auth/callback`): không cần phiên có sẵn. Chỉ tạo phiên khi không có tham số lỗi, có mã đăng nhập và mã không dài quá 2048 ký tự. Thiếu hoặc sai điều kiện nào, hoặc đổi mã thất bại, người dùng về `/login?error=auth_failed`. Nội dung lỗi của Google không bao giờ được chuyển tiếp hay hiển thị.
  - **Đích chuyển hướng cố định**: sau callback chỉ có hai đích là `/todo` (thành công) và `/login?error=auth_failed` (thất bại). Tham số `next` không được đọc, và đích là đường dẫn tương đối, nên không thể lợi dụng để đưa người dùng sang trang bên ngoài.
  - **Đăng xuất** (`POST /auth/logout`): là Route Handler chỉ nhận POST. Gõ địa chỉ này trên trình duyệt (GET) nhận lỗi 405, không đăng xuất. Handler kết thúc phiên trên thiết bị hiện tại và luôn đưa người dùng về `/login`. Nếu việc đăng xuất ở phía Supabase thất bại, cookie phiên vẫn bị xóa để người dùng không bị kẹt ở trạng thái đã đăng nhập. Handler không từ chối ai: khách gọi cũng chỉ nhận lại chuyển hướng về `/login`.
- **Ngôn ngữ không phải quyền**: lựa chọn VN/EN (cookie `NEXT_LOCALE`) chỉ đổi chữ hiển thị. Không chức năng, trang hay dữ liệu nào bật hoặc tắt theo ngôn ngữ. Giá trị ngôn ngữ lạ bị bỏ qua. Ai cũng đổi được, kể cả khách.

## Special Conditions

- **Phiên và cookie**: cookie phiên do thư viện Supabase quản lý (dạng `sb-<ref>-auth-token`, có thể chia nhiều mảnh), ứng dụng không tự đọc hay ghi tay. Chỉ proxy và Route Handler mới ghi được cookie; trang chỉ đọc, nên việc làm mới phiên nằm ở proxy.
- **Địa chỉ quay về**: địa chỉ callback dựng từ origin hiện tại của trình duyệt. Khi chạy local nên dùng một host duy nhất (ví dụ `localhost`) từ lúc bắt đầu đăng nhập tới lúc quay về, để cookie xác minh đăng nhập khớp.
- **Chỉ đăng xuất thiết bị hiện tại**: đăng xuất không thu hồi phiên ở thiết bị khác.
- Không có điều kiện theo thời gian, địa chỉ IP, feature flag hay môi trường (production/dev) làm đổi quyền truy cập. Chi tiết từng cổng kiểm nằm ở [permissions-matrix.md](../generated/permissions-matrix.md).
