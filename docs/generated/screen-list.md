# Screen List

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08
**Analysis Scope**: Next.js 16 App Router, nguồn màn hình theo route-view: `app/login/page.tsx`, `app/todo/page.tsx` và `app/(main)/page.tsx` (liệt kê từ route-list.md, đã đối chiếu mã nguồn)

**Code Format**: All codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm, SCR002_Dashboard) | `SCR###/REG###` for region-scoped references within a composite screen

**Note**: Feature mapping is managed in FeatureList.md only. UserStory mapping is done in UserStories.md (not in this document).

**Region Guidance**: Declare a Region only when it has ≥1 independence signal: distinct API endpoint (read or write), independent loading state, independent scroll container, independent auth / permission gate, distinct business workflow, distinct mutation surface / API cluster (distinct write endpoints or POST/PUT/DELETE namespace — even if the initial GET payload is shared), or distinct validation / action path. Shared initial payload does NOT disqualify a REG — if regions diverge on mutations, validation, or business workflow, they remain separate. Visual separation alone is NOT sufficient (trap 1).

**Region Cross-ref**: Region codes are per-screen; REG001 under SCR001 is distinct from REG001 under SCR002.

**REG Numbering**: Assign REG001, REG002, ... in top-to-bottom visual order as rendered at the screen's default viewport (desktop default if responsive). Ties broken by left-to-right reading order. Researcher documents source file:line for each REG to allow reviewer verification.

**Region Deprecation**: Regions table MAY include a `status` column with values `active` | `deprecated`. Deprecated regions keep their REG### number reserved (no renumbering); downstream refs remain valid; reviewer emits WARNING (not critical) until spec-wide cleanup.

