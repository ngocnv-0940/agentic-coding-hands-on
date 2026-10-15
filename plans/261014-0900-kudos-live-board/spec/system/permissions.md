---
status: draft
authored_by: takumi
created: 2026-10-14
lang: vi
---

# Permissions

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-14
**Analysis Scope**: Thêm màn Sun* Kudos - Live board (`/sun-kudos`, `/sun-kudos/<id>`) và kho dữ liệu Postgres đầu tiên của repo: RLS cho các bảng Kudos, và hàm RPC `SECURITY DEFINER` `toggle_kudo_like` là đường ghi duy nhất cho tim. Cơ sở là bản hiện hành của tài liệu này, `proxy.ts`, `lib/supabase/proxy.ts`, `app/(main)/layout.tsx` và `plans/261014-0900-kudos-live-board/clarifications.md`. Tên bảng, tên cột, tên policy: finalised in plan.

> **Curated, plain-language view.** This document is for PM, BA, and client audiences who
> need to understand access without reading raw codes. The raw PERM### matrix lives at
> [permissions-matrix.md](../generated/permissions-matrix.md). Derive this prose FROM that matrix.
> No PERM### codes and no matrix tables belong here.
>
> Mô tả hành vi đã đối chiếu với mã (`proxy.ts`, `lib/supabase/proxy.ts`, `app/(main)/layout.tsx`, `lib/auth/`). Phần RLS và RPC là thiết kế dự kiến (draft), sẽ đối chiếu lại với migration khi tính năng hoàn tất. Lý do thiết kế nằm ở ADR, không nằm ở đây.

## Authorization System Type

**System Type**: `other` — vẫn chỉ phân biệt đã đăng nhập hay chưa. Chưa có RBAC đầy đủ: cờ `admin` (xem dưới) chỉ quyết định hai việc, *hiện hay ẩn mục menu Admin Dashboard* và *cho hay chặn truy cập `/admin` ở phía máy chủ*. Từ Kudos live board có thêm **luật theo bản ghi ở tầng cơ sở dữ liệu** (RLS và RPC), nhưng chúng vẫn chỉ dựa trên "đã đăng nhập" và "người dùng hiện tại là ai", chưa có vai trò mới.

**Identified Roles**:
- `anonymous` — chưa có phiên Supabase hợp lệ (chưa đăng nhập, phiên hết hạn, hoặc không xác minh được).
- `authenticated` — có phiên hợp lệ do đăng nhập bằng Google. Mọi tài khoản Google đều được, không giới hạn theo tên miền.
- `admin` (cờ phụ, không phải vai trò độc lập) — một `authenticated` có `user.app_metadata.role === 'admin'`. Làm hiện mục "Admin Dashboard" trong menu tài khoản và là điều kiện để vào `/admin`. Giá trị này nằm ở `app_metadata`, chỉ phía máy chủ/dashboard Supabase ghi được; người dùng không tự sửa được (khác với `user_metadata`).
- **Người dùng hiện tại của Kudos** (không phải vai trò mới) — hàng `sunners` có `user_id = auth.uid()`. Dùng để biết ai là người gửi/nhận, số liệu sidebar là của ai, và ai đang bấm tim.

## Curated View

