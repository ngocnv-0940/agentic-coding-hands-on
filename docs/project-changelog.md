# Nhật ký thay đổi

Mỗi mục ghi một thay đổi đáng kể, mới nhất ở trên.

## 2026-10-16 — Sửa lỗi: Highlight Kudos chỉ hiện 2 thẻ lúc mở trang (F006)

**Sửa** (mức thấp: lệch thiết kế, không mất chức năng)

- Nguyên nhân: carousel mở ở thẻ đầu (`useState(0)` trong `app/(main)/sun-kudos/_behavior/use-highlight-carousel.ts`), nên bên trái thẻ giữa trống, chỉ thấy 2 thẻ. Figma mở ở "2/5", mỗi bên một thẻ mờ.
- Cách sửa: từ 3 thẻ trở lên carousel mở ở thẻ thứ hai, dưới 3 thẻ vẫn mở ở thẻ đầu. Đổi bộ lọc thì carousel về lại thẻ mở đầu này ("2/N").
- Test hồi quy: `e2e/kudos-highlight-and-filters.spec.ts`, ca "FR-201 / DEC-002" (FR-202) kiểm thẻ thứ hai đang active và thẻ 1, 3 mờ nằm trong khung nhìn; hỏng trên code cũ, đạt sau khi sửa. Các ca bấm vào thẻ top 1 nay lùi về "1/5" trước.

## 2026-10-16 — Sửa lỗi: Kudo có nhắc tên (@) bị báo "Nội dung chưa hợp lệ" (F007)

**Sửa** (mức cao: mọi Kudo có mention đều không gửi được)

- Nguyên nhân: `attrs` của node ProseMirror (ví dụ `{id, label}` của mention) là object không có prototype, nên Server Action không gửi được dữ liệu mà gửi một tham chiếu tạm (`"$T"`). `create_kudo` nhận node mention không có `attrs.id` và trả `content_doc_invalid`.
- Cách sửa: `useKudoEditor().json()` (`app/(main)/sun-kudos/_behavior/use-kudo-editor.ts`) chuyển tài liệu qua JSON một lượt trước khi gửi, để mọi `attrs` thành object thường. Phía DB không đổi.
- Test hồi quy: `e2e/write-kudo-submit-and-anonymous.spec.ts`, ca "TC ID-13 / ID-47" gửi một Kudo có mention. Ca này hỏng trên code cũ và đạt sau khi sửa. Đã kiểm thêm trên Supabase local thật: kudo lưu đúng node mention.

## 2026-10-16 — Nút hành động nhanh (FAB) mở Viết Kudo, click nền đóng modal, cuộn mượt hơn (F007, F003 FR-211)

**Thêm**

- Bấm nút nổi góc phải dưới (có trên mọi trang chính, lắp ở `app/(main)/layout.tsx`) thì nút ẩn và nhóm hành động nhanh hiện ở cùng chỗ (MoMorph `Sv7DFwBw1h`): "Thể lệ", "Viết KUDOS" và nút × đỏ. ×, Esc và bấm ra ngoài đều đóng nhóm, tiêu điểm về nút nổi. Mã: `app/(main)/_wiring/fab-container.tsx`, `_components/fab-menu-view.tsx`, `_behavior/use-fab-menu.ts`.
- "Viết KUDOS" mở modal Viết Kudo thẳng khi đang ở `/sun-kudos` (qua cầu `app/(main)/_behavior/compose-bridge.ts`), ở trang khác thì chuyển tới `/sun-kudos?compose=1`; board mở modal đúng một lần rồi bỏ `compose` khỏi địa chỉ bằng `history.replaceState(null, …)` hoãn một nhịp, giữ các tham số khác, nên tải lại hay Back không mở lại. Người xem không có hồ sơ sunner thì không có modal. "Thể lệ" mở modal "Coming soon" có sẵn (chưa có trang thể lệ).
- Khóa cuộn trang phía sau khi modal mở: `app/(main)/sun-kudos/_behavior/use-body-scroll-lock.ts`.
- 3 spec E2E: `e2e/write-kudo-fab-quick-actions.spec.ts`, `e2e/write-kudo-backdrop-and-scroll.spec.ts`, `e2e/write-kudo-fab-compose-param-after-send.spec.ts`.