<!-- ANTI-COMPRESSION RULE: One SCR per distinct view/page file. Do NOT collapse a namespace or
     wildcard route (e.g. /admin/system/*) into a single composite SCR. ≥2 view files under one
     namespace/route prefix → emit one SCR per file (apply H6). A wildcard route as a single SCR
     is FORBIDDEN — expand to concrete child routes from RouteList first.
     See: composite-screen-detection.md § Composite Hard Guard -->

## Screen Index

| Code | Name | Type | Components | Data Displayed |
|------|------|------|------------|----------------|
| SCR001_Login | Login | atomic | 12 | 3 |
| SCR002_Todo | Todo | atomic | 7 | 2 |
| SCR003_Homepage | Homepage | atomic | 15 | 4 |

---

## SCR001_Login: Login

**Type**: atomic

### Description

Màn đăng nhập SAA 2025 (thiết kế MoMorph Login `GzbNeVGJHz`), nguồn `app/login/page.tsx:10`. Khách bấm "LOGIN With Google" để chuyển sang Google trong cùng tab (Supabase `signInWithOAuth`, PKCE). Chuỗi chữ lấy từ từ điển vi/en theo cookie `NEXT_LOCALE` (mặc định `vi`). Khi callback thất bại, URL có `?error=...` và dưới nút hiện một dòng lỗi cố định; nội dung của tham số `error` không bao giờ được hiển thị (`app/login/page.tsx:22-24`). Trạng thái nút: `idle`, `initiating` (nút khóa, hiện spinner), `error` (`app/login/google-login-container.tsx:8`). Người đã đăng nhập mà vào `/login` bị proxy chuyển sang `/todo`, nên màn này không bao giờ render cho họ.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| LoginScreen | container | Khung toàn trang nền `#00101A`, `overflow-x-clip`, nạp font Montserrat; ghép nền, header, phần giới thiệu và footer (`app/login/_components/login-screen.tsx:21`, mm:662:14387) |
| KeyVisualBackground | image | Ảnh nền `key-visual.webp` cùng hai lớp gradient phủ (ngang và dọc), `aria-hidden`, `data-testid="login-hero"` (`login-screen.tsx:23-32`, mm:662:14388) |
| LoginHeader | header | Thanh đầu trang `fixed`, cao 80px, nền mờ, logo bên trái, bộ chọn ngôn ngữ bên phải (`login-header.tsx:12`, mm:662:14391) |
| HeaderLogo | image | Logo `logo.png` 52x48, không tương tác, `alt` lấy từ `login.logoAlt` (`login-header.tsx:18`, mm:I662:14391;178:1033;178:1030) |
| LanguageSelectorTrigger | button | Nút mở menu ngôn ngữ: cờ, mã VN/EN, mũi tên; `aria-expanded`, `aria-haspopup`, `data-testid="language-selector-trigger"` (`app/login/_components/language-selector.tsx:56-78`, mm:I662:14391;186:1696;186:1821) |
| LanguageMenu | menu | Danh sách hai lựa chọn VN và EN (cờ + nhãn), đóng khi bấm ra ngoài hoặc nhấn Escape, khóa nút khi `pending` (`language-selector.tsx:79-102`) |
| HeroIntro | container | Vùng `main` giữa trang chứa tiêu đề hình, câu giới thiệu và khu vực đăng nhập (`login-hero-intro.tsx:14`, mm:662:14393) |
| HeroTitleImage | image | Ảnh chữ "ROOT FURTHER" `root-further.png` trong `h1`, chữ thật nằm ở `span.sr-only` lấy từ `login.title` (`login-hero-intro.tsx:18-29`, mm:2939:9548) |
| HeroIntroText | text | Hai dòng chữ `login.subtitle` và `login.tagline` (`login-hero-intro.tsx:33-36`, mm:662:14753) |
| LoginButton | button | Nút "LOGIN With Google" nền `#FFEA9E`, logo Google, đổ bóng khi rê chuột; `aria-busy` khi đang khởi tạo (`login-button.tsx:14-40`, mm:662:14426) |
| LoginSpinner | indicator | Vòng quay thay logo Google, `role="status"`, chữ ẩn `login.loading`, chỉ hiện khi `initiating` (`login-button.tsx:28-35`) |
| LoginErrorMessage | alert | Đoạn `<p role="alert">` màu `#FF8A8A` hiện `login.error` khi `status === 'error'` hoặc có `?error=` lúc `idle`; không có lỗi thì không render gì (`login-error-message.tsx:5-11`, `google-login-container.tsx:31`) |
| LoginFooter | footer | Chân trang `fixed`, viền trên, dòng bản quyền `login.footer`, không tương tác (`login-footer.tsx:8`, mm:662:14447) |

### Data Displayed

- Data Entity 1: Từ điển giao diện vi/en, các khóa `login.*` và `language.*` (`lib/i18n/dictionary-vi.ts:3-13`), chọn theo locale
- Data Entity 2: Locale hiện tại, đọc từ cookie `NEXT_LOCALE`, mặc định `vi` (`lib/i18n/get-locale.ts:5-7`)
- Data Entity 3: Cờ lỗi đăng nhập: chỉ xét tham số `?error=` có hay không (không rỗng), không lấy nội dung (`app/login/page.tsx:22-24`)

### Routes/URLs

- `/login`
- `/login?error=auth_failed` (do `GET /auth/callback` chuyển về khi đăng nhập thất bại)

### Related Screens

- SCR002_Todo: Todo (navigation: đăng nhập thành công qua `GET /auth/callback` rồi vào `/todo`; người đã đăng nhập vào `/login` cũng bị chuyển sang `/todo`)

---

## SCR002_Todo: Todo

**Type**: atomic

### Description

Trang tối thiểu được bảo vệ, nguồn `app/todo/page.tsx:11`. Hiện email của người dùng đã đăng nhập (đọc bằng `supabase.auth.getUser()`) và nút đăng xuất. Chưa có danh sách việc cần làm thật. Khách chưa đăng nhập bị proxy chuyển về `/login`; trang còn tự kiểm tra lại và `redirect('/login')` nếu `getUser()` không trả người dùng (`app/todo/page.tsx:28`). Nút đăng xuất là form POST thuần tới `/auth/logout`, bấm xong thì khóa nút để không gửi hai lần (`app/todo/logout-button.tsx:5-13`).

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| TodoPage | container | Phần tử `main` toàn trang nền `#00101A`, căn giữa nội dung (`app/todo/page.tsx:13`) |
| UserPanelFallback | placeholder | Khối `aria-hidden` giữ chỗ trong lúc `UserPanel` chờ dữ liệu theo request (`page.tsx:14`) |
| UserPanel | card | Thẻ `section` có viền chứa tiêu đề, email và form đăng xuất (`page.tsx:33`) |
| TodoTitle | heading | `h1` lấy từ `todo.title` (`page.tsx:34`) |
| UserEmailLine | text | Nhãn `todo.emailLabel` và email, `data-testid="todo-email"`; thiếu email thì hiện `todo.emailMissing` (`page.tsx:35-38`) |
| LogoutForm | form | `<form action="/auth/logout" method="post">`, gửi `POST /auth/logout` (ROUTE002), full navigation (`page.tsx:39`) |
| LogoutButton | button | Nút submit lấy nhãn từ `todo.logout`, khóa sau khi bấm (`app/todo/logout-button.tsx:10-18`) |

### Data Displayed

- Data Entity 1: Supabase Auth `User`, chỉ đọc trường `email` (tham chiếu ngoài, không phải thực thể của ứng dụng, xem data-model.md)
- Data Entity 2: Từ điển giao diện vi/en, các khóa `todo.*` (`lib/i18n/dictionary-vi.ts:14-17`), chọn theo cookie `NEXT_LOCALE`

### Routes/URLs

- `/todo`

### Related Screens

- SCR001_Login: Login (navigation: đăng xuất qua `POST /auth/logout` rồi về `/login`; khách chưa đăng nhập vào `/todo` cũng bị chuyển về `/login`)

---

## Notes

- **Không phải màn hình**: Các trang giữ chỗ `/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin` (`app/(main)/*/page.tsx`) chỉ có chữ "Coming soon" trong layout `(main)` nên chưa có SCR riêng (`/` là SCR003_Homepage). Route Handler `GET /auth/callback` (ROUTE001) và `POST /auth/logout` (ROUTE002) cũng không render giao diện nên không phải màn hình.
- **Mã SCR giữ nguyên** `SCR001_Login`, `SCR002_Todo` theo bản nháp đã có ở `docs/generated/screen-list.md`; mã đối chiếu khớp mã nguồn.
- **Lệch nhỏ so với bản nháp cũ**: `docs/generated/screen-list.md` ghi "language-menu-open" là một trạng thái; trong mã đó chỉ là state cục bộ `open` của bộ chọn (`language-selector.tsx:23`), không đổi URL.
- **Phân loại SCR001_Login: atomic (không khai báo vùng)**. Thứ tự áp dụng H6 → H4 → H5 → H2 → H3 → H1 → cổng 2-trên-3:
  - H6: không có router outlet (`app/login/` chỉ có một `page.tsx`, không có `layout.tsx` hay route con). Không xuất hiện.
  - H4: không có tab (`role="tab"`, `<Tabs>`...). Menu ngôn ngữ dùng `aria-haspopup="true"`, là menu thả xuống, không phải nội dung loại trừ nhau trên cùng URL. Không xuất hiện.
  - H5: không có bước/stepper. Không xuất hiện.
  - H2: `page.tsx` chỉ nhập `@/lib/i18n/*` và các thành phần cục bộ; không có nhập từ `features/*`, `modules/*`, `domains/*`. Không đạt.
  - H3: không có wrapper `<Card>`, `<Panel>`, `<Section>`, `<Aside>`, `role="region"`. Cấu trúc là `header`, `main`, `footer` (khung trang) cùng các `div`. Khung trang chỉ là bố cục, không phải vùng nội dung tự chứa. H3 = 0 `[H3_RAW_DIV]`, cổng chuyển sang chỉ dùng H1 và H2.
  - H1: tệp màn hình `app/login/page.tsx` chỉ nhắc F001 (`page.tsx:22`), chưa tới 3 tham chiếu tính năng. Không đạt.
  - Kết quả cổng: không có cặp nào trong (H1∧H2), (H1∧H3), (H2∧H3) đạt, cả H1 và H2 đều trượt, nên SCR001_Login là atomic; kèm cảnh báo raw-div theo `composite-screen-detection.md`.
- **Ứng viên vùng duy nhất đã xét và loại: bộ chọn ngôn ngữ (`REG001_LanguageSelector` dưới SCR001_Login, nếu có sẽ viết `SCR001/REG001_LanguageSelector`)**.
  - Có tín hiệu độc lập thật (Region Guidance chỉ yêu cầu ≥1): mặt ghi riêng là Server Action `setLocale` (`lib/i18n/set-locale-action.ts:16`, gắn ở `app/login/language-selector-container.tsx:18`); trạng thái chờ riêng `useTransition` làm hai lựa chọn bị khóa (`language-selector-container.tsx:11`, `language-selector.tsx:90`); luồng nghiệp vụ riêng (lưu ngôn ngữ ưa thích, thuộc F002) tách khỏi luồng xác thực (F001).
  - Vẫn quyết định không khai báo REG vì Region Guidance chỉ là điều kiện cần cho một vùng, còn việc đánh dấu màn hình composite do cổng 2-trên-3 quyết định (`composite-screen-detection.md § 2-of-3 Gate`) và cổng này trượt. Bộ chọn là một nút trên header, không có endpoint đọc riêng, không có cuộn riêng, không có cổng quyền riêng; `setLocale` là Server Action gửi về chính URL `/login` (không có route riêng trong ROUTE###). Khai báo REG chỉ vì một control nhỏ sẽ là over-split (trap 1 và trap 4).
  - Tín hiệu độc lập của bộ chọn vẫn được ghi lại ở hàng LanguageSelectorTrigger/LanguageMenu trong Components, và F002 (Localization) sở hữu nó như một thành phần của SCR001_Login. Nếu về sau thêm vùng độc lập thứ hai, xem lại phân loại.
- **Phân loại SCR002_Todo: atomic**. H6, H4, H5 không xuất hiện; H2 = 0 (nhập `@/lib/i18n/*`, `@/lib/supabase/server`, `./logout-button`); H3 = 0 (một `main` và một `section`); H1 = 0 (tệp `page.tsx` không nhắc mã tính năng nào). Không cặp nào đạt, nên atomic. `UserPanel` bọc `Suspense` chỉ vì `cacheComponents: true` buộc đọc cookie theo request (`app/todo/page.tsx:9-10`), không phải vùng tải độc lập thật (một lần `getUser()` cho cả trang).
- **Không có `[SIGNAL_INFERRED]`**: mọi kết luận dùng trực tiếp bảng tín hiệu React/JS-TS.
- **Điểm kiểm cần lưu ý ở bước sau**: mỗi màn hình cần ≥1 US### và ≥1 F### tham chiếu; theo `docs/generated/feature-list.md`, F001 tham chiếu SCR001 và SCR002, còn F002 hiện ghi "chưa cấp REG###" và không có tham chiếu màn hình trực tiếp.

---

## Summary

- **Total Screens**: 3

---

## Cross-Reference Validation

- [x] All SCR### codes are unique
- [x] All SCR### codes are referenced in ScreenFlow.md
- [x] All related screen references are valid
- [x] All route URLs are properly formatted
- [x] All SCR### codes are referenced in FeatureList.md
- [x] No orphaned screen references
## SCR003_Homepage: Homepage

**Feature:** F003 — Homepage
**Route:** /
**Description:** Trang chủ SAA 2025 (thiết kế MoMorph `i87tDx10uM`) cho người đã đăng nhập: header cố định (điều hướng, thông báo, ngôn ngữ, tài khoản), hero ROOT FURTHER với đếm ngược tới `EVENT_START_AT`, thông tin sự kiện, lưới 6 hạng mục giải thưởng, khối Sun* Kudos, nút widget và footer; khách bị chuyển về `/login`. Nguồn `app/(main)/page.tsx` cùng layout `app/(main)/layout.tsx` (header, footer, kiểm lại phiên); `/` do layout `(main)` kiểm lại phiên sau proxy. Đặc tả đầy đủ ở `docs/screens/SCR003_Homepage/spec.md`.
**States:** loading, empty, error, saving, success, ended