- **Trước ngày ra mắt (trước `SITE_LAUNCH_AT`)**: ai cũng như nhau, khách hay đã đăng nhập, admin hay không. Mở bất kỳ đường dẫn nào (kể cả đường dẫn không tồn tại) đều bị chuyển tới `/prelaunch`, trừ `/login`, `/auth/*` và tài nguyên tĩnh. Trang `/prelaunch` công khai, chỉ có đồng hồ đếm ngược. Các mô tả bên dưới về trang chủ, trang giữ chỗ, Kudos và `/admin` chỉ có hiệu lực **từ mốc trở đi**, hoặc khi `SITE_LAUNCH_AT` thiếu hay sai (khi đó không khóa).
- **anonymous** xem được trang đăng nhập `/login`, đổi ngôn ngữ VN/EN và bấm "LOGIN With Google" (cả trước mốc). Từ mốc, mở `/` hay bất kỳ trang được bảo vệ nào (liệt kê ở Access Boundaries, gồm `/sun-kudos` và `/sun-kudos/<id>`) đều bị chuyển về `/login`. Bấm đăng xuất không có tác dụng, vì chưa có phiên. Khách không đọc được dữ liệu Kudos ở tầng cơ sở dữ liệu (RLS chỉ mở cho người đã đăng nhập).
- **authenticated** vào được trang chủ `/`, `/todo`, `/awards-information`, **màn Kudos live board `/sun-kudos` và trang chi tiết `/sun-kudos/<id>`**, cùng các trang giữ chỗ (`/standards`, `/profile`). Trên màn Kudos, người dùng đọc được toàn bộ Kudos, hashtag, phòng ban, bảng Spotlight và danh sách hộp quà; bấm tim vào Kudo của người khác (một lần mỗi Kudo, bấm lại để bỏ thích). Mở thẳng `/admin` mà không phải admin thì bị chuyển về `/`. Đăng nhập xong thì về `/` (trước mốc, `/` lại chuyển tiếp tới `/prelaunch`). Mở `/login` thì bị chuyển sang `/`. Đăng xuất từ menu tài khoản trên trang chủ.
- **admin** thấy y như `authenticated`, thêm mục "Admin Dashboard" trong menu tài khoản, dẫn tới `/admin`, và là người duy nhất vào được trang đó (hiện chỉ là trang giữ chỗ, chưa có dữ liệu). Admin không có đặc quyền nào thêm trong Kudos.
- **Người gửi Kudo** không được thích Kudo của chính mình; thao tác này bị từ chối ở cơ sở dữ liệu, giao diện không phải là chốt chặn.
- **Người dùng không có hàng `sunners`** (không nằm trong dữ liệu seed): xem được màn Kudos, số liệu sidebar hiện 0, không thích được (RPC từ chối), trừ khi plan chọn cho RPC tự tạo hàng khi thích lần đầu (chọn phương án nhỏ hơn, chốt trong plan).
- Mọi người, kể cả khách, xem được `/prelaunch` trước mốc. Từ mốc, mở `/prelaunch` bị chuyển về `/`.
- Mọi người, kể cả khách, tải được ảnh và tài nguyên tĩnh (ảnh trang đăng nhập, favicon, tệp của Next.js). Các tài nguyên này không kiểm tra đăng nhập.
- Trang `/` giờ là trang chủ thật (không còn chỉ chuyển hướng). Khách không thấy nội dung của nó.
- Ngoài mục Admin Dashboard và luật tim, hai nhóm người dùng nhìn thấy cùng một ứng dụng, chỉ khác trang nào được phép vào.

## Access Boundaries

Ranh giới chính vẫn là **đã đăng nhập hay chưa**, và danh tính được xác minh với máy chủ Supabase Auth ở mỗi yêu cầu (không tin cookie phiên đứng một mình). Cổng kiểm được đặt ở nhiều lớp:

- **Lớp 0, khóa trước ngày ra mắt (trong proxy, cùng `lib/supabase/proxy.ts`)**: chạy sau bước làm mới phiên và trước các guard của lớp 1, không phụ thuộc người dùng là ai. Quyết định dựa trên đồng hồ máy chủ và `SITE_LAUNCH_AT` (biến chỉ phía máy chủ), nên đổi giờ trên máy người dùng không mở được khóa.
  - **Trước mốc** (mốc hợp lệ và giờ hiện tại sớm hơn mốc): mọi đường dẫn, trừ `/login`, `/auth/*`, `/prelaunch` và tài nguyên tĩnh nằm ngoài matcher của proxy, bị chuyển 307 tới `/prelaunch`, kể cả đường dẫn không tồn tại và đường dẫn con của trang được bảo vệ. Redirect mang theo cookie phiên vừa làm mới. `/login` vẫn qua lớp 0 và chịu guard cũ của nó (người đã đăng nhập vào `/login` về `/`, rồi `/` lại tới `/prelaunch`). `/prelaunch` công khai, không đọc phiên.
  - **Từ mốc, hoặc `SITE_LAUNCH_AT` thiếu hay sai**: không khóa. Chỉ riêng `/prelaunch` bị chuyển 307 về `/`; mọi đường dẫn khác đi tiếp vào lớp 1 như trước. Đúng lúc bằng mốc cũng tính là đã tới mốc. Mốc sai không bao giờ khóa cả site (từ chối khi nghi ngờ áp dụng cho quyền truy cập vào nội dung, còn ở đây một cấu hình hỏng không được chặn mọi người).
  - **Máy chủ Auth không trả lời**: khóa vẫn áp dụng như thường, vì quyết định không dùng phiên.
  - **Trang `/prelaunch` tự chuyển về `/` khi tới mốc** theo thời gian còn lại do máy chủ gửi; khách sau đó được lớp 1 đưa sang `/login`.