**Thay đổi**

- Click vào nền mờ ngoài thẻ nay đóng modal và bỏ dữ liệu như Hủy, thay quyết định cũ "click nền không làm gì" (F007 FR-224, D004 thay bằng D016). Bỏ qua khi đang gửi, và khi lần nhấn bắt đầu trong thẻ rồi nhả ngoài nền mờ.
- Cuộn của modal: tiêu đề và chân Hủy/Gửi cố định, chỉ vùng các trường cuộn (`overscroll-behavior-y: contain`) thay vì cuộn cả thẻ.
- Nút nổi ở trang chủ trước chỉ vẽ, nay có hành vi (F003 FR-211, D012). Docs cập nhật: `docs/features/F007_WriteKudo/` (FR-106, FR-107, FR-228, D016 đến D018), `docs/screens/SCR007_WriteKudo/spec.md`, `docs/features/F003_Homepage/`, `docs/screens/SCR003_Homepage/spec.md`.

**Lưu ý**

- Kiểm chứng (theo `plans/261015-1900-fab-and-modal-polish/evidence`): E2E trang chủ 48, board Kudos 60, Viết Kudo 93, spec nhắm đích 17 đều đạt; tsc và eslint thoát 0; kiểm tra độc lập 9.3 SEALED. Chưa commit.

## 2026-10-15 — Tài khoản Google tự có hồ sơ sunner ở lần đăng nhập đầu (F006 BR-012, F007)

**Thêm**

- Migration `supabase/migrations/20261015035950_auto_provision_sunner.sql`: trigger `kudos_private.provision_sunner()` trên `auth.users` (`SECURITY DEFINER`, chạy cùng giao dịch với việc tạo tài khoản) tạo một hàng `public.sunners` cho mỗi tài khoản Google, tên và avatar lấy từ hồ sơ Google theo ALG-007 (avatar chỉ nhận `https`, ≤2048 ký tự). Tài khoản đã có hàng thì giữ nguyên, không ghi đè.
- Chỉ tài khoản Google được tạo (hàm `is_google_account`); đăng ký email/mật khẩu không có hồ sơ, nên khoá anon một mình không dựng được sunner. Trigger chạy cả khi `raw_app_meta_data` đổi, vì GoTrue nối Google vào tài khoản cùng email bằng UPDATE chứ không INSERT.
- Tạo bù một lần cho tài khoản Google đã có trước migration; các hàng seed (`user_id` null) không bị động tới. Ba hàm mới đều bị thu `EXECUTE` của `anon` và `authenticated`.
- pgTAP `supabase/tests/database/auto-provision-sunner.test.sql`; `supabase/seed.sql` sửa ghi chú đầu file.

**Thay đổi**

- Đăng nhập Google là thả tim và viết Kudo được, không cần gán `user_id` thủ công nữa (chỉ cần gán khi muốn đóng vai một sunner trong seed). Không đổi mã ứng dụng.

**Lưu ý**

- Kiểm chứng: pgTAP 316/316, `db reset` và `db lint` sạch, E2E 252/252, tsc và lint đạt, kiểm tra độc lập 9.5 SEALED. Chưa chạy đăng nhập Google thật từ đầu đến cuối. Mọi tài khoản Google đều tìm được làm người nhận (người dùng đã chấp nhận). Chưa commit. Việc còn mở ở `plans/261015-1700-auto-provision-sunner/reports/delivery-tracker-261015-sunner-provisioning-status.md`.

## 2026-10-15 — Modal Viết Kudo trên /sun-kudos (F007_WriteKudo)

**Thêm**

