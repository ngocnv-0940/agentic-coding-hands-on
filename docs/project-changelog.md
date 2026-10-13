# Nhật ký thay đổi

Mỗi mục ghi một thay đổi đáng kể, mới nhất ở trên.

## 2026-10-13 — Trang đếm ngược trước ngày ra mắt và khóa site (F005_CountdownPrelaunch, SCR005)

**Thêm**

- `/prelaunch` (`app/prelaunch/`, route cấp cao ngoài `(main)`, công khai): nền tối, tiêu đề và ba khối Days, Hours, Minutes đếm tới `EVENT_START_AT`, dùng chung bộ đếm với trang chủ. Từ điển vi/en có thêm khoá `prelaunch.title`, `prelaunch.metaTitle`; ảnh nền `public/images/prelaunch/prelaunch-bg.png`.
- Khóa site trong `lib/supabase/proxy.ts` qua hàm thuần `decidePrelaunchAccess` (`lib/event/prelaunch-access.ts`): trước `EVENT_START_AT`, mọi đường dẫn ngoài `/login`, `/auth/*`, `/_next/*` và `/prelaunch` bị 307 về `/prelaunch`, với mọi vai trò. Từ mốc, `/prelaunch` bị 307 về `/`. Mốc thiếu hoặc sai nghĩa là đã mở (không khóa).
- Chuyển trang phía máy khách (`useNavigateHomeAtEventStart`): chờ `remainingMs` do máy chủ gửi (không so đồng hồ trình duyệt với mốc), kẹp tối thiểu 1 giây kể cả khi `remainingMs <= 0`; tab ẩn lúc qua mốc thì `reload` khi hiện lại.
- 5 spec E2E `e2e/prelaunch-*.spec.ts` và `e2e/support/prelaunch-locators-and-clock.ts`; nhóm `@prelaunch` chỉ chạy khi đặt `E2E_EVENT_START_AT` ở tương lai.

**Thay đổi**

- `CountdownDisplay` (`app/(main)/_components/countdown-display.tsx`) có prop tuỳ chọn `size` (`default` | `prelaunch`); `prelaunch` chỉ thêm kích thước lớn từ 1024px, trang chủ không truyền nên giữ nguyên.
- `PERM010_PrelaunchSiteLock` (permissions-matrix), `GUARD-004` (screen-flow), hàng `/prelaunch` trong route-list.
- `README.md`: nêu khóa site, nhóm E2E `@prelaunch` và cấu trúc `app/prelaunch/`.

## 2026-10-13 — Trang Hệ thống giải (F004_AwardsInformation, SCR004)

**Thêm**

- `/awards-information` thay trang giữ chỗ "Coming soon": hero keyvisual, tiêu đề "Hệ thống giải thưởng SAA 2025", menu 6 hạng mục, 6 thẻ giải (ảnh 336x336, mô tả đầy đủ nguyên văn Figma, số lượng, giá trị; Signature 2025 có hai mức giá trị) và khối Sun* Kudos dẫn tới `/sun-kudos`. Thẻ giải có `id` bằng slug nên liên kết `/awards-information#<slug>` từ trang chủ hạ cánh đúng thẻ.
- Menu hạng mục: dọc, dính dưới header từ 1024px; dưới 1024px là hàng tab cuộn ngang ghim phía trên các thẻ. Thẻ xếp dọc dưới 768px; từ 768px ảnh so le trái/phải.
- Hành vi cuộn (`app/(main)/_behavior/`): scroll-spy theo vị trí cuộn; bấm mục thì cuộn mượt và ghi `#<slug>` bằng `history.replaceState` (không thêm mục lịch sử); hash hợp lệ lúc tải cuộn tức thì, hash sai bị bỏ qua. Khoá cuộn giữ scroll-spy lại tới khi thẻ đích tới nơi (nhả theo `scrollend` hoặc sau 150ms yên; hạn chót 1500ms) và nhả ngay khi người dùng cuộn tay; bấm kèm Ctrl/Meta/Shift/Alt không bị chặn.
- `lib/awards/award-details.ts` (khoá từ điển của mô tả, số lượng, giá trị), `lib/i18n/dictionary-awards-vi.ts` và `dictionary-awards-en.ts` gộp vào từ điển vi/en (en vẫn bắt buộc đủ khoá lúc biên dịch).
- 3 spec E2E `e2e/awards-information-*.spec.ts` và `e2e/support/awards-information-locators.ts`.

**Thay đổi**

- `KudosPromo` có prop tuỳ chọn `variant` (`default` | `wide`); trang chủ không truyền nên giữ nguyên. Props khối Kudos dựng bởi `buildKudosPromoProps` (`_wiring/build-kudos-promo-props.ts`), dùng chung với trang chủ.
- `/awards-information` vẫn được proxy bảo vệ như trước; không đổi xác thực hay routing.

## 2026-10-09 — Màn Login: cập nhật kích thước theo từng khổ màn hình (SCR001, chỉ giao diện)

**Thay đổi**