- **Lớp 1, proxy (`proxy.ts`)**: chạy trước mọi trang (từ mốc trở đi, hoặc cho `/login` ở mọi thời điểm; trước mốc, các đường dẫn bị khóa đã bị lớp 0 chặn). Danh sách đường dẫn được bảo vệ gồm: `/`, `/todo`, `/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin` và đường dẫn con của chúng (nên `/sun-kudos/<id>` đã được bảo vệ sẵn, không cần sửa danh sách). Riêng `/` chỉ khớp đúng `/` (không được coi mọi đường dẫn là con của `/`, vì như vậy `/login` cũng thành được bảo vệ và gây vòng chuyển hướng). Khách vào các đường dẫn này bị chuyển về `/login`; người đã đăng nhập vào `/login` bị chuyển sang `/`. Khi chuyển hướng, proxy giữ lại cookie phiên vừa làm mới. Nếu máy chủ Auth không trả lời hoặc không xác minh được phiên, proxy xử lý như chưa đăng nhập (từ chối khi nghi ngờ, không mở cửa khi lỗi) — giữ nguyên, vẫn dùng `getUser()` chứ không dùng `getSession()`.
- **Lớp 2, kiểm lại phiên ở phía trang**: `/todo` tự hỏi lại Supabase (`getUser()`), không có người dùng thì chuyển về `/login`. Layout của nhóm route `(main)` (`app/(main)/layout.tsx`) làm tương tự bằng `getCurrentUser()` rồi `redirect('/login')`, nên `/`, `/sun-kudos`, `/sun-kudos/<id>` và mọi trang giữ chỗ (`/awards-information`, `/standards`, `/profile`, `/admin`) đều được kiểm lại phiên ở đây. Lớp này bắt trường hợp phiên mất hiệu lực sau khi đã qua proxy; proxy vẫn là cổng chính (trả 307 thật), còn `redirect()` trong layout chạy khi nội dung đang stream nên chỉ là chuyển hướng phía client, chấp nhận được cho tình huống hiếm này. `getCurrentUser()` dùng `getUser()` và coi mọi lỗi là chưa đăng nhập. Riêng `/admin`: đã đăng nhập mà `app_metadata.role` khác `admin` thì bị proxy chuyển về `/`.
- **Lớp 3, RLS trong Postgres (mới)**: mọi bảng của Kudos bật Row Level Security. Dự kiến: vai trò `authenticated` được `SELECT` các bảng mà màn Kudos đọc (`departments`, `sunners`, `hashtags`, `kudos`, `kudo_hashtags`, `kudo_images`, `kudo_likes`, `special_days`, `secret_boxes`; tên chính thức finalised in plan); `anonymous` không có policy nào nên không đọc được gì. App đọc bằng phiên của người dùng chứ không dùng service role, nên RLS là chốt chặn thật ngay cả khi ai đó gọi thẳng PostgREST bằng token của mình. Client **không có quyền INSERT/UPDATE/DELETE trực tiếp** lên `kudo_likes` (và không có policy ghi nào cho các bảng Kudos khác ở phạm vi tính năng này; dữ liệu đến từ seed và migration). Cổng đọc hiện mở cho mọi `authenticated`, không lọc theo người sở hữu, vì Kudos là nội dung chung của công ty.
- **Lớp 4, RPC `toggle_kudo_like` (mới, `SECURITY DEFINER`)**: đường ghi duy nhất cho tim. Hàm chạy với quyền của chủ hàm (vượt RLS để ghi `kudo_likes`) nên tự kiểm mọi điều kiện, và danh tính lấy từ `auth.uid()` chứ không nhận từ tham số:
  - Chỉ `authenticated` gọi được; `anonymous` bị thu quyền `EXECUTE`.
  - Người gọi phải ứng với một hàng `sunners` có `user_id = auth.uid()`; không có thì RPC báo lỗi (hoặc tạo hàng, xem Curated View).
  - **Một tim mỗi người mỗi Kudo**: ràng buộc duy nhất (Kudo, Sunner); gọi lần hai là bỏ thích.
  - **Người gửi không được thích Kudo của chính mình**: RPC báo lỗi.
  - **Ngày đặc biệt**: nếu hôm nay (theo `special_days`) là ngày đặc biệt thì lượt thích tặng 2 tim cho người gửi, ngược lại 1 tim; số tim được lưu trên hàng thích (`hearts_awarded` 1 hoặc 2).
  - **Bỏ thích** thu hồi đúng số tim đã lưu trên hàng đó, không tính lại theo ngày hiện tại.
  - Hàm đặt `search_path` cố định để tránh bị lợi dụng; mọi tên đối tượng trong hàm viết đầy đủ schema.
  - Số tim của một Sunner = tổng `hearts_awarded` trên các lượt thích của Kudo họ gửi, không có chỗ nào khác ghi số này.
