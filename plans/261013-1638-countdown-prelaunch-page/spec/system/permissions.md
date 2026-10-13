---
status: draft
authored_by: takumi
created: 2026-10-13
lang: vi
---

# Permissions

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-13
**Analysis Scope**: Thêm lớp khóa trước ngày ra mắt: trước `EVENT_START_AT`, mọi đường dẫn trừ `/login`, `/auth/*`, `/prelaunch` và tài nguyên tĩnh bị proxy chuyển tới trang đếm ngược công khai `/prelaunch`. Cơ sở là bản hiện hành của tài liệu này, `proxy.ts`, `lib/supabase/proxy.ts`, `lib/event/event-start-config.ts` và `plans/261013-1638-countdown-prelaunch-page/clarifications.md`.

> **Curated, plain-language view.** This document is for PM, BA, and client audiences who
> need to understand access without reading raw codes. The raw PERM### matrix lives at
> [permissions-matrix.md](../generated/permissions-matrix.md). Derive this prose FROM that matrix.
> No PERM### codes and no matrix tables belong here.
>
> Mô tả hành vi đã đối chiếu với mã (`proxy.ts`, `lib/supabase/proxy.ts`, `app/(main)/layout.tsx`, `lib/auth/`). Lý do thiết kế nằm ở ADR, không nằm ở đây.

## Authorization System Type

**System Type**: `other` — vẫn chỉ phân biệt đã đăng nhập hay chưa. Chưa có RBAC đầy đủ: cờ `admin` (xem dưới) chỉ quyết định hai việc, *hiện hay ẩn mục menu Admin Dashboard* và *cho hay chặn truy cập `/admin` ở phía máy chủ*. Không có phân quyền theo bản ghi, không có dữ liệu riêng của từng người dùng.

**Identified Roles**:
- `anonymous` — chưa có phiên Supabase hợp lệ (chưa đăng nhập, phiên hết hạn, hoặc không xác minh được).
- `authenticated` — có phiên hợp lệ do đăng nhập bằng Google. Mọi tài khoản Google đều được, không giới hạn theo tên miền.
- `admin` (cờ phụ, không phải vai trò độc lập) — một `authenticated` có `user.app_metadata.role === 'admin'`. Làm hiện mục "Admin Dashboard" trong menu tài khoản và là điều kiện để vào `/admin`. Giá trị này nằm ở `app_metadata`, chỉ phía máy chủ/dashboard Supabase ghi được; người dùng không tự sửa được (khác với `user_metadata`).

## Curated View

- **Trước ngày ra mắt (trước `EVENT_START_AT`)**: ai cũng như nhau, khách hay đã đăng nhập, admin hay không. Mở bất kỳ đường dẫn nào (kể cả đường dẫn không tồn tại) đều bị chuyển tới `/prelaunch`, trừ `/login`, `/auth/*` và tài nguyên tĩnh. Trang `/prelaunch` công khai, chỉ có đồng hồ đếm ngược. Các mô tả bên dưới về trang chủ, trang giữ chỗ và `/admin` chỉ có hiệu lực **từ mốc trở đi**, hoặc khi `EVENT_START_AT` thiếu hay sai (khi đó không khóa).
- **anonymous** xem được trang đăng nhập `/login`, đổi ngôn ngữ VN/EN và bấm "LOGIN With Google" (cả trước mốc). Từ mốc, mở `/` hay bất kỳ trang được bảo vệ nào (liệt kê ở Access Boundaries) đều bị chuyển về `/login`. Bấm đăng xuất không có tác dụng, vì chưa có phiên.
- **authenticated** vào được trang chủ `/`, `/todo`, `/awards-information` (trang Hệ thống giải) và các trang giữ chỗ (`/sun-kudos`, `/standards`, `/profile`). Mở thẳng `/admin` mà không phải admin thì bị chuyển về `/`. Đăng nhập xong thì về `/` (trước mốc, `/` lại chuyển tiếp tới `/prelaunch`). Mở `/login` thì bị chuyển sang `/`. Đăng xuất từ menu tài khoản trên trang chủ.
- **admin** thấy y như `authenticated`, thêm mục "Admin Dashboard" trong menu tài khoản, dẫn tới `/admin`, và là người duy nhất vào được trang đó (hiện chỉ là trang giữ chỗ, chưa có dữ liệu).
- Mọi người, kể cả khách, xem được `/prelaunch` trước mốc. Từ mốc, mở `/prelaunch` bị chuyển về `/`.
- Mọi người, kể cả khách, tải được ảnh và tài nguyên tĩnh (ảnh trang đăng nhập, favicon, tệp của Next.js). Các tài nguyên này không kiểm tra đăng nhập.
- Trang `/` giờ là trang chủ thật (không còn chỉ chuyển hướng). Khách không thấy nội dung của nó.
- Ngoài mục Admin Dashboard, hai nhóm người dùng nhìn thấy cùng một ứng dụng, chỉ khác trang nào được phép vào.

