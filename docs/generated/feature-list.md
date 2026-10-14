# Feature List

**Project**: agentic-coding-hands-on
**Generated**: 2026-10-08
**Analysis Scope**: Màn hình `SCR001_Login` (`app/login/**`) và `SCR002_Todo` (`app/todo/**`), hai Route Handler `ROUTE001` `GET /auth/callback` và `ROUTE002` `POST /auth/logout` (`app/auth/**`), lớp bảo vệ route (`proxy.ts`, `lib/supabase/proxy.ts`), bộ ngôn ngữ vi/en (`lib/i18n/**`). Mã nguồn là nguồn sự thật; mã F001 và F002 được giữ nguyên từ bản nháp đã có (`docs/generated/feature-list.md`).

**Code Format**: All codes MUST follow `F###_NameSlug` format (e.g., F001_Auth, F002_UserProfile)
**Screen Code Format**: All screen codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm)
**User Story Code Format**: All US codes MUST follow `US###_NameSlug` format (e.g., US001_Login)
**Background Logic Code Format**: All BL codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport)
**Permission Code Format**: All PERM codes MUST follow `PERM###_NameSlug` format (e.g., PERM001_ViewReports)

**Feature Types**:
- `ui` - Feature has UI screens (SCR###)
- `background` - Feature only has background logic (BL###, no SCR###)
- `mixed` - Feature has both UI screens and background logic

**Related Screens column format**: Accepts `SCR###`, `SCR###/REG###`, or mixed comma-separated (e.g., `SCR001, SCR002/REG003`). Tokenizer splits on `,` then on `/`. No intra-screen shorthand (`SCR###/REG001+REG002` invalid) — enumerate each ref explicitly.

**Partial-screen ownership note**: A feature with only a `SCR###/REG###` ref owns the region, NOT the parent SCR. The screen shell (`SCR###`) must be owned by a separate F### with a bare `SCR###` ref (typically a layout/dashboard feature).

**Cross-reference**: See ScreenList Regions subsection for region definitions and the `REG###_NameSlug` registry. Ứng dụng này không khai báo REG### nào (cả hai màn hình đều `atomic`), nên vỏ của `SCR001_Login` và `SCR002_Todo` đều do F001_Auth sở hữu bằng mã SCR### trần; F002_Localization chỉ tham chiếu `SCR001_Login` (nơi đặt bộ chọn ngôn ngữ) mà không sở hữu vỏ màn hình, nên không đếm trùng màn hình.

## Feature Hierarchy

**Note**: Features are sorted by priority from highest to lowest (P0 → P1 → P2 → P3). Priority levels:
- **P0**: Core functionality, blocking issues, or essential features
- **P1**: High priority, significant features
- **P2**: Medium priority, standard features
- **P3**: Low priority, nice-to-have features

| Code | Name | Type | Language | Workspace | Priority |
|------|------|------|----------|-----------|----------|
| F001_Auth | Auth | ui | TypeScript | Next.js app (root) | P0 |
| F002_Localization | Localization | ui | TypeScript | Next.js app (root) | P1 |
| F003_Homepage | Homepage | ui | TypeScript | Next.js app (root) | P0 |
| F004_AwardsInformation | Awards Information | ui | TypeScript | Next.js app (root) | P1 |
| F005_CountdownPrelaunch | Countdown Prelaunch | mixed | TypeScript | Next.js app (root) | P1 |

## Feature Details

### F001_Auth: Auth

**Type**: ui
**Description**: Kết quả nghiệp vụ duy nhất: chỉ người có phiên Google/Supabase hợp lệ mới vào được khu vực đã đăng nhập (`/todo`), và người dùng tự kết thúc được phiên đó. Luồng: Khách bấm "LOGIN With Google" → trình duyệt chuyển cùng tab sang Google (OAuth PKCE qua Supabase) → `GET /auth/callback` đổi `code` lấy phiên → vào `/todo` thấy email và nút đăng xuất; thất bại hoặc hủy thì về `/login?error=auth_failed` và hiện một dòng lỗi cố định dưới nút. Lớp bảo vệ route (`proxy.ts` cộng với tự kiểm lại trong `app/todo/page.tsx`) đẩy khách ra khỏi `/todo` về `/login` và đẩy người đã đăng nhập ra khỏi `/login` sang `/todo`. Đăng xuất là `POST /auth/logout` (Route Handler, không phải Server Action): kết thúc phiên cục bộ rồi về `/login`. Mọi tài khoản Google đều được phép. Sáu story US001 đến US006 cùng phục vụ vòng đời phiên và quyền vào trang này, nên gộp một feature (xem Feature Clustering Rule); khác với F002 vì F002 phục vụ nhu cầu đọc hiểu giao diện, không phụ thuộc trạng thái đăng nhập.

**Workspace**: Next.js app (root)
**Languages**: TypeScript
**Components**: 17 (10 thành phần của `SCR001_Login` ngoài bộ chọn ngôn ngữ, cộng 7 thành phần của `SCR002_Todo`)

**Related Screens**:
- SCR001_Login: Login
- SCR002_Todo: Todo

**Related User Stories**:
- US001_Login: Login With Google
- US002_LoginFailure: View Login Error
- US003_ViewTodo: View Todo
- US004_Logout: Logout
- US005_GuardTodo: Open Todo While Signed Out
- US006_SkipLogin: Open Login While Signed In

**Related APIs/Routes**:
- (GET) /auth/callback
- (POST) /auth/logout
- (GET) /login
- (GET) /todo
- (GET) /

**Related Data Models**:
- No data — ứng dụng không sở hữu thực thể nào; `User` của Supabase Auth là tham chiếu ngoài (chỉ đọc `email`), không phải model của ứng dụng (xem data-model.md).

**Related Background Logic**:
- No data — `behavior-logic.md` không có BL### nào; không có job, hook hay webhook.

**Related Permissions**:
- PERM001_TodoRouteGuard: Chặn khách vào /todo
- PERM002_LoginRedirectForSignedIn: Người đã đăng nhập vào /login bị chuyển sang /todo
- PERM003_AuthPathsProxyBypass: Proxy bỏ qua mọi đường dẫn /auth/
- PERM004_StaticAssetsProxyBypass: Proxy không chạy cho tệp tĩnh và tài nguyên Next
- PERM005_AuthErrorFailClosed: Auth server lỗi thì coi như chưa đăng nhập
- PERM006_TodoPageSessionRecheck: Trang /todo tự kiểm lại phiên (lớp thứ hai)
- PERM007_LogoutPostOnly: Đăng xuất chỉ nhận POST, luôn kết thúc phiên cục bộ
- PERM008_OAuthCallbackCodeValidation: Callback chỉ đổi phiên khi `code` hợp lệ
- PERM009_OAuthCallbackFixedRedirect: Callback chỉ chuyển tới hai đích cố định, không mở redirect

---

### F002_Localization: Localization

**Type**: ui
**Description**: Kết quả nghiệp vụ duy nhất: người dùng đọc giao diện bằng ngôn ngữ mình chọn (VN hoặc EN) và ứng dụng nhớ lựa chọn đó qua các lần ghé. Luồng: Khách mở menu ngôn ngữ trên header của `/login` → chọn VN hoặc EN → Server Action `setLocale` (`lib/i18n/set-locale-action.ts`, không có URL riêng nên không có ROUTE###) ghi cookie `NEXT_LOCALE` (`path=/`, `SameSite=Lax`, một năm) rồi làm mới trang → máy chủ đọc cookie và dựng lại toàn bộ chuỗi theo từ điển vi/en tự viết (mặc định `vi` khi chưa chọn hoặc cookie hỏng). Ngôn ngữ đã lưu cũng áp cho nhãn email và nút đăng xuất trên `/todo`. Hai story US007 và US008 là hai nửa của một kết quả (chọn rồi giữ), tách khỏi F001 vì độc lập với trạng thái đăng nhập và chạy trọn vẹn dù đăng nhập thế nào.

**Workspace**: Next.js app (root)
**Languages**: TypeScript
**Components**: 2 (`LanguageSelectorTrigger` và `LanguageMenu` của `SCR001_Login`)

**Related Screens**:
- SCR001_Login: Login — F002 chỉ THAM CHIẾU màn hình này (nơi đặt bộ chọn ngôn ngữ, qua US007_SelectLanguage; US008_KeepLanguage còn áp nhãn cho `SCR002_Todo`), không sở hữu vỏ màn hình; vỏ `SCR001_Login` và `SCR002_Todo` vẫn thuộc F001_Auth.

**Related User Stories**:
- US007_SelectLanguage: Select Language
- US008_KeepLanguage: Keep Language

**Related APIs/Routes**:
- No data — Server Action `setLocale` không có URL; ghi cookie `NEXT_LOCALE` và đọc lại qua `getLocale()` khi dựng `/login` và `/todo` (hai trang này thuộc F001_Auth).

**Related Data Models**:
- No data — không có thực thể; trạng thái duy nhất là cookie `NEXT_LOCALE` (`vi` hoặc `en`).

**Related Background Logic**:
- No data — không có BL###.

**Related Permissions**:
- No data — `permissions-matrix.md` không có PERM### nào cho ngôn ngữ (không có `locale-gate`); mọi khách đều đổi được ngôn ngữ.

---

### F003_Homepage: Homepage

**Type**: ui
**Status**: implemented
**Description**: Trang chủ SAA 2025 `/` chỉ dành cho người đã đăng nhập: header cố định (điều hướng, thông báo, ngôn ngữ, menu tài khoản có đăng xuất), hero ROOT FURTHER với đếm ngược tới `EVENT_START_AT`, thông tin sự kiện, lưới 6 hạng mục giải thưởng, khối Sun* Kudos, nút widget và footer. Đăng nhập xong người dùng vào `/` thay cho `/todo`; các trang đích còn thiếu (`/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin`) là trang giữ chỗ được bảo vệ, `/admin` chỉ cho admin.

**Workspace**: Next.js app (root)
**Languages**: TypeScript
**Components**: 15 thành phần hiển thị trong `app/(main)/_components`, hook và menu trong `app/(main)/_behavior`, container trong `app/(main)/_wiring`

**Related Screens**:
- SCR003_Homepage: Homepage

**Related User Stories**:
- TBD (draft) — mã US### toàn cục cấp khi đối chiếu sau khi có mã (xem `docs/features/F003_Homepage/functional-spec.md` § 7).

**Related APIs/Routes**:
- (GET) /
- (GET) /sun-kudos, /standards, /profile, /admin (trang giữ chỗ); `/awards-information` đã thành trang thật ở F004

**Related Data Models**:
- No data

**Related Background Logic**:
- No data

**Related Permissions**:
- TBD (draft) — mã PERM### cấp khi đối chiếu; xem `docs/system/permissions.md`.

---

### F004_AwardsInformation: Awards Information

**Type**: ui
**Status**: implemented
**Description**: Trang `/awards-information` (Hệ thống giải SAA 2025) chỉ dành cho người đã đăng nhập, thay trang giữ chỗ của F003: keyvisual và tiêu đề, menu 6 hạng mục (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) dính dưới header trên desktop và thành hàng tab cuộn ngang dưới 1024px; bấm mục thì cuộn mượt tới thẻ, đổi `#slug` bằng `replaceState`; cuộn trang thì mục active tự đổi theo phần đang xem; mở bằng `#slug` (từ thẻ trang chủ) thì tới đúng giải. Mỗi thẻ có ảnh, mô tả đầy đủ, số lượng và giá trị giải; cuối trang là khối Sun* Kudos dẫn tới `/sun-kudos`.

**Workspace**: Next.js app (root)
**Languages**: TypeScript
**Components**: `AwardsInformationPage` (`app/(main)/awards-information/page.tsx`); `AwardsInformationScreen`, `AwardsInformationHero`, `AwardsCategoryMenu`, `AwardDetailCard`, `award-icons` (`app/(main)/_components/awards-information/`); `AwardsCategoryMenuContainer`, `buildAwardsInformationProps`, `buildKudosPromoProps` (`app/(main)/_wiring/`); `useAwardCategorySpy`, `useKeepActiveTabInView`, `createScrollLock`, `parseAwardHash` (`app/(main)/_behavior/`); `AWARD_DETAILS` (`lib/awards/award-details.ts`); từ điển `lib/i18n/dictionary-awards-{vi,en}.ts`; `KudosPromo` thêm prop `variant` (`app/(main)/_components/kudos-promo.tsx`)

**Related Screens**:
- SCR004_AwardsInformation: Awards Information

**Related User Stories**:
- TBD (draft) — mã US### toàn cục cấp khi đối chiếu (xem `docs/features/F004_AwardsInformation/functional-spec.md`).

**Related APIs/Routes**:
- (GET) /awards-information

**Related Data Models**:
- No data

**Related Background Logic**:
- No data

**Related Permissions**:
- TBD (draft) — dùng lại lớp bảo vệ route của F003; xem `docs/system/permissions.md`.

### F005_CountdownPrelaunch: Countdown Prelaunch

**Type**: mixed
**Status**: implemented
**Description**: Trang `/prelaunch` công khai (route cấp cao ngoài `(main)`) đếm ngược tới `SITE_LAUNCH_AT` với ba khối Days, Hours, Minutes, kèm lớp khóa site trong `lib/supabase/proxy.ts`: trước mốc mọi đường dẫn ngoài `/login`, `/auth/*`, `/prelaunch` bị 307 về `/prelaunch`; từ mốc (hoặc khi biến thiếu/sai) `/prelaunch` chuyển về `/` và trang tự chuyển khi tới mốc.

**Workspace**: Next.js app (root)
**Languages**: TypeScript

**Related Screens**:
- SCR005_CountdownPrelaunch: Countdown Prelaunch

**Related User Stories**:
- TBD (draft) — mã US### toàn cục cấp khi đối chiếu (xem `docs/features/F005_CountdownPrelaunch/functional-spec.md`).

**Related APIs/Routes**:
- (GET) /prelaunch

**Related Data Models**:
- No data

**Related Background Logic**:
- No data

**Related Permissions**:
- PERM010_PrelaunchSiteLock: Khóa site trước ngày ra mắt, `/prelaunch` công khai

---

---

## Summary

- **Total Features**: 5
- **Total Screens**: 5
- **Total User Stories**: 8
- **Total Routes**: 10 (2 backend ROUTE###: ROUTE001, ROUTE002; 8 trang giao diện: /, /login, /todo, /awards-information, /sun-kudos, /standards, /profile, /admin)
- **Total Data Models**: 0
- **Total Background Logic**: 0
- **Total Permissions**: 9
- **Languages Detected**: TypeScript

## Cross-Reference Validation

- [x] All F### codes are unique
- [x] All F### codes are referenced in UserStories.md
- [x] All screen references are valid (SCR### or SCR###/REG### in ScreenList; bare-SCR refs and region refs both accepted)
- [x] All user story references are valid (US### in UserStories)
- [x] All route references are valid (ROUTE### in RouteList)
- [x] All data model references are valid (MODEL### in DataModel) — không có model nào để tham chiếu
- [x] All behavior logic references are valid (BL### in BehaviorLogic) — không có BL nào để tham chiếu
- [x] All permission references are valid (PERM### in Permissions)
- [x] Every US has a parent feature (F###)
- [x] Every screen has a parent feature (F###)
- [x] Every route maps to a feature (F###)
- [x] Every data model maps to a feature (F###) — không có model nào
- [x] Every background logic maps to a feature (F###) — không có BL nào
- [x] Every permission maps to a feature (F###)