- **Các đường dẫn `/auth/`** (đăng nhập qua Google quay về, và đăng xuất): proxy vẫn bỏ qua hoàn toàn để việc đổi mã đăng nhập không bị ghi đè cookie. Vì vậy từng handler tự bảo vệ:
  - **Quay về từ Google** (`GET /auth/callback`): không cần phiên có sẵn. Chỉ tạo phiên khi không có tham số lỗi, có mã đăng nhập và mã không dài quá 2048 ký tự. Thiếu hoặc sai điều kiện nào, hoặc đổi mã thất bại, người dùng về `/login?error=auth_failed`. Nội dung lỗi của Google không bao giờ được chuyển tiếp hay hiển thị.
  - **Đích chuyển hướng cố định**: sau callback chỉ có hai đích là `/` (thành công) và `/login?error=auth_failed` (thất bại). Tham số `next` vẫn không được đọc, và đích là đường dẫn tương đối, nên không thể lợi dụng để đưa người dùng sang trang bên ngoài. Hệ quả: người bị chuyển về `/login` từ một trang sâu (ví dụ `/sun-kudos/<id>`) đăng nhập xong vẫn về `/`, không quay lại trang đang mở dở.
  - **Đăng xuất** (`POST /auth/logout`, không đổi): Route Handler chỉ nhận POST. Gõ địa chỉ này trên trình duyệt (GET) nhận lỗi 405, không đăng xuất. Handler kết thúc phiên trên thiết bị hiện tại và luôn đưa người dùng về `/login`. Nếu việc đăng xuất ở phía Supabase thất bại, cookie phiên vẫn bị xóa. Handler không từ chối ai: khách gọi cũng chỉ nhận lại chuyển hướng về `/login`. Nút "Sign out" trong menu tài khoản của trang chủ gửi form POST tới đây.
- **Admin Dashboard: ẩn mục và chặn truy cập**: ẩn liên kết trong menu chỉ là giao diện, không ngăn ai gõ thẳng `/admin`. Vì vậy `/admin` còn được chặn ở phía máy chủ, ngay trong proxy (`isAdminUser`, kiểm `app_metadata.role === 'admin'`, trả 307 thật): người đã đăng nhập nhưng không phải admin bị chuyển về `/` (khách thì bị chuyển về `/login`). Trang `/admin` còn kiểm lại vai trò ở phía máy chủ. Khi `/admin` có nội dung thật, mọi API của nó cũng phải kiểm tra vai trò admin ở phía máy chủ.
- **Ngôn ngữ không phải quyền**: lựa chọn VN/EN (cookie `NEXT_LOCALE`) chỉ đổi chữ hiển thị. Không chức năng, trang hay dữ liệu nào bật hoặc tắt theo ngôn ngữ. Giá trị ngôn ngữ lạ bị bỏ qua. Ai cũng đổi được, kể cả khách.