- Nút compose trên `/sun-kudos` mở modal Viết Kudo (thay modal Coming soon); nút bị khoá khi tài khoản chưa có hàng `sunners`. Form: tìm người nhận (không phân biệt dấu, tối đa 10, trừ chính mình), tiêu đề 1-100 ký tự, nội dung dùng trình soạn thảo Tiptap 3.32.0 (tải lười; có `@` mention, liên kết http/https), 1-5 hashtag có sẵn, tối đa 5 ảnh jpeg/png/webp mỗi ảnh ≤5 MB, tuỳ chọn gửi ẩn danh kèm bí danh ≤50 ký tự. Nút Gửi vẫn bấm được khi thiếu dữ liệu và hiện toàn bộ lỗi. Mã ở `app/(main)/sun-kudos/` (`_components`, `_behavior`, `_wiring`), `lib/kudos/`, từ điển `lib/i18n/dictionary-write-kudo-{vi,en}.ts`.
- Migration `supabase/migrations/…035942..48_write_kudo_*.sql`: cột mới, bucket Storage `kudo-images`, RPC `create_kudo` (`SECURITY DEFINER`, một giao dịch, kiểm tra lại phía máy chủ) và `search_sunners`, quyền.
- Ảnh tải thẳng từ trình duyệt lên bucket `kudo-images` (tên đối tượng là uuid), `create_kudo` kiểm tra chủ sở hữu; lỗi thì dọn ảnh đã tải. `kudo_images.url` lưu `kudo-images/<tên>`, `lib/kudos/resolve-kudo-image-url.ts` dựng URL công khai.
- Che người gửi ẩn danh: thu `SELECT` cột `kudos.sender_id` và `sunners.user_id`, `kudo_cards`, `viewer_sunner_id`, `kudos_sidebar` chuyển sang `SECURITY DEFINER`; thẻ ẩn danh trả `sender: null` cùng `anonymousName`. Sau khi gửi, `router.refresh()` và feed đổi key theo id đầu để Kudo mới lên đầu.
- 5 spec E2E `e2e/write-kudo-*.spec.ts` (76 test); mock Supabase thêm route tìm kiếm, tạo và Storage.

**Thay đổi**

- `e2e/kudos-sidebar-and-modal.spec.ts` (TC 19) kiểm modal Viết Kudo thay vì Coming soon; `playwright.config.ts` chỉ tái dùng server khi `E2E_PROD`.

**Lưu ý**

- Kiểm chứng: E2E write-kudo 76/76 (dev và prod), toàn bộ 252, pgTAP 263, smoke trên stack thật đạt, kiểm tra độc lập 9.5 SEALED. Chưa commit. Bản tiếng Anh của chuỗi mới chờ người dùng xác nhận. Việc còn mở ở `plans/261015-0950-write-kudo-modal/reports/delivery-tracker-261015-write-kudo-status.md`.

## 2026-10-14 — Sun* Kudos Live board và schema Postgres đầu tiên (F006_KudosLiveBoard, SCR006)

**Thêm**

- `/sun-kudos` thay trang giữ chỗ: banner, Highlight Kudos (top 5 theo số tim, carousel), Spotlight board (pan/zoom bằng CSS transform, tìm tên không phân biệt dấu), ALL KUDOS cuộn vô hạn (10 mục mỗi trang, con trỏ `(created_at, id)`), bộ lọc hashtag và phòng ban lưu trong URL (`?hashtag=<slug>&department=<code>`, giá trị lạ bị bỏ), nút tim, Copy Link kèm toast, sidebar số liệu và 10 hộp quà mở gần nhất. Mã ở `app/(main)/sun-kudos/` (`_components`, `_behavior`, `_wiring`) và `lib/kudos/`; chuỗi UI ở `lib/i18n/dictionary-kudos-{vi,en}.ts`; ảnh ở `public/images/kudos/`.
- `/sun-kudos/[id]`: trang giữ chỗ chi tiết Kudo (dựng lại Coming soon).
- Schema Postgres đầu tiên của repo, ba migration trong `supabase/migrations/`: `…095439_kudos_live_board_tables.sql` (9 bảng, chỉ mục, RLS chỉ cho `authenticated` đọc, thu quyền ghi), `…095441_kudos_live_board_functions.sql` (5 RPC đọc `SECURITY INVOKER`, RPC `toggle_kudo_like` `SECURITY DEFINER`, hàm trợ giúp ở schema `kudos_private`), `…095442_kudos_live_board_grants.sql` (`execute` chỉ cho `authenticated`). Dữ liệu mẫu `supabase/seed.sql`.
- Luật tim ở Postgres: một tim mỗi người mỗi Kudo, người gửi không tự thích (`self_like`), người dùng không có hàng `sunners` bị từ chối (`sunner_not_found`, không tự tạo hàng), ngày đặc biệt (`special_days`, ngày `Asia/Ho_Chi_Minh`) tặng 2 tim, bỏ thích thu hồi đúng số tim đã lưu.
- Hai Server Action: `loadMoreKudos`, `toggleKudoLikeAction` (`lib/kudos/`).
- Quy trình cơ sở dữ liệu cục bộ: `supabase db reset` (migration + seed) và `supabase test db` (pgTAP ở `supabase/tests/database/`: `kudos-like-rules`, `kudos-rls-and-reads`, `kudos-seed-matches-e2e-fixture`).
- 6 spec E2E `e2e/kudos-*.spec.ts`; Supabase giả (`e2e/support/mock-supabase-server.ts`, `mock-kudos-*.ts`) phục vụ thêm 6 RPC với dữ liệu theo từng danh tính và hai endpoint điều khiển chỉ có ở mock.