## Access Boundaries

Ranh giới chính vẫn là **đã đăng nhập hay chưa**, và danh tính được xác minh với máy chủ Supabase Auth ở mỗi yêu cầu (không tin cookie phiên đứng một mình). Cổng kiểm được đặt ở nhiều lớp:

- **Lớp 0, khóa trước ngày ra mắt (trong proxy, cùng `lib/supabase/proxy.ts`)**: chạy sau bước làm mới phiên và trước các guard của lớp 1, không phụ thuộc người dùng là ai. Quyết định dựa trên đồng hồ máy chủ và `EVENT_START_AT` (biến chỉ phía máy chủ), nên đổi giờ trên máy người dùng không mở được khóa.
  - **Trước mốc** (mốc hợp lệ và giờ hiện tại sớm hơn mốc): mọi đường dẫn, trừ `/login`, `/auth/*`, `/prelaunch` và tài nguyên tĩnh nằm ngoài matcher của proxy, bị chuyển 307 tới `/prelaunch`, kể cả đường dẫn không tồn tại và đường dẫn con của trang được bảo vệ. Redirect mang theo cookie phiên vừa làm mới. `/login` vẫn qua lớp 0 và chịu guard cũ của nó (người đã đăng nhập vào `/login` về `/`, rồi `/` lại tới `/prelaunch`). `/prelaunch` công khai, không đọc phiên.
  - **Từ mốc, hoặc `EVENT_START_AT` thiếu hay sai**: không khóa. Chỉ riêng `/prelaunch` bị chuyển 307 về `/`; mọi đường dẫn khác đi tiếp vào lớp 1 như trước. Đúng lúc bằng mốc cũng tính là đã tới mốc. Mốc sai không bao giờ khóa cả site (từ chối khi nghi ngờ áp dụng cho quyền truy cập vào nội dung, còn ở đây một cấu hình hỏng không được chặn mọi người).
  - **Máy chủ Auth không trả lời**: khóa vẫn áp dụng như thường, vì quyết định không dùng phiên.
  - **Trang `/prelaunch` tự chuyển về `/` khi tới mốc** theo thời gian còn lại do máy chủ gửi; khách sau đó được lớp 1 đưa sang `/login`.
- **Lớp 1, proxy (`proxy.ts`)**: chạy trước mọi trang (từ mốc trở đi, hoặc cho `/login` ở mọi thời điểm; trước mốc, các đường dẫn bị khóa đã bị lớp 0 chặn). Danh sách đường dẫn được bảo vệ gồm: `/`, `/todo`, `/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin` và đường dẫn con của chúng. Riêng `/` chỉ khớp đúng `/` (không được coi mọi đường dẫn là con của `/`, vì như vậy `/login` cũng thành được bảo vệ và gây vòng chuyển hướng). Khách vào các đường dẫn này bị chuyển về `/login`; người đã đăng nhập vào `/login` bị chuyển sang `/` (trước đây là `/todo`). Khi chuyển hướng, proxy giữ lại cookie phiên vừa làm mới. Nếu máy chủ Auth không trả lời hoặc không xác minh được phiên, proxy xử lý như chưa đăng nhập (từ chối khi nghi ngờ, không mở cửa khi lỗi) — giữ nguyên như hiện nay, vẫn dùng `getUser()` chứ không dùng `getSession()`.
- **Lớp 2, kiểm lại phiên ở phía trang**: `/todo` tự hỏi lại Supabase (`getUser()`), không có người dùng thì chuyển về `/login`. Layout của nhóm route `(main)` (`app/(main)/layout.tsx`) làm tương tự bằng `getCurrentUser()` rồi `redirect('/login')`, nên `/` và mọi trang giữ chỗ (`/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin`) đều được kiểm lại phiên ở đây. Lớp này bắt trường hợp phiên mất hiệu lực sau khi đã qua proxy; proxy vẫn là cổng chính (trả 307 thật), còn `redirect()` trong layout chạy khi nội dung đang stream nên chỉ là chuyển hướng phía client, chấp nhận được cho tình huống hiếm này. `getCurrentUser()` dùng `getUser()` và coi mọi lỗi là chưa đăng nhập. Riêng `/admin`: đã đăng nhập mà `app_metadata.role` khác `admin` thì bị proxy chuyển về `/`.
- **Các đường dẫn `/auth/`** (đăng nhập qua Google quay về, và đăng xuất): proxy vẫn bỏ qua hoàn toàn để việc đổi mã đăng nhập không bị ghi đè cookie. Vì vậy từng handler tự bảo vệ:
  - **Quay về từ Google** (`GET /auth/callback`): không cần phiên có sẵn. Chỉ tạo phiên khi không có tham số lỗi, có mã đăng nhập và mã không dài quá 2048 ký tự. Thiếu hoặc sai điều kiện nào, hoặc đổi mã thất bại, người dùng về `/login?error=auth_failed`. Nội dung lỗi của Google không bao giờ được chuyển tiếp hay hiển thị.
  - **Đích chuyển hướng cố định**: sau callback chỉ có hai đích là `/` (thành công, trước đây là `/todo`) và `/login?error=auth_failed` (thất bại). Tham số `next` vẫn không được đọc, và đích là đường dẫn tương đối, nên không thể lợi dụng để đưa người dùng sang trang bên ngoài. Hệ quả: người bị chuyển về `/login` từ một trang sâu (ví dụ `/profile`) đăng nhập xong vẫn về `/`, không quay lại trang đang mở dở.
  - **Đăng xuất** (`POST /auth/logout`, không đổi): Route Handler chỉ nhận POST. Gõ địa chỉ này trên trình duyệt (GET) nhận lỗi 405, không đăng xuất. Handler kết thúc phiên trên thiết bị hiện tại và luôn đưa người dùng về `/login`. Nếu việc đăng xuất ở phía Supabase thất bại, cookie phiên vẫn bị xóa. Handler không từ chối ai: khách gọi cũng chỉ nhận lại chuyển hướng về `/login`. Nút "Sign out" trong menu tài khoản của trang chủ gửi form POST tới đây.