- `app/login/_components/*`: khung nội dung 1152px căn giữa, padding 12/24/32; ảnh ROOT FURTHER và khoảng cách hero theo breakpoint; không thu nhỏ chữ; nền phủ viewport dưới `lg`; nút vô hiệu mờ 50%. Khổ 1440 giữ đúng Figma.
- Bộ chọn ngôn ngữ (dùng chung với header trang chủ) theo Figma `hUyaaugye2`: panel padding 6px, nền `#00070C`, viền `#998C5F`, mục cao 56px, hover `#FFEA9E1A`, mũi tên xoay khi mở.
- Từ điển en: `login.tagline` "Login to explore!"; `login.footer` và `home.footer.copyright` "Copyright © 2025 Sun* All rights reserved".
- Không đổi props, xác thực hay routing.

## 2026-10-08 — Trang chủ SAA 2025 (F003_Homepage)

**Thêm**

- Trang chủ `/` trong nhóm route `app/(main)/`: header cố định (điều hướng từ 1024px, chuông thông báo trống, VN/EN, menu tài khoản có Sign out), hero ROOT FURTHER với đếm ngược, thông tin sự kiện, lưới 6 giải thưởng, khối Sun* Kudos, nút widget và footer. Layout `(main)` kiểm lại phiên.
- Trang giữ chỗ "Coming soon": `/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin`; dùng lại header và footer.
- Biến `EVENT_START_AT` (chỉ phía máy chủ) trong `.env.example`: ISO-8601 bắt buộc kèm offset hoặc `Z`; sai thì đếm ngược 00 và ngày hiện "—". Ngày hiển thị `dd/MM/yyyy` theo Asia/Ho_Chi_Minh.
- `lib/auth/get-current-user.ts`, `lib/auth/user-role.ts`: vai trò admin chỉ từ `app_metadata.role` (không tin `user_metadata`).
- Từ điển trang chủ tách thành `lib/i18n/dictionary-home-vi.ts` và `dictionary-home-en.ts`, gộp vào từ điển vi/en.
- 6 spec E2E trang chủ; Supabase giả có thêm hai danh tính admin; `playwright.config.ts` đặt `EVENT_START_AT` và 4 worker.

**Thay đổi**

- Đích sau đăng nhập đổi từ `/todo` sang `/` (`app/auth/callback/route.ts`); `/login` khi đã đăng nhập cũng về `/`. `/todo` vẫn được bảo vệ.
- `lib/supabase/proxy.ts`: `/` (khớp đúng) và các trang giữ chỗ (kể cả đường dẫn con) cần đăng nhập; người không phải admin vào `/admin*` bị chuyển về `/`.
- `app/page.tsx` (chỉ `redirect('/login')`) đã xoá; `/` do `app/(main)/page.tsx` phục vụ.
- Spec E2E của F001 và F002 cập nhật theo đích mới `/`.

**Còn mở**

- Trang giữ chỗ chưa có nội dung thật; widget chưa có hành động; bảng thông báo chưa có nguồn dữ liệu.

## 2026-10-08 — Đăng nhập Google qua Supabase và chọn ngôn ngữ vi/en

**Thêm**

- F001_Auth: đăng nhập Google (OAuth PKCE cùng tab) qua Supabase Auth; `GET /auth/callback` đổi mã lấy phiên; `proxy.ts` làm mới phiên và chặn `/todo` với khách, đưa người đã đăng nhập khỏi `/login`; trang `/todo` hiện email; đăng xuất bằng `POST /auth/logout` (Route Handler, 303 về `/login`, `GET` trả 405) qua form gốc trên `/todo`.
- F002_Localization: bộ chọn VN/EN, cookie `NEXT_LOCALE`, từ điển vi/en tự viết trong `lib/i18n`.
- E2E Playwright chạy trên Supabase giả (`e2e/`, `playwright.config.ts`).
- `README.md` viết lại thành hướng dẫn cài đặt cục bộ (bun, Supabase CLI, Docker hoặc Podman, Google OAuth).

**Sửa**

- `supabase/config.toml`: file đã commit trước đó là template Go của CLI chưa được render nên `supabase start` không dùng được. Đã thay bằng đầu ra của `supabase init` 2.120.0 cộng các chỉnh sửa của dự án (`site_url = http://localhost:3000`, `additional_redirect_urls`, bật `auth.external.google` với `client_id`/`secret` lấy từ `env(...)`).

**Thay đổi thiết kế đã chốt khi cài đặt**

- Đăng xuất là `POST /auth/logout`, không phải Server Action `logoutAction` (đã xoá `app/todo/logout-action.ts`): form gốc gây điều hướng cả trang nên không còn DOM `/todo` sau khi đăng xuất hoặc bấm Back.
- `/todo` gọi `await connection()` trước `getUser()` vì Cache Components không cho `Date.now()` lúc prerender.

**Rủi ro và việc còn mở** (chi tiết: `docs/features/F001_Auth/functional-spec.md` § 11)

- Build cần `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; CI phải đặt.
- Production qua HTTPS cần `secure: true` cho cookie phiên.
- Ba mục Low hoãn: `Location` tuyệt đối trong proxy, `setAll` ghi đè header cache, `POST /auth/logout` chưa kiểm tra `Origin`.