## Special Conditions

- **Phiên và cookie**: cookie phiên do thư viện Supabase quản lý (dạng `sb-<ref>-auth-token`, có thể chia nhiều mảnh), ứng dụng không tự đọc hay ghi tay. Chỉ proxy và Route Handler mới ghi được cookie; trang chỉ đọc, nên việc làm mới phiên nằm ở proxy.
- **Địa chỉ quay về**: địa chỉ callback dựng từ origin hiện tại của trình duyệt. Khi chạy local nên dùng một host duy nhất (ví dụ `localhost`) từ lúc bắt đầu đăng nhập tới lúc quay về, để cookie xác minh đăng nhập khớp.
- **Chỉ đăng xuất thiết bị hiện tại**: đăng xuất không thu hồi phiên ở thiết bị khác.
- **Đổi vai trò admin có hiệu lực chậm**: `app_metadata.role` nằm trong phiên của người dùng; đổi giá trị ở Supabase chỉ phản ánh sau khi phiên được làm mới hoặc đăng nhập lại. Độ trễ này đã được chấp nhận (không thu hồi quyền tức thì).
- **Điều kiện theo thời gian**: `SITE_LAUNCH_AT` (trước mốc áp lớp 0, từ mốc không áp; mốc do máy chủ đọc, không do người dùng gửi) và, riêng cho Kudos, **bảng `special_days`** quyết định một lượt thích tặng 1 hay 2 tim (ngày tính theo múi giờ `Asia/Ho_Chi_Minh`, hay UTC: finalised in plan). Không có điều kiện theo địa chỉ IP, feature flag hay môi trường (production/dev) nào khác làm đổi quyền truy cập, và không có danh sách trắng cho người dùng nội bộ vào sớm. Chi tiết từng cổng kiểm nằm ở [permissions-matrix.md](../generated/permissions-matrix.md).
- **Mock E2E không phải chốt chặn thật**: máy chủ Supabase mock của Playwright mô phỏng cùng luật tim để chạy không cần Docker, nhưng bản SQL (RLS + RPC) mới là chuẩn; luật chỉ được coi là kiểm xong khi chạy được với Postgres thật (`@smoke` hoặc `supabase db reset`).

## Open Gaps

- Đồng hồ đếm ngược có thể hiện 00 00 00 tới khoảng một phút trước mốc thật (làm tròn xuống theo phút); khóa chỉ mở ở mốc thật theo đồng hồ máy chủ.
- Tài nguyên có phần mở rộng ngoài danh sách matcher (png, jpg, jpeg, gif, webp, svg, favicon, `_next`) cũng bị khóa trước mốc; hiện app không phục vụ loại nào như vậy.
- Mọi `authenticated` đọc được toàn bộ bảng Kudos, gồm `secret_boxes` của người khác (cần cho danh sách "10 SUNNER NHẬN QUÀ MỚI NHẤT"); chưa có RLS theo từng người. Nếu sau này `secret_boxes` chứa dữ liệu riêng, cần siết lại policy.
- Người dùng đăng nhập nhưng chưa có hàng `sunners`: cách xử lý (RPC từ chối hay tự tạo hàng) chưa chốt, chốt trong plan.
- Chưa có cách ghi Kudo (dialog "Viết Kudo") và mở Secret Box: thuộc màn khác, chưa có policy hay RPC ghi cho các việc đó.
- Layout `(main)` kiểm lại phiên cho `/`, `/sun-kudos` và mọi trang giữ chỗ; `/admin` được kiểm vai trò ở proxy và kiểm lại phía máy chủ. Khi trang giữ chỗ khác có dữ liệu thật, mỗi API của chúng phải tự kiểm quyền.