- **Admin Dashboard: ẩn mục và chặn truy cập**: ẩn liên kết trong menu chỉ là giao diện, không ngăn ai gõ thẳng `/admin`. Vì vậy `/admin` còn được chặn ở phía máy chủ, ngay trong proxy (`isAdminUser`, kiểm `app_metadata.role === 'admin'`, trả 307 thật): người đã đăng nhập nhưng không phải admin bị chuyển về `/` (khách thì bị chuyển về `/login`). Trang `/admin` còn kiểm lại vai trò ở phía máy chủ. Khi `/admin` có nội dung thật, mọi API của nó cũng phải kiểm tra vai trò admin ở phía máy chủ.
- **Ngôn ngữ không phải quyền**: lựa chọn VN/EN (cookie `NEXT_LOCALE`) chỉ đổi chữ hiển thị. Không chức năng, trang hay dữ liệu nào bật hoặc tắt theo ngôn ngữ. Giá trị ngôn ngữ lạ bị bỏ qua. Ai cũng đổi được, kể cả khách.

## Special Conditions

- **Phiên và cookie**: cookie phiên do thư viện Supabase quản lý (dạng `sb-<ref>-auth-token`, có thể chia nhiều mảnh), ứng dụng không tự đọc hay ghi tay. Chỉ proxy và Route Handler mới ghi được cookie; trang chỉ đọc, nên việc làm mới phiên nằm ở proxy.
- **Địa chỉ quay về**: địa chỉ callback dựng từ origin hiện tại của trình duyệt. Khi chạy local nên dùng một host duy nhất (ví dụ `localhost`) từ lúc bắt đầu đăng nhập tới lúc quay về, để cookie xác minh đăng nhập khớp.
- **Chỉ đăng xuất thiết bị hiện tại**: đăng xuất không thu hồi phiên ở thiết bị khác.
- **Đổi vai trò admin có hiệu lực chậm**: `app_metadata.role` nằm trong phiên của người dùng; đổi giá trị ở Supabase chỉ phản ánh sau khi phiên được làm mới hoặc đăng nhập lại. Độ trễ này đã được chấp nhận (không thu hồi quyền tức thì).
- **Điều kiện theo thời gian duy nhất là `EVENT_START_AT`**: trước mốc áp lớp 0 (khóa), từ mốc không áp. Mốc do máy chủ đọc, không do người dùng gửi. Không có điều kiện theo địa chỉ IP, feature flag hay môi trường (production/dev) nào khác làm đổi quyền truy cập, và không có danh sách trắng cho người dùng nội bộ vào sớm. Chi tiết từng cổng kiểm nằm ở [permissions-matrix.md](../generated/permissions-matrix.md).

## Open Gaps

- Đồng hồ đếm ngược có thể hiện 00 00 00 tới khoảng một phút trước mốc thật (làm tròn xuống theo phút); khóa chỉ mở ở mốc thật theo đồng hồ máy chủ.
- Tài nguyên có phần mở rộng ngoài danh sách matcher (png, jpg, jpeg, gif, webp, svg, favicon, `_next`) cũng bị khóa trước mốc; hiện app không phục vụ loại nào như vậy.
- Không còn điểm mở nào khác. Layout `(main)` kiểm lại phiên cho `/` và mọi trang giữ chỗ; `/admin` được kiểm vai trò ở proxy và kiểm lại phía máy chủ. Khi trang giữ chỗ có dữ liệu thật, mỗi API của chúng phải tự kiểm quyền.