**Thay đổi**

- `e2e/homepage-access-and-landing.spec.ts` không còn coi `/sun-kudos` là trang Coming soon; `/sun-kudos/x` vẫn được kiểm qua trang giữ chỗ `[id]`.
- Từ điển vi/en gộp thêm từ điển Kudos.
- `README.md`, `docs/system/*`, `docs/generated/*` cập nhật theo F006; quyết định ở `plans/261014-0900-kudos-live-board/clarifications.md`.

**Lưu ý**

- Mock E2E và SQL là hai bản cài đặt của cùng luật tim; bản SQL là chuẩn. Số sao hero trên stack thật có thể ít hơn trên mock vì suy ra từ Kudo trong seed.

## 2026-10-13 — Trang đếm ngược trước ngày ra mắt và khóa site (F005_CountdownPrelaunch, SCR005)

**Thêm**

- `/prelaunch` (`app/prelaunch/`, route cấp cao ngoài `(main)`, công khai): nền tối, tiêu đề và ba khối Days, Hours, Minutes đếm tới `SITE_LAUNCH_AT`, dùng chung bộ đếm (không dùng chung mốc) với trang chủ. Từ điển vi/en có thêm khoá `prelaunch.title`, `prelaunch.metaTitle`; ảnh nền `public/images/prelaunch/prelaunch-bg.png`.
- Khóa site trong `lib/supabase/proxy.ts` qua hàm thuần `decidePrelaunchAccess` (`lib/event/prelaunch-access.ts`): trước `SITE_LAUNCH_AT`, mọi đường dẫn ngoài `/login`, `/auth/*`, `/_next/*` và `/prelaunch` bị 307 về `/prelaunch`, với mọi vai trò. Từ mốc, `/prelaunch` bị 307 về `/`. Mốc thiếu hoặc sai nghĩa là đã mở (không khóa).
- Chuyển trang phía máy khách (`useNavigateHomeAtEventStart`): chờ `remainingMs` do máy chủ gửi (không so đồng hồ trình duyệt với mốc), kẹp tối thiểu 1 giây kể cả khi `remainingMs <= 0`; tab ẩn lúc qua mốc thì `reload` khi hiện lại.
- 5 spec E2E `e2e/prelaunch-*.spec.ts` và `e2e/support/prelaunch-locators-and-clock.ts`; nhóm `@prelaunch` chỉ chạy khi đặt `E2E_SITE_LAUNCH_AT` ở tương lai.
- Cập nhật 2026-10-14, tách mốc ra mắt khỏi mốc sự kiện: biến chỉ phía máy chủ `SITE_LAUNCH_AT` (ISO-8601 kèm offset hoặc `Z`, parse bằng `parseEventStart`, đọc bằng `readSiteLaunchFromEnv()` trong `lib/event/event-start-config.ts`) điều khiển khóa site (`lib/supabase/proxy.ts`) và đếm ngược cùng chuyển trang của `/prelaunch`; `EVENT_START_AT` chỉ còn điều khiển đếm ngược, ngày sự kiện và "Coming soon" của trang chủ. `SITE_LAUNCH_AT` thiếu hoặc sai thì không khóa và `/prelaunch` chuyển về `/`. E2E: `E2E_SITE_LAUNCH_AT` bật nhóm `@prelaunch` và `@launch-env-invalid`; `@event-env-invalid` chỉ còn cho trang chủ. Quyết định ở `plans/261013-1638-countdown-prelaunch-page/clarifications.md`, mục "Session 2026-10-14".

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
